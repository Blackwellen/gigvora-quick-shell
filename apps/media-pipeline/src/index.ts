import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';

const log = pino({ name: 'media-pipeline' });
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null });

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: process.env.S3_ACCESS_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  } : undefined,
});
const BUCKET = process.env.S3_BUCKET ?? 'gigvora-media';

export const signUpload = (key: string, contentType: string) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 900 });

export const signDownload = (key: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 900 });

new Worker('media', async (job) => {
  const { kind, key } = job.data as { kind: 'image'|'video'|'audio'; key: string };
  // NOTE: actual transcoding (ffmpeg/sharp) is delegated to an external worker host.
  // This stub records intent + verifies the asset exists.
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  log.info({ kind, key, size: head.ContentLength }, 'media job processed (stub)');
  return { key, kind, size: head.ContentLength, processedAt: Date.now() };
}, { connection, concurrency: 4 });

log.info('media-pipeline ready');
