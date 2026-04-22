import { CompaniesRepository } from '../src/modules/companies/companies.repository';
import { CompaniesService } from '../src/modules/companies/companies.service';

describe('CompaniesService — Domain 12', () => {
  let svc: CompaniesService;
  let repo: CompaniesRepository;
  const owner = '00000000-0000-0000-0000-000000000001';
  const stranger = '00000000-0000-0000-0000-000000000099';

  beforeEach(() => { repo = new CompaniesRepository(); svc = new CompaniesService(repo); });

  it('create assigns creator as owner', async () => {
    const c = await svc.create(owner, { slug: 'acme', name: 'Acme' });
    const members = await svc.listMembers(c.id);
    expect(members[0].role).toBe('owner');
  });

  it('rejects updates from non-members', async () => {
    const c = await svc.create(owner, { slug: 'acme2', name: 'Acme' });
    await expect(svc.update(c.id, stranger, { tagline: 'x' })).rejects.toThrow();
  });

  it('follow/unfollow toggles count', async () => {
    const c = await svc.create(owner, { slug: 'acme3', name: 'Acme' });
    const f1 = await svc.follow(c.id, stranger);
    expect(f1.followerCount).toBe(1);
    const f2 = await svc.unfollow(c.id, stranger);
    expect(f2.followerCount).toBe(0);
  });

  it('hides private companies from non-members', async () => {
    const c = await svc.create(owner, { slug: 'priv', name: 'Priv', visibility: 'private' });
    await expect(svc.detail(c.id, stranger)).rejects.toThrow();
    const detail = await svc.detail(c.id, owner);
    expect(detail.company.id).toBe(c.id);
  });

  it('owner cannot demote themselves', async () => {
    const c = await svc.create(owner, { slug: 'acme4', name: 'Acme' });
    await expect(svc.setRole(c.id, owner, owner, 'editor')).rejects.toThrow();
  });
});
