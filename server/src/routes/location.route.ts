import { Router } from 'express';
import { createLocation, getLocations, getLocation, updateLocation, deleteLocation } from '../controllers/location.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createLocationSchema, updateLocationSchema } from '../validations/location.validation.js';

export const locationRoute = Router();

locationRoute.post('/', protect, validate(createLocationSchema), createLocation);
locationRoute.get('/', protect, getLocations);
locationRoute.get('/:id', protect, getLocation);
locationRoute.patch('/:id', protect, validate(updateLocationSchema), updateLocation);
locationRoute.delete('/:id', protect, deleteLocation);
