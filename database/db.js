/* eslint-disable no-undef */
import mongoose from "mongoose";

export const isDevelopment = process.env.NODE_ENV === "development";

export const localDBURL = isDevelopment
  ? process.env.DB_LOGS_NEWS_PROD
  : process.env.DB_LOGS_NEWS_DEV;

export const clientOptions = {
  minPoolSize: 10,
  maxPoolSize: 100,
  compressors: ["zstd"],
  connectTimeoutMS: 60000,
  socketTimeoutMS: 30000,
  family: 4,
};

async function connectWithRetry(connectFn, dbName) {
  try {
    await connectFn();
    const connection = mongoose.connection;

    console.log(
      `Connected to the ${dbName}. ReadyState is: ${connection.readyState}`
    );

    connection.on("disconnected", () => {
      console.log(`${dbName} is Disconnected`);
      retryConnection(connectFn, dbName);
    });

    connection.on("reconnected", () => {
      console.log(`${dbName} is Reconnected`);
    });

    connection.on("disconnecting", () => {
      console.log(`${dbName} is Disconnecting`);
    });

    connection.on("close", () => {
      console.log(`${dbName} is Closed`);
    });

    return connection;
  } catch (error) {
    console.error(`Error connecting to the ${dbName}: ${error}`);
    retryConnection(connectFn, dbName);
  }
}

function retryConnection(connectFn, dbName, delay = 5000) {
  console.error(
    `Error connecting to the ${dbName}: Device seems offline. Retrying MongoDB connection in ${
      delay / 1000
    } seconds...`
  );
  setTimeout(() => connectWithRetry(connectFn, dbName), delay);
}

export async function PrimaryDatabase() {
  const dbURL = process.env.DB_URL;
  return await connectWithRetry(
    () => mongoose.connect(dbURL, clientOptions),
    "Primary Database"
  );
}

export async function LocalDatabase() {
  const connection = await mongoose.createConnection(localDBURL, clientOptions);

  console.log(
    `Connected to the Secondary Database. ReadyState is: ${connection.readyState}`
  );

  connection.on("disconnected", () => {
    console.log("Secondary Database is Disconnected");
    retryConnection(
      () => connection.openUri(localDBURL, clientOptions),
      "Secondary Database"
    );
  });

  connection.on("reconnected", () => {
    console.log("Secondary Database is Reconnected");
  });

  connection.on("disconnecting", () => {
    console.log("Secondary Database is Disconnecting");
  });

  connection.on("close", () => {
    console.log("Secondary Database is Closed");
  });

  return connection;
}

export const secondaryDatabase = await LocalDatabase();

export default { PrimaryDatabase, secondaryDatabase };

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log(`Closed Primary Database due to app termination`);
  } catch (err) {
    console.error(`Error closing Primary Database: ${err}`);
  }

  try {
    await secondaryDatabase.close();
    console.log(`Closed Secondary Database due to app termination`);
  } catch (err) {
    console.error(`Error closing Secondary Database: ${err}`);
  }

  process.exit(0);
});
