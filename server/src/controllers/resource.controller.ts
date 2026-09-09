import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { createResourceSchema, updateResourceSchema } from '../validations/resource.validation.js';

const prisma = new PrismaClient();

export const createResource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const data = req.body as z.infer<typeof createResourceSchema>['body'];

  // 1. Verify Location belongs to the authenticated user's organization
  const location = await prisma.location.findFirst({
    where: {
      id: data.locationId,
      organizationId,
    }
  });

  if (!location) {
    return next(new ApiError(404, 'Location not found or does not belong to your organization.'));
  }

  // 2. Verify ActivityType exists (it is a global catalog)
  const activityType = await prisma.activityType.findUnique({
    where: { id: data.activityTypeId }
  });

  if (!activityType) {
    return next(new ApiError(400, 'Invalid ActivityType provided.'));
  }

  const resource = await prisma.resource.create({
    data: {
      ...data,
      organizationId,
      isActive: true,
    }
  });

  res.status(201).json(new ApiResponse(201, resource, 'Resource created successfully'));
});

export const getResources = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const { locationId, activityTypeId, isActive } = req.query;
  const filter: any = { organizationId };

  if (locationId) filter.locationId = String(locationId);
  if (activityTypeId) filter.activityTypeId = String(activityTypeId);
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  } else {
    // Default behavior should normally show active resources
    filter.isActive = true;
  }

  const resources = await prisma.resource.findMany({
    where: filter
  });

  res.status(200).json(new ApiResponse(200, resources, 'Resources retrieved successfully'));
});

export const getResource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;
  const id = req.params.id as string;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const resource = await prisma.resource.findFirst({
    where: {
      id,
      organizationId
    }
  });

  if (!resource) {
    return next(new ApiError(404, 'Resource not found'));
  }

  res.status(200).json(new ApiResponse(200, resource, 'Resource retrieved successfully'));
});

export const updateResource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;
  const id = req.params.id as string;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const resource = await prisma.resource.findFirst({
    where: {
      id,
      organizationId
    }
  });

  if (!resource) {
    return next(new ApiError(404, 'Resource not found'));
  }

  const data = req.body as z.infer<typeof updateResourceSchema>['body'];

  // If changing location, verify the new location belongs to the organization
  if (data.locationId && data.locationId !== resource.locationId) {
    const location = await prisma.location.findFirst({
      where: {
        id: data.locationId,
        organizationId,
      }
    });

    if (!location) {
      return next(new ApiError(400, 'New location not found or does not belong to your organization.'));
    }
  }

  // If changing activityType, verify the new activityType exists
  if (data.activityTypeId && data.activityTypeId !== resource.activityTypeId) {
    const activityType = await prisma.activityType.findUnique({
      where: { id: data.activityTypeId }
    });

    if (!activityType) {
      return next(new ApiError(400, 'Invalid ActivityType provided.'));
    }
  }

  const updatedResource = await prisma.resource.update({
    where: { id },
    data
  });

  res.status(200).json(new ApiResponse(200, updatedResource, 'Resource updated successfully'));
});

export const deleteResource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = req.user?.organizationId;
  const id = req.params.id as string;

  if (!organizationId) {
    return next(new ApiError(403, 'Organization ID is missing. Unauthorized.'));
  }

  const resource = await prisma.resource.findFirst({
    where: {
      id,
      organizationId
    }
  });

  if (!resource) {
    return next(new ApiError(404, 'Resource not found'));
  }

  // Soft delete
  const deletedResource = await prisma.resource.update({
    where: { id },
    data: { isActive: false }
  });

  res.status(200).json(new ApiResponse(200, deletedResource, 'Resource deactivated successfully'));
});
