import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export const mainDB = async () => {
  try {

    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    };

    const mainDBConnection = mongoose.connect(process.env.DB_URL,mongooseOptions);
    console.log('Connected to the database');
    return mainDBConnection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

export default {mainDB};