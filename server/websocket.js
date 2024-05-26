// import bcrypt from 'bcrypt';
// import express from 'express';
// import session from 'express-session';
// import { createServer } from 'http';
// import https from 'https';
// import { v4 as uuidv4 } from 'uuid';
// import WebSocket, { WebSocketServer } from 'ws';
// import httpsOptions from '../certificate/httpOptions.js';
// import { deleteFromCache, fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';
// import User from '../models/userModel.js';
// import { getIsMarketOpen, getPreviousIndexData, getTodayAllIndexData } from '../state/StateManager.js';
// import { socketLogger } from '../utils/logger/logger.js';

// let wss;
// let server;
// const connectedClients = new Map();

// function createWebSocketServer() {
//   const app = express();

//   //session middleware
//   app.use(session({
//     genid: function () {
//       return uuidv4()
//     },
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     proxy: true, //trust first proxy (nginx)
//     saveUninitialized: true,
//     cookie: {
//       httpsOnly: true,
//       secure: true,
//       sameSite: true,
//       maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
//     },
//   }));

//   if (!wss) {
//     const isDevelopment = process.env.NODE_ENV == 'development';

//     if (isDevelopment) {
//       server = https.createServer(httpsOptions, app);
//     } else {
//       server = createServer(app);
//     }

//     wss = new WebSocketServer({ server });

//     wss.on('connection', async function connection(ws, req) {
//       const protocol = isDevelopment ? 'https' : 'http';
//       const { searchParams } = new URL(req.url, `${protocol}://${req.headers.host}`);
//       const useremail = searchParams.get('email');
//       const password = searchParams.get('password');

//       //checking if id and pass is empty or not
//       if (!useremail || !password) {
//         socketLogger.info("Web socket request failed : Email and Password required")
//         ws.send(JSON.stringify({ error: 'Email and Password required' }));
//         ws.close();
//         return;
//       }

//       //protecting from brute force attack
//       let failedLoginAttempts = await fetchFromCache(`failedSocketLoginAttempts:${useremail}`);

//       if (!failedLoginAttempts) {
//         failedLoginAttempts = {};
//       }

//       if (failedLoginAttempts[useremail] && failedLoginAttempts[useremail].attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
//         const cooldownTimeRemaining = failedLoginAttempts[useremail].cooldownUntil - Date.now();

//         if (cooldownTimeRemaining > 0) {
//           const minutesRemaining = Math.ceil(cooldownTimeRemaining / (60 * 1000));
//           socketLogger.error(`Too many socket login attempts of ${useremail}. Please try again in ${minutesRemaining} minutes.`);
//           ws.send(JSON.stringify({ error: `Too many socket login attempts. Please try again in ${minutesRemaining} minutes.` }));
//           ws.close();
//           return;
//         } else {
//           delete failedLoginAttempts[useremail].attempts;
//         }
//       }

//       // Verify user credentials
//       const user = await User.findOne({ email: useremail });
//       if (!user || !(await bcrypt.compare(password, user.password))) {

//         if (!failedLoginAttempts[useremail]) {
//           failedLoginAttempts[useremail] = { attempts: 1, cooldownUntil: Date.now() + parseInt(process.env.COOLDOWN_TIME, 10) };
//         } else {
//           failedLoginAttempts[useremail].attempts++;
//         }
//         await saveToCache(`failedSocketLoginAttempts:${useremail}`, failedLoginAttempts);

//         socketLogger.info(`User not found or Invalid credentials: ${useremail}`);
//         ws.send(JSON.stringify({ error: 'User not found or Invalid credentials' }));
//         ws.close();
//       } else {
//         await deleteFromCache(`failedSocketLoginAttempts:${useremail}`);

//         socketLogger.info(`User verified: ${useremail}`);
//         ws.send(JSON.stringify({ info: 'User verified' }));
//       }

//       if (!connectedClients.has(useremail)) {
//         connectedClients.set(useremail, []);
//       }

//       connectedClients.get(useremail).push(ws);

//       socketLogger.info(`New Client connected: ${useremail}`);
//       socketLogger.info(`Total Connected clients: ${connectedClients.size}`);

//       ws.on('message', function incoming(message) {
//         handleMessage(useremail, message);
//       });

//       ws.on('close', function close() {
//         connectedClients.delete(useremail);
//         socketLogger.info(`Client disconnected: ${useremail}`);
//         socketLogger.info(`Total Connected clients: ${connectedClients.size}`);
//       });

