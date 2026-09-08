import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    slug: z.string().min(1, "Slug cannot be empty").optional(),
    status: z.string().optional(),
    subscriptionPlan: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
  }).strict()
});
