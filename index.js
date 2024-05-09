//package imports
import bodyParser from "body-parser";
import { v2 as cloudinary } from "cloudinary";
import multipart from "connect-multiparty";
import cors from "cors";
//import dotenv from "dotenv";
import 'dotenv/config';
import express from "express";
import httpsOptions from "./certificate/httpOptions.js";

//
import session from 'express-session';
import https from "https";
import { clean } from "perfect-express-sanitizer";
import { v4 as uuidv4 } from 'uuid';

//file imports
import initializeRefreshMechanism, { ActiveServer } from "./controllers/refreshController.js";
import { Database } from "./database/db.js";
import { responseTimeMiddleware } from "./middleware/apiResponseTime.js";
import userRouter from "./routes/appRoutes.js";
import { startNewsServer } from "./server/newsserver.js";
import { redisclient } from "./server/redisServer.js";
import { startWebSocketServer } from "./server/websocket.js";
import { mainLogger } from './utils/logger/logger.js';
import dynamicRoutes from "./utils/routesforIndex.js";
import { sessionMiddleware } from './middleware/session.js';


//Express Middlewares
const app = express();
const port = process.env.PORT || 4000;
const isDevelopment = process.env.NODE_ENV == "development";

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

// Use body-parser middleware to parse url-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use perfect-express-sanitizer middleware to sanitize user input
app.use(
  clean({
    xss: true,
    noSql: true,
    sql: true,
    sqlLevel: 5,
    noSqlLevel: 5,
  })
);

// Use connect-multiparty middleware to parse multipart/form-data bodies
app.use(multipart());

//database
Database();

// var allowedDomains = ['https:localhost:3000', 'https://tenpaisa.tech'];

// app.use(cors({
//   origin: function (origin, callback) {
//     console.log('Origin: ', origin);
//     if (!origin) return callback(null, true);
//     if (allowedDomains.indexOf(origin) === -1) {
//       var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true,
//   flightContinue: true
// }));

// const allowedOrigins = process.env.ALLOWED_ORIGINS || ''
// const allowedOriginsArray = allowedOrigins.split(",").map(item => item.trim());
// console.log('Allowed Origins: ', allowedOriginsArray);

// const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin);

// const cors = cors({
//   origin: (origin, callback) => {
//     allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'))
//   },
//   allowedHeaders: [
//     'access-control-allow-origin',
//     'authorization',
//     'Pragma',
//     'contact',
//   ],
//   exposeHeaders: []
// })
// const whitelist =
//   [https://localhost:3000,
//   https://tenpaisa.tech]
// var whitelist = ['https:localhost:3000', 'https://tenpaisa.tech']
// var corsOptions = {
//   preflightContinue: true,
//   credentials: true,
//   origin: function (origin, callback) {
//     console.log('Origin: ', origin);
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true)
//     } else {
//       console.log('Origin: ', origin);
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }

// app.use(cors(corsOptions));
// const corsOptions = {
//   credentials: true,
//   flightContinue: true,
//   origin: ["https://localhost:3000", "https://tenpaisa.tech"],

// };
// app.use(cors(corsOptions));
// app.use(function(req, res, next) {
//   var allowedOrigins = ['http://127.0.0.1:8020', 'http://localhost:8020', 'http://127.0.0.1:9000', 'http://localhost:9000'];
//   var origin = req.headers.origin;
//   if(allowedOrigins.indexOf(origin) > -1){
//        res.setHeader('Access-Control-Allow-Origin', origin);
//   }
//   //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
//   res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header('Access-Control-Allow-Credentials', true);
//   return next();
// });

const corsOptions = {
  flightContinue: true,
  origin: isDevelopment ? 'https://localhost:3000' : 'https://tenpaisa.tech',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));
// \app.use(cors({ origin: '*', flightContinue: true }));

//session middleware
app.use(session({
  genid: function () {
    return uuidv4()
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  proxy: true,
  saveUninitialized: true,
  cookie: {
    httpsOnly: true,
    secure: true,
    sameSite: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
}));

app.use(responseTimeMiddleware);
app.use(sessionMiddleware);

//cloudnary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//starting server

if (isDevelopment) {
  const server = https.createServer(httpsOptions, app);
  mainLogger.info("Starting Development Server");
  server.listen(port, () => {
    mainLogger.info(`Development Server is running on port ${port}`);
  });
} else {
  mainLogger.info("Starting Production Server");
  app.listen(port, () => {
    mainLogger.info(`Production Server is running on port ${port}`);
  });
}

//connect to redis server //if redis is enabled
const useRedis = process.env.USEREDIS;
if (useRedis == "true") {
  await redisclient.connect();
  mainLogger.info(
    redisclient.isOpen
      ? "Connected to Redis Server"
      : "Not connected to Redis Server"
  );

  redisclient.on("error", (error) => {
    mainLogger.error("Redis client error:", error);
  });

  app.on("close", () => {
    redisclient.disconnect();
  });
}

//others servers
ActiveServer();
initializeRefreshMechanism();
startWebSocketServer();
startNewsServer(app);


//routes
app.use("/api", userRouter);
app.get("/", dynamicRoutes);

//exports
export default app;
