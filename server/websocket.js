import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import https from 'https';
import WebSocket, { WebSocketServer } from 'ws';
import httpsOptions from '../certificate/httpOptions.js';
import User from '../models/userModel.js';
import { getIsMarketOpen, getPreviousIndexData, getTodayAllIndexData } from '../state/StateManager.js';


dotenv.config();
let wss;
let server;
const connectedClients = new Map();

function createWebSocketServer() {
  const app = express();

  if (!wss) {
    const isDevelopment = process.env.NODE_ENV== 'development';

    if (isDevelopment) {
      server = https.createServer(httpsOptions, app);
    } else {
      server = createServer(app);
    }

    wss = new WebSocketServer({ server });

    wss.on('connection', async function connection(ws, req) {
      const protocol = isDevelopment ? 'https' : 'http';
      const { searchParams } = new URL(req.url, `${protocol}://${req.headers.host}`);
      const userEmail = searchParams.get('email');
      const password = searchParams.get('password');
      console.log("Web socket request received : ", userEmail, password);

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
        ws.send(JSON.stringify({ error: 'User not found' }));
        ws.close();
      } else if (!(await bcrypt.compare(password, user.password))) {
        console.log(`Invalid credentials for user: ${userEmail}`);
        ws.send(JSON.stringify({ error: 'Invalid credentials' }));
        ws.close();
      } else {
        console.log(`User verified: ${userEmail}`);
        ws.send(JSON.stringify({ info: 'User verified' }));
      }

      if (!connectedClients.has(userEmail)) {
        connectedClients.set(userEmail, []);
      }

      connectedClients.get(userEmail).push(ws);

      console.log(`New Client connected: ${userEmail}`);
      console.log(`Total Connected clients: ${connectedClients.size}`);

      ws.on('message', function incoming(message) {
        handleMessage(userEmail, message);
      });

      ws.on('close', function close() {
        connectedClients.delete(userEmail);
        console.log(`Client disconnected: ${userEmail}`);
        console.log(`Total Connected clients: ${connectedClients.size}`);
      });

      wss.on('error', function error(err) {
        console.error('WebSocket Server Error:', err);
      });

    });
    server.listen(8081, () => {
      console.log('WebSocket server is running on port 8081');
    });
  }

  return wss;
}

//handle message sent by clients to socket
async function handleMessage(userEmail, message) {
  console.log(`Received message from ${userEmail}: ${message}`);

  if (message == "index") {
    const previousIndexData = getPreviousIndexData();
    notifySelectedClients(userEmail, { type: 'index', data: previousIndexData });
    return;
  }

  if (message == "indexAll"){
    const todayAllIndexData = getTodayAllIndexData();
    notifySelectedClients(userEmail, { type: 'indexAll', data: todayAllIndexData });
    return;
  }

  if (message == "marketOpen"){
    const isMarketOpen = getIsMarketOpen();
    notifySelectedClients(userEmail, { type: 'marketOpen', data: isMarketOpen });
    return;
  }

  console.log(`Message received from ${userEmail}: ${message}`);
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

