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
import { sessionMiddleware } from './middleware/session.js';
import userRouter from "./routes/appRoutes.js";
import { startNewsServer } from "./server/newsserver.js";
import { redisclient } from "./server/redisServer.js";
import { startWebSocketServer } from "./server/websocket.js";
import { mainLogger } from './utils/logger/logger.js';
import dynamicRoutes from "./utils/routesforIndex.js";

//Express Middlewares
const app = express();
const port = process.env.PORT || 4000;

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

//cors
app.use(
  cors({
    origin: ['https://localhost:3000', 'https://tenpaisa.tech'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

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

app.use(responseTimeMiddleware);
app.use(sessionMiddleware);

//cloudnary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//starting server
const isDevelopment = process.env.NODE_ENV == "development";
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
