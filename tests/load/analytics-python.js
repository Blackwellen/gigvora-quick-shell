/**
 * k6 load test — Analytics Python service.
 * Validates the SLOs declared in docs/architecture/slo-analytics-python.md.
 *
 * Usage:
 *   k6 run --env BASE=http://localhost:8002 tests/load/analytics-python.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    steady: {
      executor: 'constant-arrival-rate',
      rate: 100, // RPS
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'], // < 0.1 %
    http_req_duration: ['p(95)<150', 'p(99)<400'],
  },
};

const BASE = __ENV.BASE || 'http://localhost:8002';

export default function () {
  const summaryRes = http.post(
    `${BASE}/summary`,
    JSON.stringify({ metric: 'dau', series: [1, 2, 3, 4, 5, 6, 7] }),
    { headers: { 'content-type': 'application/json' } },
  );
  check(summaryRes, { '/summary 200': (r) => r.status === 200 });

  const forecastRes = http.post(
    `${BASE}/forecast`,
    JSON.stringify({ series: [10, 12, 14, 16], horizon: 5 }),
    { headers: { 'content-type': 'application/json' } },
  );
  check(forecastRes, { '/forecast 200': (r) => r.status === 200 });

  sleep(0.05);
}
