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

//new format
// export const mainDB = async () => {
//   try {
//     const mainDBConnection = mongoose.connect(process.env.DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useCreateIndex: true,
//     });

//     console.log('Connected to the main database');
//     return mainDBConnection;
//   } catch (error) {
//     console.error('Error connecting to the main database:', error);
//     throw error;
//   }
// };


// // Connects to the second database
// export const secondDB = async () => {
//   try {
//     const db = mongoose.createConnection(process.env.MONOGO_DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useCreateIndex: true,
//     });
//     console.log('Connected to the second database');
//     return db;
//   } catch (error) {
//     console.error('Error connecting to the second database:', error);
//     throw error;
//   }
// };

//export default {secondDB,mainDB};
export default {mainDB};