//       wss.on('error', function error(err) {
//         socketLogger.error('WebSocket Server Error:', err);
//       });

//     });
//     server.listen(8081, () => {
//       socketLogger.info('WebSocket server is running on port 8081');
//     });
//   }

//   return wss;
// }

// //handle message sent by clients to socket
// async function handleMessage(useremail, message) {
//   socketLogger.info(`Received message from ${useremail}: ${message}`);

//   if (message == "index") {
//     const previousIndexData = await getPreviousIndexData();
//     notifySelectedClients(useremail, { type: 'index', data: previousIndexData });
//     return;
//   }

//   if (message == "indexAll") {
//     const todayAllIndexData = getTodayAllIndexData();
//     notifySelectedClients(useremail, { type: 'indexAll', data: todayAllIndexData });
//     return;
//   }

//   if (message == "marketOpen") {
//     const isMarketOpen = getIsMarketOpen();
//     notifySelectedClients(useremail, { type: 'marketOpen', data: isMarketOpen });
//     return;
//   }

//   socketLogger.info(`Message received from ${useremail}: ${message}`);
// }

// //notify selected clients
// function notifySelectedClients(useremail, message) {
//   !wss && (socketLogger.info("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

//   if (!connectedClients.has(useremail)) {
//     socketLogger.info(`Client ${useremail} is not connected.`);
//     return;
//   }

//   const clientConnections = connectedClients.get(useremail);
//   clientConnections.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) {
//       const messageString = JSON.stringify(message);
//       client.send(messageString);
//     }
//   });
// }

// //notify all clients
// function notifyClients(message) {
//   !wss && (socketLogger.info("WSS ERROR: WebSocket Server is not available!"), startWebSocketServer());

//   wss.clients.forEach(function each(client) {
//     if (client.readyState === WebSocket.OPEN) {
//       const messageString = JSON.stringify(message);
//       client.send(messageString);
//     } else {
//       socketLogger.info("Client state is not OPEN. Error occurred.");
//     }
//   });
// }

// export function closeWebSocketServer() {
//   if (wss) {
//     wss.close();
//   }
// }

// export function getWebSocketServer() {
//   return wss;
// }

// export function startWebSocketServer() {
//   if (!wss) {
//     createWebSocketServer();
//   }
// }

// export { createWebSocketServer, notifyClients, notifySelectedClients };



// import RedisStore from "connect-redis";
// import express from 'express';
// import session from 'express-session';
// import { createServer } from 'http';
// import https from 'https';
// import httpsOptions from '../certificate/httpOptions.js';
// import { Server } from 'socket.io';
// import { v4 as uuidv4 } from 'uuid';
// import { getIsMarketOpen, getPreviousIndexData, getTodayAllIndexData } from '../state/StateManager.js';
// import { socketLogger } from '../utils/logger/logger.js';
// import { redisclient } from "./redisServer.js";


// const isDevelopment = process.env.NODE_ENV === 'development';

// let app = express();
// let server = isDevelopment ? https.createServer(httpsOptions, app) : createServer(app);
// let io = new Server(server);
// const connectedClients = new Map();


// function startWebSocketServer() {


//   const sessionMiddleware = session({
//     genid: function () {
//       return uuidv4();
//     },
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     proxy: true,
//     saveUninitialized: true,
//     store: new RedisStore({ client: redisclient }),
//     cookie: {
//       httpsOnly: true,
//       secure: true,
//       sameSite: true,
//       maxAge: 10 * 24 * 60 * 60 * 1000
//     },
//   });

//   app.use(sessionMiddleware);

// // app.use(session({
// //   genid: function () {
// //     return uuidv4();
// //   },
// //   secret: process.env.SESSION_SECRET,
// //   resave: false,
// //   proxy: true,
// //   saveUninitialized: true,
// //   store: new RedisStore({ client: redisclient }),
// //   cookie: {
// //     httpsOnly: true,
// //     secure: true,
// //     sameSite: true,
// //     maxAge: 10 * 24 * 60 * 60 * 1000
// //   },
// // }));


// // Socket.IO middleware for session-based authentication
// io.use(async (socket, next) => {
//   sessionMiddleware(socket.request, {}, () => {
//     console.log(socket.request.session);
//     if (!socket.request.session.userEmail) {
//       return next(new Error('User not authenticated'));
//     }
//     next();
//   });
// });



// // let io;
// // let server;
// // const connectedClients = new Map();

