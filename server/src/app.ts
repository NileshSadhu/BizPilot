import express from 'express';
import cors from 'cors';
import { mainRoute } from './routes/mainRoute.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Main Entry Route
app.use('/api/v1', mainRoute);

// Global Error Handler
app.use(errorHandler);
