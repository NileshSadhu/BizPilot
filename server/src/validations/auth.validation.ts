import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    // For initial registration, they can either provide an existing organizationId to join, or a new organizationName to create one
    organizationId: z.string().uuid("Invalid Organization ID").optional(),
    organizationName: z.string().optional()
  }).refine((data) => data.organizationId || data.organizationName, {
    message: "Either organizationId or organizationName must be provided",
    path: ["organizationName"]
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  })
});