// // function createSocketServer() {
// //   const app = express();

// //   // Session middleware
// //   app.use(session({
// //     genid: function () {
// //       return uuidv4();
// //     },
// //     secret: process.env.SESSION_SECRET,
// //     resave: false,
// //     proxy: true,
// //     saveUninitialized: true,
// //     store: new RedisStore({ client: redisclient }),
// //     cookie: {
// //       httpsOnly: true,
// //       secure: true,
// //       sameSite: true,
// //       maxAge: 10 * 24 * 60 * 60 * 1000
// //     },
// //   }));

// //   if (!io) {
// //     const isDevelopment = process.env.NODE_ENV === 'development';

// //     // Create a single server instance
// //     server = isDevelopment ? https.createServer(httpsOptions, app) : createServer(app);

// //     io = new Server(server, {
// //       cors: {
// //         origin: '*',
// //         methods: ['GET', 'POST']
// //       }
// //     });

// //     io.use(async (socket, next) => {
// //       let useremail = socket.handshake.headers.useremail;

// //       //i don't like this way of checking user email and password
// //       //instead let's use session to check if user is logged in or not

// //       if (!useremail) {
// //         return next(new Error('Email required'));
// //       }

// //       const { password } = socket.handshake.headers;

// //       if (!password) {
// //         return next(new Error('Password required'));
// //       }
// //       let failedLoginAttempts = await fetchFromCache(`failedSocketLoginAttempts:${useremail}`);

// //       if (!failedLoginAttempts) {
// //         failedLoginAttempts = {};
// //       }

// //       if (failedLoginAttempts[useremail] && failedLoginAttempts[useremail].attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
// //         const cooldownTimeRemaining = failedLoginAttempts[useremail].cooldownUntil - Date.now();

// //         if (cooldownTimeRemaining > 0) {
// //           const minutesRemaining = Math.ceil(cooldownTimeRemaining / (60 * 1000));
// //           return next(new Error(`Too many socket login attempts. Please try again in ${minutesRemaining} minutes.`));
// //         } else {
// //           delete failedLoginAttempts[useremail].attempts;
// //         }
// //       }

// //       const user = await User.findOne({ email: useremail });
// //       if (!user || !(await bcrypt.compare(password, user.password))) {
// //         if (!failedLoginAttempts[useremail]) {
// //           failedLoginAttempts[useremail] = { attempts: 1, cooldownUntil: Date.now() + parseInt(process.env.COOLDOWN_TIME, 10) };
// //         } else {
// //           failedLoginAttempts[useremail].attempts++;
// //         }
// //         await saveToCache(`failedSocketLoginAttempts:${useremail}`, failedLoginAttempts);
// //         return next(new Error('User not found or Invalid credentials'));
// //       } else {
// //         await deleteFromCache(`failedSocketLoginAttempts:${useremail}`);
// //         socket.useremail = useremail;
// //         next();
// //       }
// //     });

// io.on('connection', (socket) => { //start point in endpoint
//   const room = determineRoom(socket.handshake.headers.referer || '');

//   socket.join(room);

//   if (!connectedClients.has(useremail)) {
//     connectedClients.set(useremail, []);
//   }

//   connectedClients.get(useremail).push(socket.id);

//   socketLogger.info(`New Client connected: ${useremail}`);
//   socketLogger.info(`Joined room: ${room}`);
//   socketLogger.info(`Total Connected clients: ${connectedClients.size}`);

//   socket.on('message', (message) => {
//     handleMessage(useremail, message, room);
//   });

//   socket.on('disconnect', () => {
//     const clientConnections = connectedClients.get(useremail);
//     const index = clientConnections.indexOf(socket.id);
//     if (index > -1) {
//       clientConnections.splice(index, 1);
//     }
//     if (clientConnections.length === 0) {
//       connectedClients.delete(useremail);
//     }

//     socketLogger.info(`Client disconnected: ${useremail}`);
//     socketLogger.info(`Total Connected clients: ${connectedClients.size}`);
//   });

//   socket.on('error', (err) => {
//     socketLogger.error('Socket.IO Error:', err);
//   });
// });

// server.listen(8081, () => {
//   socketLogger.info('Socket.IO server is running on port 8081');
// });


// function determineRoom(url) {
//   if (url.includes('livedata')) {
//     return 'LiveData';
//   } else if (url.includes('index')) {
//     return 'Index';
//   } else if (url.includes('news')) {
//     return 'News';
//   }
//   return 'News';
// }

