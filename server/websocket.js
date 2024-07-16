import express from 'express';
import { createServer } from 'http';
import https from 'https';
import jwt from 'jsonwebtoken';
import WebSocket, { WebSocketServer } from 'ws';
import httpsOptions from '../certificate/httpOptions.js';
import { sendPeriodicPortfolioData } from '../controllers/portfolioControllers.js';
import { fetchFromCache } from '../controllers/savefetchCache.js';
import User from '../models/userModel.js';
import { decryptData } from '../utils/encryption.js';
import { socketLogger } from '../utils/logger/logger.js';
import { fetchNews } from './newsserver.js';

let wss;
let server;
const connectedClients = new Map();
const rooms = { asset: [], news: [], portfolio: [], profile: [], others: [] };
let useremail = null;

//sample url
//wss://localhost:8081/?room=portfolio&jwt=string:0d4bdd8c8dd5469a1a7eb165637d3cfd9a02f61e67e071e1e4a7172ac412673bbb6c9fe2d2bcea536c186db25b4361f5280718f4c5b11c3ad7d25923eec3222dc549b359f8c2b1c07d37385b2bc98dba1c8a6f4a9bdce09f1847933c9e5c78a455ab023c68e6db650a9f1d560eda503d281a63f28e2700df271ba3553d93438cb277c7d49dc901e06df90de45493abd567e39cd7f60b954bc88c832ba2a71ff10565494de0c37ad983

export function createWebSocketServer() {
  const app = express();

  if (!wss) {
    // eslint-disable-next-line no-undef
    const isDevelopment = process.env.NODE_ENV == 'development';
    let protocol = 'http';

    if (isDevelopment) {
      server = https.createServer(httpsOptions, app);
      protocol = 'https';
    } else {
      server = createServer(app);
      protocol = 'http';
    }

    wss = new WebSocketServer({ server });

    wss.on('connection', async function connection(ws, req) {
      socketLogger.info("New client request received");
      const { searchParams } = new URL(req.url, `${protocol}://${req.headers.host}`);
      const room = searchParams.get('room');
      const jwtToken = searchParams.get('jwt');

      //checking if jwt is empty or not
      if (!jwt) {
        socketLogger.info("Web socket request failed : JWT required")
        ws.send(JSON.stringify({ error: 'JWT required' }));
        ws.close();
        return;
      }

      try {
        const decryptedToken = await decryptData(jwtToken);
        // eslint-disable-next-line no-undef
        const decoded = jwt.verify(decryptedToken, process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          socketLogger.error("User Token has expired");
          ws.send(JSON.stringify({ error: 'Token has expired' }));
          ws.close();
        }

        const user = await User.findOne({ email: decoded.email }, { LastPasswordChangeDate: 1 });
        if (Math.floor(user.LastPasswordChangeDate.getTime() / 1000) > decoded.iat || !user) {
          socketLogger.error("Token is invalid/expired or user not found");
          ws.send(JSON.stringify({ error: 'Token is invalid/expired or user not found' }));
          ws.close();
        }

        useremail = decoded.email;

      } catch (error) {
        socketLogger.info(`Invalid JWT token: ${error.message}`);
        ws.send(JSON.stringify({ error: 'Invalid JWT token' }));
        ws.close();
        return;
      }

      if (!['asset', 'news', 'portfolio', 'profile', 'others'].includes(room)) {
        socketLogger.info("Invalid room specified");
        ws.send(JSON.stringify({ error: 'Invalid room specified' }));
        ws.close();
        return;
      }
      if (!connectedClients.has(useremail)) {
        connectedClients.set(useremail, []);
      }

      // Add client to the rooms object
      if (!rooms[room]) {
        rooms[room] = []; // Initialize the array for the room
      }
      rooms[room].push(ws); // Add the WebSocket connection to the room

      connectedClients.get(useremail).push(ws);

      socketLogger.info(`New Client ${useremail} connected in room ${room}, Total Connected clients: ${connectedClients.size}`);


      //by default if a user joins a portfolio room then it will enable live portfolio
      if (room === 'portfolio') {
        ws.enableLivePortfolio = true;
        ws.email = useremail;
        sendPeriodicPortfolioData(ws, useremail);

        // Clean up when connection is closed
        ws.on('close', () => {
          ws.enableLivePortfolio = false;
          ws.email = '';
        });
      }

      ws.on('message', function incoming(message) {
        handleMessage(useremail, room, String(message), ws);
      });

      ws.on('close', function close() {
        const clientConnections = connectedClients.get(useremail);
        const index = clientConnections.indexOf(ws);
        if (index > -1) {
          clientConnections.splice(index, 1);
        }
        if (clientConnections.length === 0) {
          connectedClients.delete(useremail);
        }

        // Remove client from all rooms
        Object.keys(rooms).forEach(room => {
          const roomClients = rooms[room];
          const wsIndex = roomClients.indexOf(ws);
          if (wsIndex !== -1) {
            roomClients.splice(wsIndex, 1);
          }
        });

        socketLogger.info(`Client ${useremail} disconnected. Total Connected clients: ${connectedClients.size}`);
      });

      wss.on('error', function error(err) {
        socketLogger.error('WebSocket Server Error:', err);
      });

    });
    server.listen(8081, () => {
      socketLogger.info('WebSocket server is running on port 8081');
    });
  }

  return wss;
}

