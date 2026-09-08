import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { createLocationSchema, updateLocationSchema } from '../validations/location.validation.js';

const prisma = new PrismaClient();

export const createLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const data = req.body as z.infer<typeof createLocationSchema>['body'];

  const location = await prisma.location.create({
    data: {
      ...data,
      organizationId,
    }
  });

  res.status(201).json(new ApiResponse(201, location, 'Location created successfully'));
});

export const getLocations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const locations = await prisma.location.findMany({
    where: { organizationId }
  });

  res.status(200).json(new ApiResponse(200, locations, 'Locations retrieved successfully'));
});

export const getLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;
  const id = req.params.id as string;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const location = await prisma.location.findFirst({
    where: {
      id,
      organizationId
    }
  });

  if (!location) {
    return next(new ApiError(404, 'Location not found'));
  }

  res.status(200).json(new ApiResponse(200, location, 'Location retrieved successfully'));
});

export const updateLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;
  const id = req.params.id as string;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const location = await prisma.location.findFirst({
    where: {
      id,
      organizationId
    }
  });

  if (!location) {
    return next(new ApiError(404, 'Location not found'));
  }

  const data = req.body as z.infer<typeof updateLocationSchema>['body'];

  const updatedLocation = await prisma.location.update({
    where: { id },
    data
  });

  res.status(200).json(new ApiResponse(200, updatedLocation, 'Location updated successfully'));
});

export const deleteLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;
  const id = req.params.id as string;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const location = await prisma.location.findFirst({
    where: {
      id,
      organizationId
    },
    include: {
      resources: true,
      bookings: true
    }
  });

  if (!location) {
    return next(new ApiError(404, 'Location not found'));
  }

  if (location.resources.length > 0 || location.bookings.length > 0) {
    return next(new ApiError(409, 'Conflict: Cannot delete location as it has dependent resources or bookings.'));
  }

  await prisma.location.delete({
    where: { id }
  });

  res.status(200).json(new ApiResponse(200, null, 'Location deleted successfully'));
});
