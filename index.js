//package imports
import bodyParser from "body-parser";
import { v2 as cloudinary } from "cloudinary";
import multipart from "connect-multiparty";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import httpsOptions from "./certificate/httpOptions.js";

//
import https from "https";
import { clean } from "perfect-express-sanitizer";

//file imports
import initializeRefreshMechanism from "./controllers/refreshController.js";
import { mainDB } from "./database/db.js";
import userRouter from "./routes/appRoutes.js";
import { startNewsServer } from "./server/newsserver.js";
import { redisclient } from "./server/redisServer.js";
import { startWebSocketServer } from "./server/websocket.js";
import { initializeStorage } from "./utils/initilize_storage.js";

dotenv.config();

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

//multiparty middleware
app.use(multipart());

app.use(
  cors({
    origin: "https://localhost:3000",
    credentials: true,
  })
);

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
  console.log("Starting Development Server");
  server.listen(port, () => {
    console.log(`Development Server is running on port ${port}`);
  });
} else {
  console.log("Starting Production Server");
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

mainDB(); //initialize database

initializeStorage() //initialize storage
  .then(() => {
    console.log("Storage initialized successfully");
  })
  .catch((error) => {
    console.error("Error initializing storage:", error);
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api", userRouter);

app.get("/", (req, res) => {
  //serving index.html

  fs.readFile("./utils/index.html", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err.message);
      res.status(500).send("Error reading HTML file");
      return;
    }
    res.send(data);
  });
});

//connect to redis server //if redis is enabled
const useRedis = process.env.USEREDIS;
if (useRedis == "true") {
  await redisclient.connect();
  console.log(
    redisclient.isOpen
      ? "Connected to Redis Server"
      : "Not connected to Redis Server"
  );

  redisclient.on("error", (error) => {
    console.error(`Redis client error:`, error);
  });

  app.on("close", () => {
    redisclient.disconnect();
  });
}

initializeRefreshMechanism();
startWebSocketServer();
startNewsServer(app);

export default app;
