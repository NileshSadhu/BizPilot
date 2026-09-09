import { z } from 'zod';

export const createSportSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    slug: z.string().min(1, 'Slug is required').max(100),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }).strict()
});

export const updateSportSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
    slug: z.string().min(1, 'Slug cannot be empty').max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }).strict()
});
