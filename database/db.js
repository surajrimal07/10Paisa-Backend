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

  // if (hostName == 'instance-20240618-2207') {
  //   dbURL = process.env.DB_URL_PROD_LOCAL;
  // }


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

export default { Database };


process.on('SIGINT', () => {
  mongoose.connection.close().then(() => {
    mainLogger.error(`Closing Mongodb due app termination`);
    process.exit(0);
  });
});