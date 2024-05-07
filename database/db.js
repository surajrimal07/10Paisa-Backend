// import mongoose from 'mongoose';
// import { mainLogger } from '../utils/logger/logger.js';

// const clientOptions = {
//   minPoolSize: 10,
//   maxPoolSize: 100,
//   serverApi: { version: '1', serverSelectionTimeoutMS: 60000, strict: true, deprecationErrors: true, socketTimeoutMS: 30000, family: 4 },
// };

// export async function Database() {
//   try {
//     mongoose.connection.on('open', () => mainLogger.info(`Connected to the database. ReadyState is: ${mongoose.connection.readyState}`));
//     mongoose.connection.on('disconnected', () => mainLogger.info('MongoDB is Disconnected'));
//     mongoose.connection.on('reconnected', () => mainLogger.info('MongoDB is Reconnected'));
//     mongoose.connection.on('disconnecting', () => mainLogger.info('MongoDB is Disconnecting'));
//     mongoose.connection.on('close', () => mainLogger.info('MongoDB is Closed'));

//     await mongoose.connect(process.env.DB_URL, clientOptions);
//     return mongoose.connection;
//   } catch (error) {

//     mainLogger.error('Error connecting to the database:', error);
//   }
// };

// export default { Database };


import mongoose from 'mongoose';
import { mainLogger } from '../utils/logger/logger.js';

const clientOptions = {
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

  async function attemptConnection() {
    try {
      await mongoose.connect(process.env.DB_URL, clientOptions);
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
