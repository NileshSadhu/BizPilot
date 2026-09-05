import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { registerSchema, loginSchema, forgotPasswordSchema, changePasswordSchema } from '../validations/auth.validation.js';

const prisma = new PrismaClient();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any
  });
};

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, organizationName } = req.body as z.infer<typeof registerSchema>['body'];

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return next(new ApiError(400, 'Email is already in use'));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: organizationName.toLowerCase().replace(/ /g, '-') + '-' + crypto.randomBytes(4).toString('hex'),
      status: 'ACTIVE',
      subscriptionPlan: 'FREE',
      timezone: 'UTC',
      currency: 'USD'
    }
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      organizationId: org.id,
      role: 'OWNER'
    }
  });

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json(new ApiResponse(201, { user: userWithoutPassword, token }, 'Registration successful'));
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>['body'];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json(new ApiResponse(200, { user: userWithoutPassword, token }, 'Login successful'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as z.infer<typeof forgotPasswordSchema>['body'];
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return next(new ApiError(404, 'There is no user with that email address.'));
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { email },
    data: { resetPasswordToken, resetPasswordExpires }
  });

  try {
    const success = await sendPasswordResetEmail(user.email, resetToken);
    if (!success) {
      throw new Error('Email sending failed');
    }
    res.status(200).json(new ApiResponse(200, null, 'Password reset token sent to email!'));
  } catch (err) {
    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken: null, resetPasswordExpires: null }
    });
    return next(new ApiError(500, 'There was an error sending the email. Try again later!'));
  }
});

export const changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { oldPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>['body'];

  // req.user is set by the protect middleware from the bearer token
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  // Verify old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new ApiError(401, 'Old password is incorrect'));
  }

  // Prevent reuse of the same password
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return next(new ApiError(400, 'New password must be different from the old password'));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
});

export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { password, ...userWithoutPassword } = req.user;
  res.status(200).json(new ApiResponse(200, { user: userWithoutPassword }, 'User fetched successfully'));
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
