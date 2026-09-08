import { z } from 'zod';

export const createLocationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    address: z.string().min(1, "Address is required").max(255),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(10).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).strict()
});

export const updateLocationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").max(100).optional(),
    address: z.string().min(1, "Address cannot be empty").max(255).optional(),
    city: z.string().min(1, "City cannot be empty").max(100).optional(),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(10).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).strict()
});
