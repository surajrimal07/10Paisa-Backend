/* eslint-disable no-undef */
//package imports
import { v2 as cloudinary } from "cloudinary";
import multipart from "connect-multiparty";
import cors from "cors";
import 'dotenv/config';
import express from "express";
import httpsOptions from "./certificate/httpOptions.js";
import initializeRefreshMechanism,  {fetchFloorsheetData} from "./controllers/refreshController.js";
//
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
import { PrimaryDatabase } from "./database/db.js";
import { responseTimeMiddleware } from "./middleware/apiResponseTime.js";
import userRouter from "./routes/appRoutes.js";
import { getNews, initiateNewsFetch, updateNewsViewCount } from "./server/newsserver.js";
import { redisclient } from "./server/redisServer.js";
import { startWebSocketServer } from "./server/websocket.js";
import { errorHandler, mainLogger } from './utils/logger/logger.js';
import dynamicRoutes from "./utils/routesforIndex.js";
import { isDevelopment } from "./database/db.js";

export const isServerPrimary = process.env.IS_PRIMARY_SERVER === 'true';

//Express Middlewares
const app = express();
app.enable('trust proxy', 1);

const corsOptions = {
  flightContinue: true,
  origin: ['https://localhost:3000', 'https://tenpaisa.tech', 'http://localhost:3000'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST'],
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'xsrf-token']
};
app.use(cors(corsOptions));

app.use(helmet());

//conect to redis earliy
await redisclient.connect();

//session
app.use(session({
  genid: function () {
    return uuidv4()
  },
  name: "tenpaisa.session",

  secret: process.env.SESSION_SECRET,
  resave: false,
  //  proxy: true,
  store: new RedisStore({ client: redisclient }),
  saveUninitialized: true,
  cookie: {
    httpsOnly: false, //true // this cause issue with reverse proxies and cloudflare tunnels
    //like session being random and not being able to login
    secure: true,
    sameSite: 'none', //sameSite: true,
    //sameSite: true,
    maxAge: 10 * 24 * 60 * 60 * 1000,
    priority: 'High',
    path: '/'
  },
}));

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
await PrimaryDatabase();

//cloudnary config
await cloudinary.config({

  cloud_name: process.env.CLOUD_NAME,

  api_key: process.env.API_KEY,

  api_secret: process.env.API_SECRET,
});

//server
if (isDevelopment) {
  const server = https.createServer(httpsOptions, app);
  server.listen(port, () => {
    mainLogger.info(`Development Server is running as ${isServerPrimary ? 'Primary Server' : 'Secondary Server'} on port ${port}`);
  });
} else {
  app.listen(port, () => {
    mainLogger.info(`Production Server is running as ${isServerPrimary ? 'Primary Server' : 'Secondary Server'} on port ${port}`);
  });
}

//rate limiting middleware // 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: 'Too many requests, please try again later.',
  store: new RateLimitRedisStore({
    sendCommand: (...args) => redisclient.sendCommand(args),
  }),
});


app.use(limiter);

(async function() {
  await initializeRefreshMechanism();
  await startWebSocketServer();
  await initiateNewsFetch();
  await fetchFloorsheetData();
})();


//routes
app.use("/api", userRouter);  //this route is protected with csrf token
app.get("/", dynamicRoutes);
app.get("/news", getNews);
app.get("/updatenewsview", updateNewsViewCount);
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

process.on('unhandledRejection', (reason) => {
  mainLogger.error(`Unhandled Rejection, Reason is : ${reason}`);
});

export default app;
