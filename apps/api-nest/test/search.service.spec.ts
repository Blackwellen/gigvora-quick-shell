import { Test } from '@nestjs/testing';
import { SearchService } from '../src/modules/search/search.service';
import { SearchRepository } from '../src/modules/search/search.repository';

describe('SearchService', () => {
  let svc: SearchService;
  const repo = {
    search: jest.fn(),
    countByIndex: jest.fn(),
    autocomplete: jest.fn(),
    logHistory: jest.fn(),
    logClick: jest.fn(),
    recentForIdentity: jest.fn(),
    trending: jest.fn(),
    listSaved: jest.fn(),
    createSaved: jest.fn(),
    archiveSaved: jest.fn(),
    listActions: jest.fn(),
    listShortcuts: jest.fn(),
    upsertShortcut: jest.fn(),
    linksFor: jest.fn(),
    createLink: jest.fn(),
    upsertDocument: jest.fn(),
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [SearchService, { provide: SearchRepository, useValue: repo }],
    }).compile();
    svc = mod.get(SearchService);
  });
  beforeEach(() => jest.clearAllMocks());

  it('falls back to postgres FTS when OpenSearch is not configured', async () => {
    repo.search.mockResolvedValue([{ id: 'u_sarah', indexName: 'users', title: 'Sarah Chen' }]);
    const r = await svc.search({ q: 'sarah' }, 'identity-1');
    expect(r.source).toBe('postgres');
    expect(r.results).toHaveLength(1);
    expect(repo.logHistory).toHaveBeenCalledWith('identity-1', 'sarah', 'all', 1, expect.any(Number));
  });

  it('returns scoped facet counts', async () => {
    repo.countByIndex.mockResolvedValue({ jobs: 4, gigs: 2 });
    const r = await svc.facets('react', 'id-1');
    expect(r.total).toBe(6);
    expect(r.counts.jobs).toBe(4);
  });

  it('autocomplete short-circuits empty queries', async () => {
    const r = await svc.autocomplete({ q: '' });
    expect(r).toEqual([]);
    expect(repo.autocomplete).not.toHaveBeenCalled();
  });

  it('archiveSaved throws when the saved search does not belong to identity', async () => {
    repo.archiveSaved.mockResolvedValue(null);
    await expect(svc.archiveSaved('id-1', 's-1')).rejects.toThrow('saved_search_not_found');
  });

  it('listActions filters by role and entitlement', async () => {
    repo.listActions.mockResolvedValue([{ id: 'goto.inbox' }]);
    await svc.listActions(['user'], []);
    expect(repo.listActions).toHaveBeenCalledWith(['user'], []);
  });

  it('createLink forwards the actor for audit', async () => {
    repo.createLink.mockResolvedValue({ id: 'cl-1' });
    await svc.createLink({ sourceIndex: 'gigs', sourceId: 'g1', targetIndex: 'companies', targetId: 'c1', relation: 'attached_to' }, 'actor-1');
    expect(repo.createLink).toHaveBeenCalledWith(expect.any(Object), 'actor-1');
  });

  it('trackClick logs the click with the search context', async () => {
    await svc.trackClick({ query: 'react', clickedId: 'j1', clickedIndex: 'jobs', scope: 'jobs' }, 'id-1');
    expect(repo.logClick).toHaveBeenCalledWith('id-1', 'react', 'jobs', 'j1', 'jobs');
  });
});
