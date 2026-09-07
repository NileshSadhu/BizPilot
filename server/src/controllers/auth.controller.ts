import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/mailer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { registerSchema, loginSchema, forgotPasswordSchema, changePasswordSchema, resendVerificationEmailSchema } from '../validations/auth.validation.js';

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

  const rawVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
  const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      organizationId: org.id,
      role: 'OWNER',
      emailVerificationToken,
      emailVerificationExpires,
    }
  });

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  // Send verification email — non-blocking; failure should not prevent registration
  sendVerificationEmail(user.email, rawVerificationToken).catch((err) =>
    console.error('Failed to send verification email:', err)
  );

  res.status(201).json(new ApiResponse(201, { user: userWithoutPassword, token }, 'Registration successful. Please verify your email.'));
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

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new ApiError(401, 'Old password is incorrect'));
  }

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

export const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.query as { token: string };

  if (!token) {
    return next(new ApiError(400, 'Verification token is required'));
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { gt: new Date() },
    }
  });

  if (!user) {
    return next(new ApiError(400, 'Invalid or expired verification token'));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    }
  });

  res.status(200).json(new ApiResponse(200, null, 'Email verified successfully'));
});

export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as z.infer<typeof resendVerificationEmailSchema>['body'];

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return next(new ApiError(404, 'No account found with that email address'));
  }

  if (user.emailVerified) {
    return res.status(200).json(new ApiResponse(200, null, 'This email address is already verified'));
  }

  const rawVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
  const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { email },
    data: { emailVerificationToken, emailVerificationExpires }
  });

  try {
    const success = await sendVerificationEmail(user.email, rawVerificationToken);
    if (!success) {
      throw new Error('Email sending failed');
    }
    res.status(200).json(new ApiResponse(200, null, 'Verification email sent successfully'));
  } catch (err) {
    await prisma.user.update({
      where: { email },
      data: { emailVerificationToken: null, emailVerificationExpires: null }
    });
    return next(new ApiError(500, 'There was an error sending the email. Try again later.'));
  }
});
