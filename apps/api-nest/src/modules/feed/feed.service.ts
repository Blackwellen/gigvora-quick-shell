import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { FeedRepository } from './feed.repository';
import { AuditService } from '../workspace/audit.service';
import { ModerationClient } from '../../infra/moderation-client';
import { SearchIndexClient } from '../../infra/search-index-client';
import { D7Emit } from '../domain-bus/domain-emissions';
import type { CommentDto, CreatePostDto, FeedQueryDto, ReactionDto, UpdatePostDto } from './dto';

/**
 * Service-level rules:
 *   • on publish, fan-out to all followers' feed_index with a deterministic
 *     base score (recency + reaction velocity proxy). ML re-rank is optional
 *     and falls back to this score when unavailable.
 *   • opportunity posts get a +0.15 score boost so they surface above noise.
 *   • visibility 'private' / 'org' is excluded from public discovery.
 *   • every state change is audited (actor, action, target, diff).
 */
@Injectable()
export class FeedService {
  constructor(
    private readonly repo: FeedRepository,
    private readonly audit: AuditService,
    private readonly moderation: ModerationClient,
    private readonly searchIndex: SearchIndexClient,
  ) {}

  // ---------- posts ----------
  async createPost(authorId: string, dto: CreatePostDto) {
    if (dto.kind === 'poll' && (!dto.poll || !Array.isArray(dto.poll.options) || dto.poll.options.length < 2)) {
      throw new BadRequestException('poll requires ≥2 options');
    }
    if (dto.kind === 'opportunity' && (!dto.opportunity || !dto.opportunity.title)) {
      throw new BadRequestException('opportunity requires a title');
    }

    // FD-12 — moderation guard in the write path. `guard()` throws (422) when
    // the verdict is `reject` and MODERATION_ENFORCE!=0; on `hold` we still
    // persist but flag the verdict so trust-and-safety queues can pick it up.
    const moderationText = [
      dto.body ?? '',
      dto.opportunity?.title ?? '',
      dto.opportunity?.description ?? '',
      ...(dto.poll?.options ?? []).map((o: any) => (typeof o === 'string' ? o : o?.label ?? '')),
    ].filter(Boolean).join('\n');
    let verdict: Awaited<ReturnType<ModerationClient['guard']>> | null = null;
    try {
      verdict = await this.moderation.guard({
        id: `feed:${authorId}:${Date.now()}`,
        text: moderationText,
        surface: `feed.${dto.kind ?? 'post'}`,
      });
    } catch (err) {
      const e = err as Error & { status?: number; verdict?: any };
      if (e.status === 422 && e.verdict) {
        await this.audit.record({
          actorId: authorId, domain: 'feed', action: 'feed.post.rejected',
          targetType: 'post', targetId: 'pending',
          meta: { reasons: e.verdict.reasons, score: e.verdict.score, model: e.verdict.model, fallback: e.verdict.fallback },
        });
        throw new ForbiddenException({
          code: 'moderation_rejected',
          reasons: e.verdict.reasons,
          score: e.verdict.score,
          model: e.verdict.model,
        });
      }
      throw err;
    }

    const post = await this.repo.createPost(authorId, dto);

    // Fan-out (synchronous for v1; move to BullMQ when follower counts > 1k)
    const followers = await this.repo.followersOf(authorId);
    const baseScore = dto.kind === 'opportunity' ? 0.85 : 0.70;
    for (const f of followers) {
      await this.repo.fanOut(f.follower_id, post.id, baseScore, dto.kind === 'opportunity' ? 'opportunity' : 'follow');
    }
    await this.repo.fanOut(authorId, post.id, 1.0, 'follow');

    await this.audit.record({
      actorId: authorId, domain: 'feed', action: 'feed.post.create',
      targetType: 'post', targetId: post.id,
      meta: {
        kind: dto.kind, visibility: dto.visibility ?? 'public', followers: followers.length,
        moderation: verdict ? { action: verdict.action, score: verdict.score, model: verdict.model, fallback: verdict.fallback } : null,
      },
    });
    void D7Emit.postCreated(authorId, post.id, { kind: dto.kind, visibility: dto.visibility ?? 'public', authorId });
    if ((dto.visibility ?? 'public') === 'public' && verdict?.action !== 'hold') {
      void D7Emit.postPublished(authorId, post.id, { kind: dto.kind, authorId });
      // FD-11 — canonical search fan-out (FTS mirror + OpenSearch enqueue).
      void this.searchIndex.upsert({
        index: 'posts', id: post.id,
        title: (dto.body ?? dto.opportunity?.title ?? '').slice(0, 256) || 'Post',
        body: dto.body ?? dto.opportunity?.description ?? '',
        tags: (dto.tags as string[] | undefined) ?? [],
        url: `/feed/${post.id}`,
        ownerId: authorId, visibility: 'public',
        status: 'published',
        meta: { kind: dto.kind, authorId },
      });
    }
    return { ...post, moderation: verdict ? { action: verdict.action, fallback: verdict.fallback, model: verdict.model } : null };
  }

