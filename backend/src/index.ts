import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import userRouter from './api/routers/userRouter';
import paymentRouter from './api/routers/paymentRouter';
import packageRouter from './api/routers/packageRouter';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/users', userRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/packages', packageRouter);

app.get('/', (req, res) => {
  res.send('Signify Video Accessibility API is running...');
});

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/signify-accessibility';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
