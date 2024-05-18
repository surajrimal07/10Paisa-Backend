import bcrypt from 'bcrypt';
import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';
import httpsOptions from '../certificate/httpOptions.js';
import { deleteFromCache, fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';
import User from '../models/userModel.js';
import { getIsMarketOpen, getPreviousIndexData, getTodayAllIndexData } from '../state/StateManager.js';
import { socketLogger } from '../utils/logger/logger.js';

let wss;
let server;
const connectedClients = new Map();

function createWebSocketServer() {
  const app = express();

  //session middleware
  app.use(session({
    genid: function () {
      return uuidv4()
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    proxy: true, //trust first proxy (nginx)
    saveUninitialized: true,
    cookie: {
      httpsOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
  }));

  if (!wss) {
    const isDevelopment = process.env.NODE_ENV == 'development';

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

      //checking if id and pass is empty or not
      if (!userEmail || !password) {
        socketLogger.info("Web socket request failed : Email and Password required")
        ws.send(JSON.stringify({ error: 'Email and Password required' }));
        ws.close();
        return;
      }

      //protecting from brute force attack
      let failedLoginAttempts = await fetchFromCache(`failedSocketLoginAttempts:${userEmail}`);

      if (!failedLoginAttempts) {
        failedLoginAttempts = {};
      }

      if (failedLoginAttempts[userEmail] && failedLoginAttempts[userEmail].attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
        const cooldownTimeRemaining = failedLoginAttempts[userEmail].cooldownUntil - Date.now();

        if (cooldownTimeRemaining > 0) {
          const minutesRemaining = Math.ceil(cooldownTimeRemaining / (60 * 1000));
          socketLogger.error(`Too many login attempts of ${userEmail}. Please try again in ${minutesRemaining} minutes.`);
          ws.send(JSON.stringify({ error: `Too many login attempts. Please try again in ${minutesRemaining} minutes.` }));
          ws.close();
          return;
        } else {
          delete failedLoginAttempts[userEmail].attempts;
        }
      }

      // Verify user credentials
      const user = await User.findOne({ email: userEmail });
      if (!user || !(await bcrypt.compare(password, user.password))) {

        if (!failedLoginAttempts[userEmail]) {
          failedLoginAttempts[userEmail] = { attempts: 1, cooldownUntil: Date.now() + parseInt(process.env.COOLDOWN_TIME, 10) };
        } else {
          failedLoginAttempts[userEmail].attempts++;
        }
        await saveToCache(`failedSocketLoginAttempts:${userEmail}`, failedLoginAttempts);

        socketLogger.info(`User not found or Invalid credentials: ${userEmail}`);
        ws.send(JSON.stringify({ error: 'User not found or Invalid credentials' }));
        ws.close();
      } else {
        await deleteFromCache(`failedSocketLoginAttempts:${userEmail}`);

        socketLogger.info(`User verified: ${userEmail}`);
        ws.send(JSON.stringify({ info: 'User verified' }));
      }

      if (!connectedClients.has(userEmail)) {
        connectedClients.set(userEmail, []);
      }

      connectedClients.get(userEmail).push(ws);

      socketLogger.info(`New Client connected: ${userEmail}`);
      socketLogger.info(`Total Connected clients: ${connectedClients.size}`);

      ws.on('message', function incoming(message) {
        handleMessage(userEmail, message);
      });

      ws.on('close', function close() {
        connectedClients.delete(userEmail);
        socketLogger.info(`Client disconnected: ${userEmail}`);
        socketLogger.info(`Total Connected clients: ${connectedClients.size}`);
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

//handle message sent by clients to socket
async function handleMessage(userEmail, message) {
  socketLogger.info(`Received message from ${userEmail}: ${message}`);

  if (message == "index") {
    const previousIndexData = await getPreviousIndexData();
    notifySelectedClients(userEmail, { type: 'index', data: previousIndexData });
    return;
  }

  if (message == "indexAll") {
    const todayAllIndexData = getTodayAllIndexData();
    notifySelectedClients(userEmail, { type: 'indexAll', data: todayAllIndexData });
    return;
  }

  if (message == "marketOpen") {
    const isMarketOpen = getIsMarketOpen();
    notifySelectedClients(userEmail, { type: 'marketOpen', data: isMarketOpen });
    return;
  }

  socketLogger.info(`Message received from ${userEmail}: ${message}`);
}

//notify selected clients
function notifySelectedClients(userEmail, message) {
  !wss && (socketLogger.info("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

  if (!connectedClients.has(userEmail)) {
    socketLogger.info(`Client ${userEmail} is not connected.`);
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

