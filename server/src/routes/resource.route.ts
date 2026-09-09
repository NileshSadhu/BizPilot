import { Router } from 'express';
import { createResource, getResources, getResource, updateResource, deleteResource } from '../controllers/resource.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createResourceSchema, updateResourceSchema } from '../validations/resource.validation.js';

export const resourceRoute = Router();

resourceRoute.post('/', protect, validate(createResourceSchema), createResource);
resourceRoute.get('/', protect, getResources);
resourceRoute.get('/:id', protect, getResource);
resourceRoute.patch('/:id', protect, validate(updateResourceSchema), updateResource);
resourceRoute.delete('/:id', protect, deleteResource);
