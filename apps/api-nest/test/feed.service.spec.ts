import { BadRequestException } from '@nestjs/common';
import { FeedService } from '../src/modules/feed/feed.service';

function makeRepo() {
  const posts: any[] = [];
  const fan: any[] = [];
  const reactions: any[] = [];
  const repo: any = {
    createPost: jest.fn(async (authorId: string, dto: any) => { const p = { id: `post${posts.length+1}`, author_id: authorId, ...dto }; posts.push(p); return p; }),
    updatePost: jest.fn(async (_a: string, id: string, dto: any) => ({ id, ...dto })),
    archivePost: jest.fn(async (_a: string, id: string) => [{ id }]),
    getPost: jest.fn(async (id: string) => posts.find(p => p.id === id)),
    authorTimeline: jest.fn(async (authorId: string) => posts.filter(p => p.author_id === authorId)),
    homeFeed: jest.fn(async (viewerId: string) => fan.filter(f => f.viewer_id === viewerId)),
    fanOut: jest.fn(async (viewer_id: string, post_id: string, score: number, reason: string) => { fan.push({ viewer_id, post_id, score, reason }); }),
    followersOf: jest.fn(async () => [{ follower_id: 'u2' }, { follower_id: 'u3' }]),
    upsertReaction: jest.fn(async (post_id: string, actor_id: string, kind: string) => { reactions.push({ post_id, actor_id, kind }); return { reaction_count: reactions.length }; }),
    removeReaction: jest.fn(async () => ({ reaction_count: 0 })),
    comment: jest.fn(async (post_id: string, author_id: string, body: string) => ({ id: 'c1', post_id, author_id, body })),
    listComments: jest.fn(async () => []),
    toggleSave: jest.fn(async () => ({ saved: true })),
    listSaves: jest.fn(async () => []),
    follow: jest.fn(async () => [1]),
    unfollow: jest.fn(async () => [1]),
    isFollowing: jest.fn(async () => true),
    listOpportunityCards: jest.fn(async () => [{ id: 'oc1', kind: 'job' }]),
  };
  return { repo, posts, fan, reactions };
}

describe('FeedService', () => {
  it('publishes a post and fans out to followers + author', async () => {
    const { repo, fan } = makeRepo();
    const svc = new FeedService(repo);
    const p = await svc.createPost('u1', { kind: 'text', body: 'hello' } as any);
    expect(p.id).toBe('post1');
    // 2 followers + author = 3 fan-out rows
    expect(fan.map(f => f.viewer_id).sort()).toEqual(['u1', 'u2', 'u3']);
  });

  it('boosts opportunity posts during fan-out', async () => {
    const { repo, fan } = makeRepo();
    const svc = new FeedService(repo);
    await svc.createPost('u1', { kind: 'opportunity', body: 'hiring', opportunity: { kind: 'job', refId: 'j1', title: 'Eng' } } as any);
    const followerRow = fan.find(f => f.viewer_id === 'u2');
    expect(followerRow.reason).toBe('opportunity');
    expect(followerRow.score).toBeGreaterThanOrEqual(0.85);
  });

  it('rejects polls with fewer than 2 options', async () => {
    const svc = new FeedService(makeRepo().repo);
    await expect(svc.createPost('u1', { kind: 'poll', body: '?', poll: { question: 'q', options: [{ label: 'a' }] } } as any))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects opportunity posts without title', async () => {
    const svc = new FeedService(makeRepo().repo);
    await expect(svc.createPost('u1', { kind: 'opportunity', body: '' } as any))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects self-follow', async () => {
    const svc = new FeedService(makeRepo().repo);
    await expect(svc.follow('u1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reaction increments counter', async () => {
    const svc = new FeedService(makeRepo().repo);
    const r = await svc.react('post1', 'u2', { kind: 'celebrate' } as any);
    expect(r.reaction_count).toBe(1);
  });

  it('opportunityCards returns a list', async () => {
    const svc = new FeedService(makeRepo().repo);
    const cards = await svc.opportunityCards('job');
    expect(cards.length).toBeGreaterThan(0);
  });
});
