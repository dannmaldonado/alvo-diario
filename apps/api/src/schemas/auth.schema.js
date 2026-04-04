/**
 * Auth validation schemas
 */

import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  passwordConfirm: z.string().min(6).max(128),
  nome: z.string().min(1, 'Nome is required').max(200).optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const updateUserSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  meta_diaria_horas: z.number().min(0.5).max(24).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
