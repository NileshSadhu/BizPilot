import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { updateOrganizationSchema } from '../validations/organization.validation.js';

const prisma = new PrismaClient();

export const getMyOrganization = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return next(new ApiError(401, 'Unauthorized: Organization ID missing from token'));
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  if (!organization) {
    return next(new ApiError(404, 'Organization not found'));
  }

  res.status(200).json(new ApiResponse(200, organization, 'Organization retrieved successfully'));
});

export const updateMyOrganization = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return next(new ApiError(401, 'Unauthorized: Organization ID missing from token'));
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  if (!organization) {
    return next(new ApiError(404, 'Organization not found'));
  }

  const data = req.body as z.infer<typeof updateOrganizationSchema>['body'];

  const updatedOrganization = await prisma.organization.update({
    where: { id: organizationId },
    data
  });

  res.status(200).json(new ApiResponse(200, updatedOrganization, 'Organization updated successfully'));
});
