/** FD-14 — single source of truth for BullMQ queue names. */
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

/** Default job options applied to every producer enqueue. */
export const DEFAULT_JOB_OPTS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 1500 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail:     { age: 24 * 3600 },
};