async function handleMessage(useremail, room, message, ws) {
  socketLogger.info(`Received message from ${useremail} in room ${room}: ${message}`);

  switch (room) {
    case "asset":
      switch (message) {
        case "index":
          { const previousIndexData = await fetchFromCache('previousIndexData');
          notifyClient(ws, { type: 'index', data: previousIndexData });
          break; }
        case "isMarketOpen":
          { const isMarketOpen = await fetchFromCache('isMarketOpen');
          notifyClient(ws, { type: 'marketOpen', data: isMarketOpen });
          break; }
        case "companylatestdata":
          { const companyLatestData = await fetchFromCache('AssetMergedDataShareSansar');
          notifyClient(ws, { type: 'companylatestdata', data: companyLatestData });
          break; }
        default:
          notifyClient(ws, { type: 'asset', data: 'Invalid command passed' });
      }
      break;

    case "news":
      switch (message) {
        case "news":
          { const newsData = await fetchNews(1, 10);
          notifyClient(ws, { type: 'news', data: newsData });
          break; }
        default:
          notifyClient(ws, { type: 'news', data: 'Invalid command passed' });
      }
      break;
    case "portfolio":
      switch (message) {
        case "portfolio":
          notifyClients({ type: 'portfolio', data: 'Live portfolio is already enabled' });
          break;
        default:
          notifyClient(ws, { type: 'portfolio', data: 'Invalid command passed' });
      }
      break;
    case "profile":
      switch (message) {
        case "profile":
          //nothing to do here, this room is just to notify user about profile changes
          break;
        default:
          notifyClient(ws, { type: 'profile', data: 'Invalid command passed' });
      }
      break;

    case "others":
      switch (message) {
        case "others":
          { const otherData = await fetchFromCache('otherData');
          notifyClient(ws, { type: 'others', data: otherData });
          break; }
      }
      break;

    default:
      socketLogger.info(`Invalid message received from ${useremail}: ${message}`);
  }
}

//notify clients in a specific room
//optional params email
//send in this room to this email client
export function notifyRoomClients(room, message, email = null) {
  if (!rooms[room]) {
    socketLogger.info(`Room ${room} does not exist.`);
    return;
  }

  const clientsInRoom = rooms[room];

  if (email) {
    const clientConnections = connectedClients.get(email) || [];
    const clientsInRoomWithEmail = clientConnections.filter(ws => clientsInRoom.includes(ws));

    if (clientsInRoomWithEmail.length > 0) {
      console.log(`Client with email ${email} found in room ${room}.`);
      clientsInRoomWithEmail.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          const messageString = JSON.stringify(message);
          ws.send(messageString);
        }
      });
    } else {
      socketLogger.info(`Client with email ${email} not found in room ${room}.`);
    }
  } else {
    clientsInRoom.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        const messageString = JSON.stringify(message);
        ws.send(messageString);
      }
    });
  }
}
// notify a specific client based on WebSocket connection (ws)
export function notifyClient(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    const messageString = JSON.stringify(message);
    ws.send(messageString);
  } else {
    socketLogger.info("Client state is not OPEN.");
  }
}

//has flaw, a client can be in multiple rooms
//so notifying clients even in not related room is annoying

//notify selected clients based on email
export function notifySelectedClients(useremail, message) {
  !wss && (socketLogger.info("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

  if (!connectedClients.has(useremail)) {
    socketLogger.info(`Client ${useremail} is not connected.`);
    return;
  }

  const clientConnections = connectedClients.get(useremail);
  clientConnections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      client.send(messageString);
    }
  });
}

//notify only given email client
export function notifyClientByEmail(wss, email, message) {
  if (!wss) {
    socketLogger.info("WSS ERROR: WebSocket Server is not available!");
    return;
  }

  const clients = connectedClients.get(email);
  if (clients) {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const messageString = JSON.stringify(message);
        client.send(messageString);
      } else {
        socketLogger.info(`Client state is not OPEN for email: ${email}.`);
      }
    });
  } else {
    socketLogger.info(`No clients found for email: ${email}.`);
  }
}

//notify all clients
export function notifyClients(message) {
  !wss && (socketLogger.info("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      client.send(messageString);
    } else {
      socketLogger.info("Client state is not OPEN. Error occurred.");
    }
  });
}

export function startWebSocketServer() {
  if (!wss) {
    createWebSocketServer();
  }
}


export { wss };