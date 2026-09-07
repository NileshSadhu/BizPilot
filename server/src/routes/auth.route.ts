import { Router } from 'express';
import { register, login, forgotPassword, changePassword, getMe, logout, verifyEmail, resendVerificationEmail } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, changePasswordSchema, resendVerificationEmailSchema } from '../validations/auth.validation.js';

export const authRoute = Router();

authRoute.post('/register', validate(registerSchema), register);
authRoute.post('/login', validate(loginSchema), login);
authRoute.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRoute.get('/verify-email', verifyEmail);
authRoute.post('/resend-verification-email', validate(resendVerificationEmailSchema), resendVerificationEmail);

// Protected Routes
authRoute.post('/change-password', protect, validate(changePasswordSchema), changePassword);
authRoute.post('/logout', protect, logout);
authRoute.get('/me', protect, getMe);