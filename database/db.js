// import mongoose from 'mongoose';

// // const connectDB = () => {
// //   mongoose.connect(process.env.DB_URL, {
// //     useUnifiedTopology: true,
// //     useNewUrlParser: true,
// //   })
// //     .then(() => {
// //       console.log("DB CONNECTED to " + process.env.DB_URL);
// //     })
// //     .catch((err) => {
// //       console.log(err);
// //     });
// // };

// export const connectDB = async () => {
//   try {
//     // Connect to the main database
//     await mongoose.connect(process.env.DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('Connected to the main database');

//     // Connect to another database
//     await mongoose.createConnection(process.env.MONOGO_DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('Connected to the second database');
//   } catch (error) {
//     console.error('Error connecting to the databases:', error);
//   }
// };

// export default connectDB;

// import mongoose from 'mongoose';

// export const connectDB = async () => {
//   try {
//     // Connect to the main database
//     const mainDB = await mongoose.connect(process.env.DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('Connected to the main database');

//     // Connect to another database and store the connection in a variable
//     const secondDB = await mongoose.createConnection(process.env.MONOGO_DB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('Connected to the second database');

//     return { mainDB, secondDB }; // Return both connections for further usage
//   } catch (error) {
//     console.error('Error connecting to the databases:', error);
//     throw error;
//   }
// };

// export default connectDB;

import mongoose from 'mongoose';

// Connects to the main database
export const mainDB = async () => {
  try {
    const mainDBConnection = mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the main database');
    return mainDBConnection;
  } catch (error) {
    console.error('Error connecting to the main database:', error);
    throw error;
  }
};

// Connects to the second database
export const secondDB = async () => {
  try {
    const db = mongoose.createConnection(process.env.MONOGO_DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the second database');
    return db;
  } catch (error) {
    console.error('Error connecting to the second database:', error);
    throw error;
  }
};

export default {secondDB,mainDB};