// // Handle message sent by clients to socket
// async function handleMessage(useremail, message, room) {

//   if (message === 'index' && room === 'Index') {
//     const previousIndexData = await getPreviousIndexData();
//     io.to(room).emit('message', { type: 'index', data: previousIndexData });
//     return;
//   }

//   if (message === 'indexAll' && room === 'Index') {
//     const todayAllIndexData = await getTodayAllIndexData();
//     io.to(room).emit('message', { type: 'indexAll', data: todayAllIndexData });
//     return;
//   }

//   if (message === 'marketOpen' && room === 'LiveData') {
//     const isMarketOpen = await getIsMarketOpen();
//     io.to(room).emit('message', { type: 'marketOpen', data: isMarketOpen });
//     return;
//   }

//   socketLogger.info(`Message received from ${useremail} in room ${room}: ${message}`);
// }
// }

// // Notify all clients in a room
// function notifyClientsInRoom(room, message) {
//   if (!io) {
//     socketLogger.info("Socket.IO server is not available!");
//     startWebSocketServer();
//   }

//   io.to(room).emit('message', message);
// }

// // Notify all clients
// function notifyClients(message) {
//   if (!io) {
//     socketLogger.info("Socket.IO server is not available!");
//     startWebSocketServer();
//   }

//   io.emit('message', message);
// }

// // Notify a specific client
// function notifySelectedClients(useremail, message) {
//   if (!io) {
//     socketLogger.info("Socket.IO server is not available!");
//     startWebSocketServer();
//   }

//   const clientConnections = connectedClients.get(useremail);
//   if (clientConnections) {
//     clientConnections.forEach(socketId => {
//       io.to(socketId).emit('message', message);
//     });
//   } else {
//     socketLogger.info(`Client ${useremail} is not connected.`);
//   }
// }

// export function closeSocketServer() {
//   if (io) {
//     io.close();
//   }
// }

// export { startWebSocketServer, notifyClients, notifyClientsInRoom, notifySelectedClients };




// Now, you can use these functions to send messages to specific clients or all clients in a room. For example, to notify a specific client with the email abc@user.com:

// javascript
// Copy code
// notifySpecificClient('abc@user.com', { type: 'notification', data: 'Your custom message' });
// To notify all clients in the 'LiveData' room:

// javascript
// Copy code
// notifyClientsInRoom('LiveData', { type: 'update', data: 'Live data update' });
// To notify all connected clients:

// javascript
// Copy code
// notifyAllClients({ type: 'announcement', data: 'Global announcement' });



import bcrypt from 'bcrypt';
import RedisStore from "connect-redis";
import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';
import httpsOptions from '../certificate/httpOptions.js';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';
import User from '../models/userModel.js';
import { socketLogger } from '../utils/logger/logger.js';
import { fetchNews } from './newsserver.js';
import { redisclient } from "./redisServer.js";

let wss;
let server;
const connectedClients = new Map();
const rooms = { asset: [], news: [], userdata: [], others: [] };


