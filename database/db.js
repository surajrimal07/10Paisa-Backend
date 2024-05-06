import mongoose from 'mongoose';
import { mainLogger } from '../utils/logger/logger.js';

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

export async function Database() {
  try {
    await mongoose.connect(process.env.DB_URL, clientOptions);
    mainLogger.info('Connected to the database. ReadyState is: '+ mongoose.connection.readyState);
    return mongoose.connection;
  } catch (error) {
    mainLogger.info('Error connecting to the database:', error);
  }
};

export default { Database };