  async updatePost(authorId: string, id: string, dto: UpdatePostDto) {
    const updated = await this.repo.updatePost(authorId, id, dto);
    if (updated) {
      await this.audit.record({
        actorId: authorId, domain: 'feed', action: 'feed.post.update',
        targetType: 'post', targetId: id,
        meta: { fields: Object.keys(dto) },
      });
      void D7Emit.postUpdated(authorId, id, { fields: Object.keys(dto) });
    }
    return updated;
  }

  async archivePost(authorId: string, id: string) {
    const r = await this.repo.archivePost(authorId, id);
    await this.audit.record({
      actorId: authorId, domain: 'feed', action: 'feed.post.archive',
      targetType: 'post', targetId: id,
    });
    void D7Emit.postDeleted(authorId, id, { reason: 'archive' });
    return r;
  }

  getPost(id: string)                                          { return this.repo.getPost(id); }
  authorTimeline(authorId: string, limit?: number)             { return this.repo.authorTimeline(authorId, limit); }

  // ---------- feed ----------
  async homeFeed(viewerId: string, q: FeedQueryDto) {
    const limit = Math.min(Math.max(q.limit ?? 20, 1), 100);
    const items = await this.repo.homeFeed(viewerId, limit, q.reason);
    return { items, total: items.length, limit, hasMore: items.length === limit };
  }

  // ---------- engagement ----------
  async react(postId: string, actorId: string, dto: ReactionDto) {
    const r = await this.repo.upsertReaction(postId, actorId, dto.kind);
    await this.audit.record({
      actorId, domain: 'feed', action: 'feed.post.react',
      targetType: 'post', targetId: postId, meta: { kind: dto.kind },
    });
    void D7Emit.reactionAdded(actorId, postId, { kind: dto.kind, actorId });
    return r;
  }
  async unreact(postId: string, actorId: string) {
    const r = await this.repo.removeReaction(postId, actorId);
    await this.audit.record({
      actorId, domain: 'feed', action: 'feed.post.unreact',
      targetType: 'post', targetId: postId,
    });
    void D7Emit.reactionRemoved(actorId, postId, { actorId });
    return r;
  }
  async comment(postId: string, authorId: string, dto: CommentDto) {
    // FD-12 — moderation guard on the comment write path.
    let verdict: Awaited<ReturnType<ModerationClient['guard']>> | null = null;
    try {
      verdict = await this.moderation.guard({
        id: `feed.comment:${postId}:${authorId}:${Date.now()}`,
        text: dto.body ?? '',
        surface: 'feed.comment',
      });
    } catch (err) {
      const e = err as Error & { status?: number; verdict?: any };
      if (e.status === 422 && e.verdict) {
        await this.audit.record({
          actorId: authorId, domain: 'feed', action: 'feed.comment.rejected',
          targetType: 'post', targetId: postId,
          meta: { reasons: e.verdict.reasons, score: e.verdict.score, model: e.verdict.model },
        });
        throw new ForbiddenException({ code: 'moderation_rejected', reasons: e.verdict.reasons, score: e.verdict.score });
      }
      throw err;
    }
    const c = await this.repo.comment(postId, authorId, dto.body, dto.parentId);
    await this.audit.record({
      actorId: authorId, domain: 'feed', action: 'feed.comment.create',
      targetType: 'post', targetId: postId,
      meta: {
        commentId: c.id, parentId: dto.parentId ?? null,
        moderation: verdict ? { action: verdict.action, score: verdict.score, model: verdict.model, fallback: verdict.fallback } : null,
      },
    });
    void D7Emit.commentAdded(authorId, c.id, { postId, parentId: dto.parentId ?? null });
    return { ...c, moderation: verdict ? { action: verdict.action, fallback: verdict.fallback } : null };
  }
  async comments(postId: string, limit?: number)            { const items = await this.repo.listComments(postId, limit); const lim = limit ?? items.length; return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim }; }
  async toggleSave(actorId: string, postId: string) {
    const r = await this.repo.toggleSave(actorId, postId);
    await this.audit.record({
      actorId, domain: 'feed', action: r.saved ? 'feed.post.save' : 'feed.post.unsave',
      targetType: 'post', targetId: postId,
    });
    return r;
  }
  async listSaves(actorId: string)                          { const items = await this.repo.listSaves(actorId); return { items, total: items.length, limit: items.length, hasMore: false }; }

  // ---------- follows ----------
  async follow(followerId: string, followeeId: string) {
    if (followerId === followeeId) throw new BadRequestException('cannot follow yourself');
    const r = await this.repo.follow(followerId, followeeId);
    await this.audit.record({
      actorId: followerId, domain: 'feed', action: 'feed.follow',
      targetType: 'identity', targetId: followeeId,
    });
    return r;
  }
  async unfollow(followerId: string, followeeId: string) {
    const r = await this.repo.unfollow(followerId, followeeId);
    await this.audit.record({
      actorId: followerId, domain: 'feed', action: 'feed.unfollow',
      targetType: 'identity', targetId: followeeId,
    });
    return r;
  }
  isFollowing(followerId: string, followeeId: string) { return this.repo.isFollowing(followerId, followeeId); }

  // ---------- opportunity cards ----------
  async opportunityCards(kind?: string, limit?: number) { const items = await this.repo.listOpportunityCards(kind, limit); const lim = limit ?? items.length; return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim }; }
}
