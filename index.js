import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { mainDB } from './database/db.js';
import userRouter from './routes/userRoutes.js';
import { startNewsServer } from './server/testserver.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 8000;
//const database_name = process.env.DATABASE;

//connecting db from db.js using cloud Atlas
//connectDB();
mainDB();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//transfering to use routes
app.use('/api', userRouter);

app.get('/', (req, res) => {
  res.send('This API is running live🥳');
});

startNewsServer(app);