import { Test } from '@nestjs/testing';
import { MarketingService } from '../src/modules/marketing/marketing.service';
import { MarketingRepository } from '../src/modules/marketing/marketing.repository';
import { AuditService } from '../src/modules/workspace/audit.service';

describe('MarketingService', () => {
  let svc: MarketingService;
  const repo = {
    listPages: jest.fn().mockResolvedValue([{ slug: 'home' }]),
    getPageBySlug: jest.fn(),
    upsertPage: jest.fn().mockResolvedValue({ id: 'p1', slug: 'home', status: 'published' }),
    createLead: jest.fn().mockResolvedValue({ id: 'l1', email: 'a@b.co', status: 'new', score: 0 }),
    listLeads: jest.fn().mockResolvedValue([]),
    subscribe: jest.fn().mockResolvedValue({ email: 'x@y.z', status: 'pending', confirmToken: 'tok' }),
    confirmSubscriber: jest.fn().mockResolvedValue({ email: 'x@y.z' }),
    unsubscribe: jest.fn().mockResolvedValue({ email: 'x@y.z' }),
    getExperimentByKey: jest.fn().mockResolvedValue({
      id: 'e1', key: 'home.hero.cta', name: 'x', status: 'running',
      variants: [{ id: 'v1', label: 'control', payload: {}, weight: 50 }],
    }),
    recordCtaEvent: jest.fn().mockResolvedValue(undefined),
    ctaSummary: jest.fn().mockResolvedValue([{ variantId: 'v1', label: 'control', impressions: 1, clicks: 0, conversions: 0 }]),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        MarketingService,
        { provide: MarketingRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    svc = mod.get(MarketingService);
  });

  it('returns pages from repo', async () => {
    expect(await svc.listPages({})).toEqual([{ slug: 'home' }]);
  });

  it('throws on missing page', async () => {
    repo.getPageBySlug.mockResolvedValueOnce(null);
    await expect(svc.getPage('does-not-exist')).rejects.toThrow('marketing_page_not_found');
  });

  it('upserts a page and audits it', async () => {
    const out = await svc.upsertPage({ slug: 'home', surface: 'landing', title: 't' } as any, 'user-1');
    expect(out.id).toBe('p1');
    expect(audit.record).toHaveBeenCalledWith('user-1', 'marketing.page.upsert', expect.any(Object), expect.any(Object));
  });

  it('creates a lead with IP/UA', async () => {
    const out = await svc.createLead({ email: 'a@b.co' } as any, '1.2.3.4', 'jest');
    expect(out.email).toBe('a@b.co');
    expect(repo.createLead).toHaveBeenCalledWith({ email: 'a@b.co' }, '1.2.3.4', 'jest');
  });

  it('records a CTA event for a known experiment+variant', async () => {
    const r = await svc.recordCtaEvent({ experimentKey: 'home.hero.cta', variantLabel: 'control', eventType: 'click' });
    expect(r).toEqual({ ok: true });
    expect(repo.recordCtaEvent).toHaveBeenCalledWith('e1', 'v1', 'click', null, null, null);
  });

  it('rejects unknown experiment', async () => {
    repo.getExperimentByKey.mockResolvedValueOnce(null);
    await expect(svc.recordCtaEvent({ experimentKey: 'nope', eventType: 'click' })).rejects.toThrow('unknown_experiment');
  });
});
