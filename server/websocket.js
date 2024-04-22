import express from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import User from '../models/userModel.js';

let wss;
const connectedClients = new Map();

function createWebSocketServer() {
  const app = express();

  if (!wss) {
    const server = createServer(app);
    wss = new WebSocketServer({ server });

    wss.on('connection', async function connection(ws,req) {
      //now ask password too in params
      //const userEmail = new URL(req.url, `http://${req.headers.host}`).searchParams.get('email');
      const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
      const userEmail = searchParams.get('email');
      const password = searchParams.get('password');

      //checking if id and pass is empty or not
      if (!userEmail || !password) {
        console.log("Web socket request failed : Email and Password required")
        ws.send(JSON.stringify({ error: 'Email and Password required' }));
        ws.close();
        return;
      }

      // Verify user credentials
      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (!user) {
        console.log(`User not found for email: ${userEmail}`);
        ws.send(JSON.stringify({ error: 'Email not found' }));
        ws.close();
        return;
      }

      // Verify user password
      if (!user.comparePassword(password)) {
        console.log(`Invalid credentials for user: ${userEmail}`);
        ws.send(JSON.stringify({ error: 'Invalid credentials' }));
        console.log("Web socket request failed : Invalid credentials for email: ", userEmail);
        ws.close();
        return;
      } else {
        ws.send(JSON.stringify({ info: 'User verified' }));
      }

      if (!connectedClients.has(userEmail)) {
        connectedClients.set(userEmail, []);
      }

      connectedClients.get(userEmail).push(ws);

      console.log(`New Client connected: ${userEmail}`);
      console.log(`Total Connected clients: ${connectedClients.size}`);
    });

    wss.on('message', function incoming(message) {
      console.log(`Received message from ${userEmail}: ${message}`);
    });

    wss.on('close', function close() {
      connectedClients.delete(userEmail);
      console.log(`Client disconnected: ${userEmail}`);
      console.log(`Total Connected clients: ${connectedClients.size}`);
    });

    wss.on('error', function error(err) {
      console.error('WebSocket Server Error:', err);
    });

    if (wss.readyState === WebSocketServer.OPEN) {
      console.log('WebSocket connection is open.');
    }

    server.listen(8081, () => {
      console.log('WebSocket server is running on port 8081');
    });
  }

  return wss;
}

//notify selected clients
function notifySelectedClients(userEmail, message) {
  !wss && (console.log("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

  if (!connectedClients.has(userEmail)) {
    console.log(`Client ${userEmail} is not connected.`);
    return;
  }

  const clientConnections = connectedClients.get(userEmail);
  clientConnections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      client.send(messageString);
    }
  });
}

//notify all clients
function notifyClients(message) {
  !wss && (console.log("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      client.send(messageString);
    } else {
      console.log("Client state is not OPEN. Error occurred.");
    }
  });
}

export function closeWebSocketServer() {
    if (wss) {
      wss.close();
    }
  }

  export function getWebSocketServer() {
    return wss;
  }

 export function startWebSocketServer() {
    if (!wss) {
      createWebSocketServer();
    }
  }

export { createWebSocketServer, notifyClients, notifySelectedClients };

