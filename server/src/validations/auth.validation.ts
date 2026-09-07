import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    organizationName: z.string().min(1, "Organization name is required"),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string()
      .min(8, "Old password must be at least 8 characters")
      .max(16, "Old password must be at most 16 characters")
      .regex(/[A-Z]/, "Old password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Old password must contain at least one lowercase letter")
      .regex(/[^A-Za-z0-9]/, "Old password must contain at least one special character"),
    newPassword: z.string()
      .min(8, "New password must be at least 8 characters")
      .max(16, "New password must be at most 16 characters")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
      .regex(/[a-z]/, "New password must contain at least one lowercase letter")
      .regex(/[^A-Za-z0-9]/, "New password must contain at least one special character"),
  })
});

export const resendVerificationEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  })
});
