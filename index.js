import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { mainDB } from './database/db.js';
import userRouter from './routes/appRoutes.js';
import { startNewsServer } from './server/newsServer.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

//corse
// const corsPolicy = {
//   origin: true,
//   Credentials: true,
//   optionSuccessStatus: 200,
// };
// app.use(cors(corsPolicy));

const corsOrigin ={
  origin:'http://localhost:3000',
  credentials:true,
  optionSuccessStatus:200
}
app.use(cors(corsOrigin));


mainDB();

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