export function createWebSocketServer() {
  const app = express();

  app.use(session({
    genid: function () {
      return uuidv4()
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    proxy: true,
    saveUninitialized: true,
    store: new RedisStore({ client: redisclient }),
    cookie: {
      httpsOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 10 * 24 * 60 * 60 * 1000
    },
  }));

  if (!wss) {
    const isDevelopment = process.env.NODE_ENV == 'development';
    let protocol = 'http'; //just in case

    if (isDevelopment) {
      server = https.createServer(httpsOptions, app);
      protocol = 'https';
    } else {
      server = createServer(app);
      protocol = 'http';
    }

    wss = new WebSocketServer({ server });

    wss.on('connection', async function connection(ws, req) {
      const { searchParams } = new URL(req.url, `${protocol}://${req.headers.host}`);
      const useremail = searchParams.get('email');
      const password = searchParams.get('password');
      const room = searchParams.get('room');

      //checking if id and pass is empty or not
      if (!useremail || !password) {
        socketLogger.info("Web socket request failed : Email and Password required")
        ws.send(JSON.stringify({ error: 'Email and Password required' }));
        ws.close();
        return;
      }

      // Validate room
      if (!rooms[room]) {
        socketLogger.info("Invalid room specified");
        ws.send(JSON.stringify({ error: 'Invalid room specified' }));
        ws.close();
        return;
      }

      rooms[room].push(ws);

      //protecting from brute force attack
      let failedLoginAttempts = await fetchFromCache(`failedSocketLoginAttempts:${useremail}`);

      if (!failedLoginAttempts) {
        failedLoginAttempts = {};
      }

      if (failedLoginAttempts[useremail] && failedLoginAttempts[useremail].attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
        const cooldownTimeRemaining = failedLoginAttempts[useremail].cooldownUntil - Date.now();

        if (cooldownTimeRemaining > 0) {
          const minutesRemaining = Math.ceil(cooldownTimeRemaining / (60 * 1000));
          socketLogger.error(`Too many socket login attempts of ${useremail}. Please try again in ${minutesRemaining} minutes.`);
          ws.send(JSON.stringify({ error: `Too many socket login attempts. Please try again in ${minutesRemaining} minutes.` }));
          ws.close();
          return;
        } else {
          delete failedLoginAttempts[useremail].attempts;
        }
      }

      // Verify user credentials
      const user = await User.findOne({ email: useremail });
      if (!user || !(await bcrypt.compare(password, user.password))) {

        if (!failedLoginAttempts[useremail]) {
          failedLoginAttempts[useremail] = { attempts: 1, cooldownUntil: Date.now() + parseInt(process.env.COOLDOWN_TIME, 10) };
        } else {
          failedLoginAttempts[useremail].attempts++;
        }
        await saveToCache(`failedSocketLoginAttempts:${useremail}`, failedLoginAttempts);

        socketLogger.info(`User not found or Invalid credentials: ${useremail}`);
        ws.send(JSON.stringify({ error: 'User not found or Invalid credentials' }));
        ws.close();
      }
      // else {  //spam jasto vayo
      //   await deleteFromCache(`failedSocketLoginAttempts:${useremail}`);
      //   ws.send(JSON.stringify({ info: 'Connected successfully' }));
      // }

      if (!connectedClients.has(useremail)) {
        connectedClients.set(useremail, []);
      }

      connectedClients.get(useremail).push(ws);

      socketLogger.info(`New Client ${useremail} connected in room ${room}, Total Connected clients: ${connectedClients.size}`);

      ws.on('message', function incoming(message) {
        handleMessage(useremail, room, String(message), ws);
      });

      ws.on('close', function close() {
        connectedClients.delete(useremail);

        // Remove client from all rooms
        Object.values(rooms).forEach(roomArray => {
          const index = roomArray.indexOf(ws);
          if (index !== -1) {
            roomArray.splice(index, 1);
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
          const previousIndexData = await fetchFromCache('previousIndexData');
          notifyClient(ws, { type: 'index', data: previousIndexData });
          break;
        case "isMarketOpen":
          const isMarketOpen = await fetchFromCache('isMarketOpen');
          notifyClient(ws, { type: 'marketOpen', data: isMarketOpen });
          break;
        case "companylatestdata":
          const companyLatestData = await fetchFromCache('AssetMergedDataShareSansar');
          notifyClient(ws, { type: 'companylatestdata', data: companyLatestData });
          break;
        default:
          notifyClient(ws, { type: 'asset', data: 'Invalid command passed' });
      }
      break;

    case "news":
      switch (message) {
        case "news":
          const newsData = await fetchNews(1, 10);
          notifyClient(ws, { type: 'news', data: newsData });
          break;
        default:
          notifyClient(ws, { type: 'news', data: 'Invalid command passed' });
      }
      break;
    case "userdata":
      switch (message) {
        case "liveportfolio":
          ws.enableLivePortfolio = true;
          ws.email = useremail;

          //clean up when connection is closed
          ws.on('close', () => {
            ws.enableLivePortfolio = false;
            ws.email = '';
          });

          break;
        default:
          notifyClient(ws, { type: 'userdata', data: 'Invalid command passed' });
      }
      break;

    case "others":
      switch (message) {
        case "others":
          const otherData = await fetchFromCache('otherData');
          notifyClient(ws, { type: 'others', data: otherData });
          break;
      }
      break;

    default:
      socketLogger.info(`Invalid message received from ${useremail}: ${message}`);
  }
}

//notify clients in a specific room
export function notifyRoomClients(room, message) {
  if (!rooms[room]) {
    socketLogger.info(`Room ${room} does not exist.`);
    return;
  }

  const clientsInRoom = rooms[room];
  console.log(`Clients in room ${room}: ${clientsInRoom.length}`);
  clientsInRoom.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      client.send(messageString);
    }
  });
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



//who subscribed to what room

//getNews