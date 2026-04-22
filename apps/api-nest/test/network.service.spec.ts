pusahj inot thimport { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NetworkService } from '../src/modules/network/network.service';

function makeRepo(overrides: any = {}) {
  return {
    createRequest: jest.fn(async (a: string, b: string) => ({ id: 'req1', requester_id: a, recipient_id: b, status: 'pending' })),
    listBlocks:    jest.fn(async () => []),
    respond:       jest.fn(async (_r: string, id: string, dec: string) =>
      dec === 'accept'
        ? { id, requester_id: 'u1', recipient_id: 'u2', status: 'accepted' }
        : { id, requester_id: 'u1', recipient_id: 'u2', status: 'declined' }),
    recomputeEdges: jest.fn(async () => undefined),
    withdraw:      jest.fn(async (_r: string, id: string) => ({ id, status: 'withdrawn' })),
    listIncoming:  jest.fn(async () => []),
    listOutgoing:  jest.fn(async () => []),
    removeConnection: jest.fn(async () => [1]),
    connectionsOf: jest.fn(async () => []),
    countConnections: jest.fn(async () => 5),
    block:         jest.fn(async () => [{}]),
    unblock:       jest.fn(async () => [1]),
    degree:        jest.fn(async () => ({ degree: 2, mutual_count: 3 })),
    mutuals:       jest.fn(async () => [{ user_id: 'm1' }]),
    suggestions:   jest.fn(async () => [{ user_id: 's1', degree: 2, mutual_count: 4 }]),
    ...overrides,
  };
}

describe('NetworkService', () => {
  it('rejects self-connect', async () => {
    const svc = new NetworkService(makeRepo() as any);
    await expect(svc.send('u1', { recipientId: 'u1' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects blocked recipient', async () => {
    const svc = new NetworkService(makeRepo({ listBlocks: async () => [{ blocked_id: 'u2' }] }) as any);
    await expect(svc.send('u1', { recipientId: 'u2' } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate pending request', async () => {
    const svc = new NetworkService(makeRepo({ createRequest: async () => undefined }) as any);
    await expect(svc.send('u1', { recipientId: 'u2' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('on accept materialises connection and recomputes both edges', async () => {
    const repo = makeRepo();
    const svc = new NetworkService(repo as any);
    const r = await svc.respond('u2', 'req1', { decision: 'accept' } as any);
    expect(r.status).toBe('accepted');
    expect(repo.recomputeEdges).toHaveBeenCalledTimes(2);
  });

  it('on decline does NOT recompute edges', async () => {
    const repo = makeRepo();
    const svc = new NetworkService(repo as any);
    await svc.respond('u2', 'req1', { decision: 'decline' } as any);
    expect(repo.recomputeEdges).not.toHaveBeenCalled();
  });

  it('respond throws when no row', async () => {
    const svc = new NetworkService(makeRepo({ respond: async () => undefined }) as any);
    await expect(svc.respond('u2', 'rXX', { decision: 'accept' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('block recomputes both sides + removes existing connection', async () => {
    const repo = makeRepo();
    const svc = new NetworkService(repo as any);
    await svc.block('u1', 'u2', 'spam');
    expect(repo.removeConnection).toHaveBeenCalledWith('u1', 'u2');
    expect(repo.recomputeEdges).toHaveBeenCalledTimes(2);
  });

  it('degree returns 0 for self', async () => {
    const svc = new NetworkService(makeRepo() as any);
    expect(await svc.degree('u1', 'u1')).toEqual({ degree: 0, mutual_count: 0 });
  });

  it('suggestions returns ranked list', async () => {
    const svc = new NetworkService(makeRepo() as any);
    const out = await svc.suggestions('u1', { limit: 5 } as any);
    expect(out[0].user_id).toBe('s1');
  });
});
