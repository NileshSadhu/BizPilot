import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { createSportSchema, updateSportSchema } from '../validations/sport.validation.js';

const prisma = new PrismaClient();

export const createSport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, slug, description, isActive } = req.body as z.infer<typeof createSportSchema>['body'];

  const existingSport = await prisma.sport.findUnique({ where: { slug } });
  if (existingSport) {
    return next(new ApiError(400, 'Sport with this slug already exists'));
  }

  const sport = await prisma.sport.create({
    data: { name, slug, description, isActive }
  });

  res.status(201).json(new ApiResponse(201, { sport }, 'Sport created successfully'));
});

export const getSports = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const isPlatformAdmin = req.user?.role === 'PLATFORM_ADMIN';

  const where = isPlatformAdmin ? {} : { isActive: true };

  const sports = await prisma.sport.findMany({ where });

  res.status(200).json(new ApiResponse(200, { sports }, 'Sports fetched successfully'));
});

export const getSport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;

  const sport = await prisma.sport.findUnique({ where: { id } });

  if (!sport) {
    return next(new ApiError(404, 'Sport not found'));
  }

  const isPlatformAdmin = req.user?.role === 'PLATFORM_ADMIN';
  if (!isPlatformAdmin && !sport.isActive) {
    return next(new ApiError(404, 'Sport not found'));
  }

  res.status(200).json(new ApiResponse(200, { sport }, 'Sport fetched successfully'));
});

export const updateSport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const { name, slug, description, isActive } = req.body as z.infer<typeof updateSportSchema>['body'];

  const sport = await prisma.sport.findUnique({ where: { id } });
  if (!sport) {
    return next(new ApiError(404, 'Sport not found'));
  }

  if (slug && slug !== sport.slug) {
    const existingSport = await prisma.sport.findUnique({ where: { slug } });
    if (existingSport) {
      return next(new ApiError(400, 'Sport with this slug already exists'));
    }
  }

  const updatedSport = await prisma.sport.update({
    where: { id },
    data: { name, slug, description, isActive }
  });

  res.status(200).json(new ApiResponse(200, { sport: updatedSport }, 'Sport updated successfully'));
});

export const deleteSport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;

  const sport = await prisma.sport.findUnique({ where: { id } });
  if (!sport) {
    return next(new ApiError(404, 'Sport not found'));
  }

  const updatedSport = await prisma.sport.update({
    where: { id },
    data: { isActive: false }
  });

  res.status(200).json(new ApiResponse(200, { sport: updatedSport }, 'Sport deactivated successfully'));
});
