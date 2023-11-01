import mongoose from 'mongoose';

const connectDB = () => {
  mongoose.connect(process.env.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
    .then(() => {
      console.log("DB CONNECTED to " + process.env.DB_URL);
    })
    .catch((err) => {
      console.log(err);
    });
};

export default connectDB;
