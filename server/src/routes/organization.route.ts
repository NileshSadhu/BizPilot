import { Router } from 'express';
import { getMyOrganization, updateMyOrganization } from '../controllers/organization.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { updateOrganizationSchema } from '../validations/organization.validation.js';

export const organizationRoute = Router();

organizationRoute.get('/me', protect, getMyOrganization);
organizationRoute.patch('/me', protect, validate(updateOrganizationSchema), updateMyOrganization);
