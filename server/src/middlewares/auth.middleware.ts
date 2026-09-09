import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;

    // Support backward compatibility for older tokens that used `id` instead of `userId`
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return next(new ApiError(401, 'Invalid token payload.'));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return next(new ApiError(401, 'The user belonging to this token does no longer exist.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }
};

export const restrictToPlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'PLATFORM_ADMIN') {
    next();
  } else {
    next(new ApiError(403, 'You do not have permission to perform this action. Platform Admin only.'));
  }
};
