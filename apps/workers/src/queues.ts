/** FD-14 worker — shared queue names (mirrors apps/api-nest/.../queues.constants.ts). */
export const QUEUES = {
  notifications: 'notifications',
  indexing:      'indexing',
  media:         'media',
  billing:       'billing',
  webhooks:      'webhooks-out',
  analytics:     'analytics-rollup',
  mlBatch:       'ml-batch',
} as const;
export type QueueName = typeof QUEUES[keyof typeof QUEUES];
export const ALL_QUEUES: QueueName[] = Object.values(QUEUES);
