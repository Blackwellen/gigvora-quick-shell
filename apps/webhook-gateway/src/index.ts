import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import crypto from 'node:crypto';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const app = Fastify({ logger: true });
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const inboundQueue = new Queue('webhooks-in', { connection });

await app.register(rateLimit, { max: 600, timeWindow: '1 minute' });

const SECRETS: Record<string, string | undefined> = {
  stripe: process.env.STRIPE_WEBHOOK_SECRET,
  github: process.env.GITHUB_WEBHOOK_SECRET,
  generic: process.env.GENERIC_WEBHOOK_SECRET,
};

function verify(provider: string, raw: string, signature: string | undefined) {
  const secret = SECRETS[provider];
  if (!secret || !signature) return false;
  const expect = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(signature));
  } catch { return false; }
}

app.get('/health', async () => ({ status: 'ok' }));

app.post('/in/:provider', async (req, reply) => {
  const { provider } = req.params as { provider: string };
  const raw = JSON.stringify(req.body);
  const sig = req.headers['x-webhook-signature'] as string | undefined;
  if (!verify(provider, raw, sig)) return reply.code(401).send({ error: 'invalid signature' });

  const eventId = (req.headers['x-event-id'] as string) ?? crypto.randomUUID();
  // replay prevention via Redis SETNX (24h)
  const ok = await connection.set(`wh:seen:${provider}:${eventId}`, '1', 'EX', 86400, 'NX');
  if (!ok) return reply.code(200).send({ deduped: true });

  await inboundQueue.add(provider, { provider, eventId, body: req.body, receivedAt: Date.now() }, {
    attempts: 8, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 1000,
  });
  return reply.code(202).send({ accepted: true, eventId });
});

const port = Number(process.env.PORT ?? 3010);
await app.listen({ port, host: '0.0.0.0' });
