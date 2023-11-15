import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export const mainDB = async () => {
  try {
    const mainDBConnection = mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Connected to the main database');
    return mainDBConnection;
  } catch (error) {
    console.error('Error connecting to the main database:', error);
    throw error;
  }
};

export default {mainDB};