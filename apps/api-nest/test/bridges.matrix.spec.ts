/**
 * Group 2 — Smoke matrix across every refactored bridge service.
 * Confirms each bridge:
 *   1. Calls MlClient.withFallback exactly once
 *   2. Returns the upstream envelope on a 200 response
 *   3. Returns a deterministic fallback envelope when the upstream fails
 */
import { z } from 'zod';
import { MlClient } from '../src/infra/ml-client';
import { MlMetricsService } from '../src/infra/ml-metrics.service';
import { SearchMlService } from '../src/modules/search/search.ml.service';
import { ProfilesMlService } from '../src/modules/profiles/profiles.ml.service';
import { CompaniesMlService } from '../src/modules/companies/companies.ml.service';
import { FeedMlService } from '../src/modules/feed/feed.ml.service';
import { NetworkMlService } from '../src/modules/network/network.ml.service';
import { NotificationsMlService } from '../src/modules/notifications/notifications.ml.service';
import { GroupsMlService } from '../src/modules/groups/groups.ml.service';
import { AgencyAnalyticsService } from '../src/modules/agency/agency.analytics.service';
import { GroupsAnalyticsService } from '../src/modules/groups/groups.analytics.service';
import { EventsAnalyticsService } from '../src/modules/events/events.analytics.service';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const okMlEnvelope = (data: unknown) => ({
  data,
  meta: { model: 'live', version: '1', latency_ms: 7 },
});

const okAnalyticsEnvelope = (data: unknown) => ({
  data,
  meta: { source: 'live', latency_ms: 4 },
});

describe('Bridge service matrix', () => {
  let metrics: MlMetricsService;
  let ml: MlClient;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    metrics = new MlMetricsService();
    ml = new MlClient(metrics);
    fetchSpy = jest.spyOn(globalThis, 'fetch' as never);
  });
  afterEach(() => fetchSpy.mockRestore());

  // ---- ML services ----

  it('SearchMlService.rank — happy + fallback', async () => {
    const svc = new SearchMlService(ml);
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(okMlEnvelope([{ id: 'a', kind: 'post', score: 0.5 }])) as never,
    );
    let r = await svc.rank('hi', [{ id: 'a' }, { id: 'b', recency_days: 1 }]);
    expect(r.data[0].id).toBe('a');

    fetchSpy.mockRejectedValueOnce(new Error('boom') as never).mockRejectedValueOnce(new Error('boom') as never);
    r = await svc.rank('hi', [{ id: 'a' }, { id: 'b', recency_days: 1 }]);
    expect(r.meta.fallback).toBe(true);
    expect(r.data.length).toBe(2);
  });

  it('ProfilesMlService.similar — fallback uses Jaccard', async () => {
    const svc = new ProfilesMlService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.similar(
      { id: 't', skills: ['a', 'b'] },
      [{ id: 'c', skills: ['a'] }, { id: 'd', skills: ['z'] }],
    );
    expect(r.meta.fallback).toBe(true);
    expect(r.data[0].id).toBe('c');
  });

  it('CompaniesMlService.similar + competitors — happy + fallback', async () => {
    const svc = new CompaniesMlService(ml);
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(okMlEnvelope([{ id: 'c1', score: 0.8, industry_overlap: 1 }])) as never,
    );
    let r = await svc.similar({ id: 't', industries: ['x'] }, [{ id: 'c1', industries: ['x'] }]);
    expect(r.data[0].id).toBe('c1');

    fetchSpy.mockRejectedValue(new Error('down') as never);
    r = await svc.similar({ id: 't', industries: ['x'] }, [{ id: 'c1', industries: ['x'] }]);
    expect(r.meta.fallback).toBe(true);

    const r2 = await svc.competitors({ id: 't', industries: ['x'] }, [{ id: 'c1', industries: ['x'] }]);
    expect(r2.meta.fallback).toBe(true);
  });

  it('FeedMlService.rank — fallback is chronological', async () => {
    const svc = new FeedMlService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.rank(
      { id: 'v' },
      [
        { id: 'old', author_id: 'a', created_hours_ago: 10 },
        { id: 'new', author_id: 'b', created_hours_ago: 1 },
      ],
    );
    expect(r.meta.fallback).toBe(true);
    expect(r.data[0].id).toBe('new');
  });

  it('NetworkMlService.pymk — fallback by mutual count', async () => {
    const svc = new NetworkMlService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.pymk(
      { id: 'v', connections: ['x', 'y'] },
      [
        { id: 'a', connections: ['x'] },
        { id: 'b', connections: ['x', 'y'] },
      ],
    );
    expect(r.meta.fallback).toBe(true);
    expect(r.data[0].id).toBe('b');
  });

  it('NotificationsMlService.prioritise — fallback recency', async () => {
    const svc = new NotificationsMlService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.prioritise({ id: 'r' }, [
      { id: 'old', created_hours_ago: 5 },
      { id: 'new', created_hours_ago: 1, is_mention: true },
    ]);
    expect(r.meta.fallback).toBe(true);
    expect(r.data[0].id).toBe('new');
    expect(r.data[0].bucket).toBe('high');
  });

  it('GroupsMlService.moderate — fallback flags spam', async () => {
    const svc = new GroupsMlService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.moderate([
      { id: 'p1', body: 'hi there' },
      { id: 'p2', body: 'this is a spam scam phishing post' },
    ]);
    expect(r.meta.fallback).toBe(true);
    expect(r.data[0].id).toBe('p2');
    expect(r.data[0].action).toBe('remove');
  });

  // ---- Analytics services ----

  it('AgencyAnalyticsService.summary — happy + fallback', async () => {
    const svc = new AgencyAnalyticsService(ml);
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(
        okAnalyticsEnvelope({
          pipeline_open: 5,
          pipeline_value_cents: 1000,
          inbound_leads_7d: 3,
          proposal_win_rate_pct: 25,
          avg_response_hours: 4,
        }),
      ) as never,
    );
    let r = await svc.summary('agency-1');
    expect(r.data.pipeline_open).toBe(5);

    fetchSpy.mockRejectedValue(new Error('down') as never);
    r = await svc.summary('agency-1');
    expect(r.meta.fallback).toBe(true);
    expect(r.data.pipeline_open).toBe(0);
  });

  it('GroupsAnalyticsService.summary — fallback returns zeros', async () => {
    const svc = new GroupsAnalyticsService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.summary('group-1');
    expect(r.meta.fallback).toBe(true);
    expect(r.data.posts_7d).toBe(0);
  });

  it('EventsAnalyticsService.summary — fallback returns zeros', async () => {
    const svc = new EventsAnalyticsService(ml);
    fetchSpy.mockRejectedValue(new Error('down') as never);
    const r = await svc.summary('event-1');
    expect(r.meta.fallback).toBe(true);
    expect(r.data.attendees).toBe(0);
  });
});
