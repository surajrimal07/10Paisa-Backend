import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';

let wss;

function createWebSocketServer() {
  const app = express();

  if (!wss) {
    const server = createServer(app);

    wss = new WebSocketServer({ server });

    wss.on('connection', function connection(ws) {
      console.log('Client connected to WebSocket server');
    });

    wss.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    wss.on('close', function close() {
      console.log('WebSocket Server closed');
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

function notifyClients(message) {
  if (!wss) {
    console.log("WSS ERROR: Web Socket Server is not available!");
    startWebSocketServer();
    return;
  }

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

export { createWebSocketServer, notifyClients };