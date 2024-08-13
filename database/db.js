/* eslint-disable no-undef */
import mongoose from 'mongoose';
import { mainLogger } from '../utils/logger/logger.js';
//import { hostName } from './dbConfig.js';

export const clientOptions = {
  minPoolSize: 10,
  maxPoolSize: 100,
  compressors: ["zstd"],
  connectTimeoutMS: 60000,
  socketTimeoutMS: 30000,
  family: 4
};

export async function Database() {
  let isConnected = false;
  const retryDelay = 5000;
  let dbURL = process.env.DB_URL;

  async function attemptConnection() {
    try {

      await mongoose.connect(dbURL, clientOptions);
      isConnected = true;
      mainLogger.info(`Connected to the database. ReadyState is: ${mongoose.connection.readyState}`);
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        mainLogger.info('MongoDB is Disconnected');
        reconnect();
      });
      mongoose.connection.on('reconnected', () => {
        isConnected = true;
        mainLogger.info('MongoDB is Reconnected');
      });
      mongoose.connection.on('disconnecting', () => mainLogger.info('MongoDB is Disconnecting'));
      mongoose.connection.on('close', () => mainLogger.info('MongoDB is Closed'));
      return mongoose.connection;
    } catch (error) {
      reconnect();
      mainLogger.error(`Error connecting to the database: ${error}`);
    }
  }

  function reconnect() {
    if (!isConnected) {
      mainLogger.error(`Error connecting to the database: Device seems offline. Retrying MongoDB connection in ${retryDelay / 1000} seconds...`);
      setTimeout(attemptConnection, retryDelay);
    }
  }

  await attemptConnection();
}

export async function LocalDatabase() {
  let isLocalConnected = false;
  const retryDelay = 5000;
  const localDBURL = process.env.DB_LOGS_NEWS;

  async function attemptLocalConnection() {
    try {
      const localConnection = await mongoose.createConnection(localDBURL, clientOptions);
      isLocalConnected = true;
      mainLogger.info(`Connected to the local database. ReadyState is: ${localConnection.readyState}`);
      localConnection.on('disconnected', () => {
        isLocalConnected = false;
        mainLogger.info('Local MongoDB is Disconnected');
        reconnectLocal();
      });
      localConnection.on('reconnected', () => {
        isLocalConnected = true;
        mainLogger.info('Local MongoDB is Reconnected');
      });
      localConnection.on('disconnecting', () => mainLogger.info('Local MongoDB is Disconnecting'));
      localConnection.on('close', () => mainLogger.info('Local MongoDB is Closed'));
      return localConnection;
    } catch (error) {
      reconnectLocal();
      mainLogger.error(`Error connecting to the local database: ${error}`);
    }
  }

  function reconnectLocal() {
    if (!isLocalConnected) {
      mainLogger.error(`Error connecting to the local database: Device seems offline. Retrying MongoDB connection in ${retryDelay / 1000} seconds...`);
      setTimeout(attemptLocalConnection, retryDelay);
    }
  }

  return await attemptLocalConnection();
}

export default { Database, LocalDatabase };


process.on('SIGINT', () => {
  mongoose.connection.close().then(() => {
    mainLogger.error(`Closing Mongodb due app termination`);
    process.exit(0);
  });
});