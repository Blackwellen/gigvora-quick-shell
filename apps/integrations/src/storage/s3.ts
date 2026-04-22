import { register, type Adapter } from '../index';
export const s3Adapter: Adapter = {
  id: 's3', category: 'storage',
  configure() {},
  async healthcheck() { return { ok: !!process.env.S3_BUCKET }; },
};
register(s3Adapter);
