import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  OPENSEARCH_URL: z.string().url().default('http://localhost:9200'),
  S3_BUCKET: z.string(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().email().optional(),
  ML_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://localhost:8002'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const r = EnvSchema.safeParse(env);
  if (!r.success) {
    console.error('Invalid environment:', r.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return r.data;
}
