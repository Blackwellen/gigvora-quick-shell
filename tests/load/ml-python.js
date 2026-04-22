/**
 * k6 load test — ML Python service.
 * Exercises every primary endpoint at SLO p95 budgets for 60 s @ 50 VUs.
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:8001 tests/load/ml-python.js
 *
 * Pass criteria (matches docs/architecture/slo-ml-python.md):
 *   • http_req_failed < 0.5 %
 *   • each endpoint's p95 below its SLO budget
 */
import http from 'k6/http';
import { check, group } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8001';

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.005'],
    'http_req_duration{endpoint:search.rank}':       ['p(95)<120'],
    'http_req_duration{endpoint:profiles.similar}':  ['p(95)<150'],
    'http_req_duration{endpoint:companies.similar}': ['p(95)<150'],
    'http_req_duration{endpoint:agency.rank}':       ['p(95)<120'],
    'http_req_duration{endpoint:agency.prooftrust}': ['p(95)<20'],
    'http_req_duration{endpoint:groups.moderate}':   ['p(95)<40'],
    'http_req_duration{endpoint:match.score}':       ['p(95)<20'],
    'http_req_duration{endpoint:rank.legacy}':       ['p(95)<120'],
    'http_req_duration{endpoint:moderate.legacy}':   ['p(95)<20'],
  },
};

const J = { 'content-type': 'application/json' };
const post = (path, body, tag) =>
  http.post(`${BASE}${path}`, JSON.stringify(body), { headers: J, tags: { endpoint: tag } });

const docs = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `d${i}`,
    title: `Document ${i}`,
    body: 'lorem ipsum dolor sit amet',
    tags: ['ai', 'platform', i % 2 ? 'b2b' : 'b2c'],
    kind: 'post',
    recency_days: i,
  }));

const profiles = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    headline: 'Senior Engineer',
    skills: ['typescript', 'react', i % 2 ? 'node' : 'python'],
    industries: ['software'],
    seniority: 4,
  }));

const agencies = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `a${i}`,
    slug: `agency-${i}`,
    name: `Agency ${i}`,
    specialties: ['design', 'branding'],
    industry: 'software',
    languages: ['en'],
    ratingAvg: 4.5,
    ratingCount: 30,
    verified: true,
    completedProjects: 25,
    acceptingProjects: true,
  }));

export default function () {
  group('search.rank', () =>
    check(post('/search/rank', { query: 'ai platform', docs: docs(50), limit: 20 }, 'search.rank'), {
      '200': (r) => r.status === 200,
    }),
  );
  group('profiles.similar', () =>
    check(
      post(
        '/profiles/similar',
        { target: profiles(1)[0], candidates: profiles(50), limit: 10 },
        'profiles.similar',
      ),
      { '200': (r) => r.status === 200 },
    ),
  );
  group('companies.similar', () =>
    check(
      post(
        '/companies/similar',
        { target: profiles(1)[0], candidates: profiles(50), limit: 10 },
        'companies.similar',
      ),
      { '200': (r) => r.status === 200 || r.status === 404 },
    ),
  );
  group('agency.rank', () =>
    check(
      post(
        '/agency/rank',
        { query: { skills: ['design'], industry: 'software' }, items: agencies(50), limit: 12 },
        'agency.rank',
      ),
      { '200': (r) => r.status === 200 },
    ),
  );
  group('agency.prooftrust', () =>
    check(
      post(
        '/agency/proof-trust',
        { proofs: [{ kind: 'security', verified: true }, { kind: 'award', verified: false }] },
        'agency.prooftrust',
      ),
      { '200': (r) => r.status === 200 },
    ),
  );
  group('groups.moderate', () =>
    check(
      post(
        '/groups/moderate',
        { posts: docs(50).map((d) => ({ id: d.id, body: d.body, author_trust: 0.7 })) },
        'groups.moderate',
      ),
      { '200': (r) => r.status === 200 || r.status === 404 },
    ),
  );
  group('match.score', () =>
    check(
      post(
        '/match/score',
        { candidate: { skills: ['react', 'node'] }, target: { skills: ['react', 'python'] } },
        'match.score',
      ),
      { '200': (r) => r.status === 200 },
    ),
  );
  group('rank.legacy', () =>
    check(
      post(
        '/rank',
        { query: { tags: ['ai'] }, items: docs(50) },
        'rank.legacy',
      ),
      { '200': (r) => r.status === 200 },
    ),
  );
  group('moderate.legacy', () =>
    check(post('/moderate', { content: 'this is fine' }, 'moderate.legacy'), {
      '200': (r) => r.status === 200,
    }),
  );
}
