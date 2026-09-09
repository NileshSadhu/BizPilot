import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    locationId: z.string().uuid("Invalid location ID"),
    activityTypeId: z.string().uuid("Invalid activity type ID"),
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
  }).strict()
});

export const updateResourceSchema = z.object({
  body: z.object({
    locationId: z.string().uuid("Invalid location ID").optional(),
    activityTypeId: z.string().uuid("Invalid activity type ID").optional(),
    name: z.string().min(1, "Name cannot be empty").max(100).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }).strict()
});
