import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return next(new ApiError(400, 'Validation Error', errors));
      }
      return next(error);
    }
  };
};
