import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { CreatePostDto, UpdatePostDto } from './dto';

/** Hot-path queries for Feed Home + publishing. Bounded + indexed throughout. */
@Injectable()
export class FeedRepository {
  constructor(private readonly ds: DataSource) {}

  // ---------- posts ----------
  createPost(authorId: string, dto: CreatePostDto) {
    return this.ds.query(
      `INSERT INTO posts (author_id, org_id, kind, visibility, body, media, link, poll, opportunity, tags, language)
       VALUES ($1, $2, $3::post_kind, COALESCE($4,'public')::post_visibility, $5,
               COALESCE($6::jsonb,'[]'::jsonb), $7::jsonb, $8::jsonb, $9::jsonb,
               COALESCE($10,'{}'::text[]), COALESCE($11,'en'))
       RETURNING *`,
      [authorId, dto.orgId ?? null, dto.kind, dto.visibility ?? null, dto.body,
       dto.media ? JSON.stringify(dto.media) : null,
       dto.link ? JSON.stringify(dto.link) : null,
       dto.poll ? JSON.stringify(dto.poll) : null,
       dto.opportunity ? JSON.stringify(dto.opportunity) : null,
       dto.tags ?? null, dto.language ?? null],
    ).then(r => r[0]);
  }

  updatePost(authorId: string, id: string, dto: UpdatePostDto) {
    return this.ds.query(
      `UPDATE posts SET
         body       = COALESCE($3, body),
         visibility = COALESCE($4::post_visibility, visibility),
         tags       = COALESCE($5, tags),
         edited_at  = now(), updated_at = now()
       WHERE id = $1 AND author_id = $2
       RETURNING *`,
      [id, authorId, dto.body ?? null, dto.visibility ?? null, dto.tags ?? null],
    ).then(r => r[0]);
  }

  archivePost(authorId: string, id: string) {
    return this.ds.query(
      `UPDATE posts SET status = 'archived', archived_at = now()
       WHERE id = $1 AND author_id = $2 RETURNING id`,
      [id, authorId],
    );
  }

  getPost(id: string) {
    return this.ds.query(`SELECT * FROM posts WHERE id = $1 LIMIT 1`, [id]).then(r => r[0]);
  }

  authorTimeline(authorId: string, limit = 20) {
    return this.ds.query(
      `SELECT * FROM posts WHERE author_id = $1 AND status = 'published'
        ORDER BY created_at DESC LIMIT $2`,
      [authorId, Math.min(limit, 100)],
    );
  }

  // ---------- feed ----------
  homeFeed(viewerId: string, limit = 20, reason?: string) {
    if (reason) {
      return this.ds.query(
        `SELECT p.*, fi.score, fi.reason
           FROM feed_index fi JOIN posts p ON p.id = fi.post_id
          WHERE fi.viewer_id = $1 AND p.status = 'published' AND fi.reason = $3
          ORDER BY fi.score DESC, fi.inserted_at DESC LIMIT $2`,
        [viewerId, Math.min(limit, 100), reason],
      );
    }
    return this.ds.query(
      `SELECT p.*, fi.score, fi.reason
         FROM feed_index fi JOIN posts p ON p.id = fi.post_id
        WHERE fi.viewer_id = $1 AND p.status = 'published'
        ORDER BY fi.score DESC, fi.inserted_at DESC LIMIT $2`,
      [viewerId, Math.min(limit, 100)],
    );
  }

  fanOut(viewerId: string, postId: string, score: number, reason: string) {
    return this.ds.query(
      `INSERT INTO feed_index (viewer_id, post_id, score, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (viewer_id, post_id) DO UPDATE SET score = EXCLUDED.score, reason = EXCLUDED.reason`,
      [viewerId, postId, score, reason],
    );
  }

  followersOf(authorId: string) {
    return this.ds.query(`SELECT follower_id FROM follows WHERE followee_id = $1`, [authorId]);
  }

