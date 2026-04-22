import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const HabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(''),
  color: z.string().default('oklch(0.38 0.08 160)'),
  position: z.number().int().default(0),
  createdAt: z.string().datetime(),
});
export type Habit = z.infer<typeof HabitSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ErrorEnvelope = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
