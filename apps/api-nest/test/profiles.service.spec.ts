import { ProfilesRepository } from '../src/modules/profiles/profiles.repository';
import { ProfilesService } from '../src/modules/profiles/profiles.service';

describe('ProfilesService — Domain 11', () => {
  let svc: ProfilesService;
  let repo: ProfilesRepository;
  const me = '00000000-0000-0000-0000-000000000001';
  const other = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    repo = new ProfilesRepository();
    svc = new ProfilesService(repo);
    await svc.upsertProfile(me, { handle: 'me', displayName: 'Me' });
    await svc.upsertProfile(other, { handle: 'other', displayName: 'Other' });
  });

  it('returns the 11-tab profile envelope for an existing identity', async () => {
    const full = await svc.getFullProfile(me, other);
    expect(full.profile.handle).toBe('me');
    expect(full.tabs).toHaveProperty('overview');
    expect(full.tabs).toHaveProperty('skills');
    expect(full.tabs).toHaveProperty('media');
    expect(full.tabs).toHaveProperty('reviews');
  });

  it('blocks self-review and blocks self-endorsement', async () => {
    await expect(svc.addReview(me, { subjectId: me, rating: 5 })).rejects.toThrow();
    const skills = await svc.addSkill(me, { skill: 'TypeScript' });
    await expect(svc.endorseSkill(me, skills[0].id, me)).rejects.toThrow();
  });

  it('recomputes reputation deterministically and awards badges at top band', async () => {
    for (let i = 0; i < 6; i++) await svc.addPortfolio(me, { title: `Work ${i}` });
    for (let i = 0; i < 5; i++) await svc.addReview(other, { subjectId: me, rating: 5 });
    await svc.approveVerification(me, 'id_document', 'admin');
    const rep = await svc.recomputeReputation(me);
    expect(rep.score).toBeGreaterThan(60);
    const badges = await svc.listBadges(me);
    expect(badges.find(b => b.code === 'verified')).toBeTruthy();
  });

  it('refuses to read private profiles for non-owners', async () => {
    await svc.upsertProfile(me, { visibility: 'private' });
    await expect(svc.getFullProfile(me, other)).rejects.toThrow();
  });
});
