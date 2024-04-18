//package imports
import bodyParser from 'body-parser';
import { v2 as cloudinary } from 'cloudinary';
import multipart from 'connect-multiparty';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';

//file imports
import initializeRefreshMechanism from './controllers/refreshController.js';
import { mainDB } from './database/db.js';
import userRouter from './routes/appRoutes.js';
import { startNewsServer } from './server/newsserver.js';
import { startWebSocketServer } from './server/websocket.js';
import { initializeStorage } from './utils/initilize_storage.js';


dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

//middlewares

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

// Use body-parser middleware to parse url-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//test code to log all incomoning requests
// app.use((req, res, next) => {
//   if (req.is('json')) {
//     console.log('Received JSON:', req.body);
//   }
//   next();
// });

//multiparty middleware
app.use(multipart())

app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

//cloudnary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


mainDB();

initializeStorage()
  .then(() => {
    console.log('Storage initialized successfully');
  })
  .catch((error) => {
    console.error('Error initializing storage:', error);
  });

initializeRefreshMechanism();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/test', (req, res) => {
  res.send('Testing API is running live🥳');
});

app.use('/api', userRouter);

app.get('/', (req, res) => {

  fs.readFile('./utils/index.html', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading HTML file:', err.message);
      res.status(500).send('Error reading HTML file');
      return;
    }
    res.send(data);
  });
});


startWebSocketServer();
startNewsServer(app);

export default app;