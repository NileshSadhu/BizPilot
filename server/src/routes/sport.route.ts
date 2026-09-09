import { Router } from 'express';
import { protect, restrictToPlatformAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createSportSchema, updateSportSchema } from '../validations/sport.validation.js';
import {
  createSport,
  getSports,
  getSport,
  updateSport,
  deleteSport
} from '../controllers/sport.controller.js';

export const sportRoute = Router();

sportRoute.post('/', protect, restrictToPlatformAdmin, validate(createSportSchema), createSport);
sportRoute.get('/', protect, getSports);
sportRoute.get('/:id', protect, getSport);
sportRoute.patch('/:id', protect, restrictToPlatformAdmin, validate(updateSportSchema), updateSport);
sportRoute.delete('/:id', protect, restrictToPlatformAdmin, deleteSport);
