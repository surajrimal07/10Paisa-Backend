//package imports
import bodyParser from "body-parser";
import { v2 as cloudinary } from "cloudinary";
import multipart from "connect-multiparty";
import cors from "cors";
import 'dotenv/config';
import express from "express";
import httpsOptions from "./certificate/httpOptions.js";

//
import compression from "compression";
import RedisStore from "connect-redis";
import { rateLimit } from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
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
import { mainLogger } from './utils/logger/logger.js';
import dynamicRoutes from "./utils/routesforIndex.js";

//Express Middlewares
const app = express();
app.use(helmet());
//app.use(cookieParser())

//conect to redis earliy
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

//session
app.use(session({
  genid: function () {
    return uuidv4()
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  proxy: true,
  store: new RedisStore({ client: redisclient }),
  saveUninitialized: true,
  cookie: {
    httpsOnly: true,
    secure: true,
    sameSite: true,
    maxAge: 10 * 24 * 60 * 60 * 1000
  },
}));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"]
    },
  })
);


const port = process.env.PORT || 4000;
const isDevelopment = process.env.NODE_ENV == "development";

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

//Use perfect-express-sanitizer middleware to sanitize user input
const whiteList = ["/api/user/updateprofilepic"]; //for some reason files are not being uploaded

app.use(
  clean({
    xss: true,
    noSql: true,
    sql: true,
    sqlLevel: 5,
    noSqlLevel: 5,
    allowedKeys: ["user"], //fixing user being removed from req.body
  },
    whiteList
  )
);

const corsOptions = {
  flightContinue: true,
  origin: isDevelopment ? 'https://localhost:3000' : 'https://tenpaisa.tech',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));

//session middleware
//let redisStore = connectRedis(session);

// let redisStore = new RedisStore({
//   client: redisclient,
//   prefix: "tenpaisabackend:",
// })


app.use(responseTimeMiddleware);
//app.use(sessionMiddleware);

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

//rate limiting middleware // 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
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

//routes
app.use("/api", userRouter);
app.get("/", dynamicRoutes);
app.get("/news", getNews);
app.get("/ping", (req, res) => {
  res.send("Hello there");
});

// app.use((req, res, next) => {
//   res.sendStatus(200);
// });

//error handling
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found on this server.' });
});


//exports
export default app;
