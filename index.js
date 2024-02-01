import bodyParser from 'body-parser';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import initializeRefreshMechanism from './controllers/refreshController.js';
import { mainDB } from './database/db.js';
import userRouter from './routes/appRoutes.js';
import { startNewsServer } from './server/newsServer.js';
import { startWebSocketServer } from './server/websocket.js';
import { initializeStorage } from './utils/initilize_storage.js';


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


// //use https
// const forceSecure = (req, res, next) => {
//   if (req.secure)
//      return next();
//   res.redirect('https://' + req.hostname + req.url)
// }
// app.all('*', forceSecure);
// //

//await storage.init();
initializeRefreshMechanism();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//testing
app.get('/test', (req, res) => {
  res.send('Testing API is running live🥳');
});

app.use('/api', userRouter);

app.get('/', (req, res) => {
  res.send('This API is running live🥳');
});

startWebSocketServer();
startNewsServer(app);

export default app;