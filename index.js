import bodyParser from 'body-parser';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import storage from 'node-persist';
import { mainDB } from './database/db.js';
import userRouter from './routes/appRoutes.js';
import { startNewsServer } from './server/newsServer.js';

import initializeRefreshMechanism from './controllers/refreshController.js';

import multipart from 'connect-multiparty';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

//middlewares

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

// Use body-parser middleware to parse url-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//test code to log all incomoning requests
app.use((req, res, next) => {
  if (req.is('json')) {
    console.log('Received JSON:', req.body);
  }
  next();
});

//multiparty middleware
app.use(multipart())

const corsOrigin ={
  origin:'http://localhost:3000',
  credentials:true,
  optionSuccessStatus:200
}
app.use(cors(corsOrigin));


//cloudnary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


mainDB();
await storage.init();
initializeRefreshMechanism();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', userRouter);

app.get('/', (req, res) => {
  res.send('This API is running live🥳');
});

startNewsServer(app);