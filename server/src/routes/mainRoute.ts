import { Router } from 'express';
import { authRoute } from './auth.route.js';
import { organizationRoute } from './organization.route.js';

export const mainRoute = Router();

mainRoute.use('/auth', authRoute);
mainRoute.use('/organizations', organizationRoute);

mainRoute.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString()
  });
});