  // ---------- reactions / comments / saves ----------
  upsertReaction(postId: string, actorId: string, kind: string) {
    return this.ds.transaction(async (mgr) => {
      const existed = await mgr.query(`SELECT 1 FROM post_reactions WHERE post_id=$1 AND actor_id=$2`, [postId, actorId]);
      await mgr.query(
        `INSERT INTO post_reactions (post_id, actor_id, kind) VALUES ($1, $2, $3::reaction_kind)
         ON CONFLICT (post_id, actor_id) DO UPDATE SET kind = EXCLUDED.kind`,
        [postId, actorId, kind],
      );
      if (existed.length === 0) {
        await mgr.query(`UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = $1`, [postId]);
      }
      return mgr.query(`SELECT reaction_count FROM posts WHERE id = $1`, [postId]).then((r: any) => r[0]);
    });
  }

  removeReaction(postId: string, actorId: string) {
    return this.ds.transaction(async (mgr) => {
      const removed = await mgr.query(`DELETE FROM post_reactions WHERE post_id=$1 AND actor_id=$2 RETURNING 1`, [postId, actorId]);
      if (removed.length) {
        await mgr.query(`UPDATE posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = $1`, [postId]);
      }
      return mgr.query(`SELECT reaction_count FROM posts WHERE id = $1`, [postId]).then((r: any) => r[0]);
    });
  }

  comment(postId: string, authorId: string, body: string, parentId?: string) {
    return this.ds.transaction(async (mgr) => {
      const row = await mgr.query(
        `INSERT INTO post_comments (post_id, author_id, body, parent_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [postId, authorId, body, parentId ?? null],
      ).then((r: any) => r[0]);
      await mgr.query(`UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`, [postId]);
      return row;
    });
  }

  listComments(postId: string, limit = 50) {
    return this.ds.query(
      `SELECT * FROM post_comments WHERE post_id = $1 AND removed_at IS NULL
        ORDER BY created_at ASC LIMIT $2`,
      [postId, Math.min(limit, 200)],
    );
  }

  toggleSave(actorId: string, postId: string) {
    return this.ds.transaction(async (mgr) => {
      const removed = await mgr.query(`DELETE FROM post_saves WHERE actor_id=$1 AND post_id=$2 RETURNING 1`, [actorId, postId]);
      if (removed.length) return { saved: false };
      await mgr.query(`INSERT INTO post_saves (actor_id, post_id) VALUES ($1, $2)`, [actorId, postId]);
      return { saved: true };
    });
  }

  listSaves(actorId: string) {
    return this.ds.query(
      `SELECT p.* FROM post_saves s JOIN posts p ON p.id = s.post_id
        WHERE s.actor_id = $1 ORDER BY s.saved_at DESC LIMIT 100`,
      [actorId],
    );
  }

  // ---------- follows ----------
  follow(followerId: string, followeeId: string) {
    return this.ds.query(
      `INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1`,
      [followerId, followeeId],
    );
  }
  unfollow(followerId: string, followeeId: string) {
    return this.ds.query(`DELETE FROM follows WHERE follower_id=$1 AND followee_id=$2 RETURNING 1`, [followerId, followeeId]);
  }
  isFollowing(followerId: string, followeeId: string) {
    return this.ds.query(`SELECT 1 FROM follows WHERE follower_id=$1 AND followee_id=$2 LIMIT 1`, [followerId, followeeId]).then(r => r.length > 0);
  }

  // ---------- opportunity cards ----------
  listOpportunityCards(kind?: string, limit = 12) {
    if (kind) {
      return this.ds.query(
        `SELECT * FROM opportunity_cards WHERE kind = $1::opportunity_kind ORDER BY created_at DESC LIMIT $2`,
        [kind, Math.min(limit, 50)],
      );
    }
    return this.ds.query(
      `SELECT * FROM opportunity_cards ORDER BY created_at DESC LIMIT $1`,
      [Math.min(limit, 50)],
    );
  }
}
