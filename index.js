/* eslint-disable no-undef */
//package imports
import { v2 as cloudinary } from "cloudinary";
import multipart from "connect-multiparty";
import cors from "cors";
import 'dotenv/config';
import express from "express";
import httpsOptions from "./certificate/httpOptions.js";

//
import io from '@pm2/io';
import compression from "compression";
import RedisStore from "connect-redis";
import { rateLimit } from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import hppPrevent from 'hpp-prevent';
import https from "https";
import { clean } from "perfect-express-sanitizer";
import { RedisStore as RateLimitRedisStore } from 'rate-limit-redis';
import { v4 as uuidv4 } from 'uuid';


//file imports
import initializeRefreshMechanism, { ActiveServer } from "./controllers/refreshController.js";
import { Database } from "./database/db.js";
import { responseTimeMiddleware } from "./middleware/apiResponseTime.js";
//import { sessionMiddleware } from './middleware/session.js';
import userRouter from "./routes/appRoutes.js";
import { getNews, initiateNewsFetch } from "./server/newsserver.js";
import { redisclient } from "./server/redisServer.js";
import { startWebSocketServer } from "./server/websocket.js";
import { errorHandler, mainLogger } from './utils/logger/logger.js';
import dynamicRoutes from "./utils/routesforIndex.js";

//Express Middlewares
const app = express();
app.use(helmet());

//conect to redis earliy
await redisclient.connect();

mainLogger.info(
  redisclient.isOpen
    ? "Connected to Redis Server"
    : "Not connected to Redis Server"
);

//session
app.use(session({
  genid: function () {
    return uuidv4()
  },
  name: "tenpaisa.session",

  secret: process.env.SESSION_SECRET,
  resave: false,
  proxy: true,
  store: new RedisStore({ client: redisclient }),
  saveUninitialized: true,
  cookie: {
    httpsOnly: true,
    secure: true,
    sameSite: true,
    maxAge: 10 * 24 * 60 * 60 * 1000,
    priority: 'High',
    path: '/'
  },
}));

// app.use(
//   helmet.hidePoweredBy,
//   helmet.noSniff(),
//   helmet.xssFilter(),
//   helmet.frameguard(),
//   helmet.dnsPrefetchControl(),
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'"],
//       scriptSrcAttr: ["'unsafe-inline'"]
//     },
//   })
// );

app.use(
  helmet.hidePoweredBy(),
  helmet.noSniff(),
  helmet.xssFilter(),
  helmet.frameguard(),
  helmet.dnsPrefetchControl(),
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      objectSrc: ["'none'"]
    },
  })
);



const port = process.env.PORT || 4000;

const isDevelopment = process.env.NODE_ENV == "development";

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

app.use(express.urlencoded({ extended: true, limit: "1kb" })); //limiting the size of the body to 1kb
//app.use(hppPrevent.hppPrevent); //Use hpp middleware to prevent HTTP Parameter Pollution attacks

app.use(hppPrevent.hppPrevent({
  takeLastOcurrences: true,
  deepSearch: true
}));

//Use perfect-express-sanitizer middleware to sanitize user input
const whiteList = ["/api/user/updateprofilepic"]; //for some reason files are not being uploaded

app.use(
  clean({
    xss: true,
    noSql: true,
    sql: true,
    sqlLevel: 5,
    noSqlLevel: 5,
    allowedKeys: ["user"],
  },
    whiteList
  )
);

const corsOptions = {
  flightContinue: true,
  origin: isDevelopment ? 'https://localhost:3000' : 'https://tenpaisa.tech',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST'],
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'xsrf-token']
};
app.use(cors(corsOptions));


// const allowedOrigins = [
//   process.env.CLIENT,
//   process.env.LOCAL
// ]
// var corsOptions = {
//   origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//           callback(null, true);
//       } else {
//           callback(new Error('Not allowed by CORS'));
//       }
//   },
//   optionsSuccessStatus: 200
// }

// app.use(cors(corsOptions));


//session middleware
app.use(responseTimeMiddleware);

// Use compression middleware to compress responses
app.use(compression({
  level: 8,
  threshold: 0,
}));

// Use connect-multiparty middleware to parse multipart/form-data bodies
app.use(multipart());

//database
Database();

//cloudnary config
cloudinary.config({

  cloud_name: process.env.CLOUD_NAME,

  api_key: process.env.API_KEY,

  api_secret: process.env.API_SECRET,
});


//server
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

  io.init({
    transactions: true,
    http: true,
    errors: true,
    memory: true,
    cpu: true,
    eventLoop: true,
    counter: true,
  });
}

//rate limiting middleware // 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  store: new RateLimitRedisStore({
    sendCommand: (...args) => redisclient.sendCommand(args),
  }),
});

app.set('trust proxy', 1); // trust first proxy for rate limiting
app.use(limiter);

//others servers
ActiveServer();
initializeRefreshMechanism();
startWebSocketServer();
initiateNewsFetch();

//app.use(cookieParser()); //using this cookie parser for csrf token to work
//this is because session has its own cookie parser but someohow it is not working with csrf token

// app.use((req, res, next) => {
//   const headers = req.headers;
//   mainLogger.info(`Request Headers: ${JSON.stringify(headers)}`);
//   next();
// });
// //add counter to any requests
// app.use((req, res, next) => {
//   counter.inc();
//   next();
// });

//routes
app.use("/api", userRouter);  //this route is protected with csrf token
app.get("/", dynamicRoutes);
app.get("/news", getNews);
app.get("/ping", (req, res) => {
  res.send("Hello there");
});

//error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found on this server.' });
});

errorHandler(app); //global error handling

redisclient.on("error", (error) => {
  mainLogger.error("Redis client error:", error);
});

app.on("close", () => {
  redisclient.disconnect();
});

process.on('uncaughtException', (err) => {
  mainLogger.error(`Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  mainLogger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

export default app;
