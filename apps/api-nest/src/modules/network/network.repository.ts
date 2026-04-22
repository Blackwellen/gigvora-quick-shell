import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Hot-path queries for the network graph. Canonical ordering is enforced
 *  via LEAST/GREATEST so symmetric look-ups always hit the unique index. */
@Injectable()
export class NetworkRepository {
  constructor(private readonly ds: DataSource) {}

  // ---------- requests ----------
  createRequest(requesterId: string, recipientId: string, message?: string) {
    return this.ds.query(
      `INSERT INTO connection_requests (requester_id, recipient_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [requesterId, recipientId, message ?? null],
    ).then(r => r[0]);
  }

  getRequest(id: string) {
    return this.ds.query(`SELECT * FROM connection_requests WHERE id = $1`, [id]).then(r => r[0]);
  }

  listIncoming(userId: string, status: string = 'pending', limit = 20) {
    return this.ds.query(
      `SELECT * FROM connection_requests
        WHERE recipient_id = $1 AND status = $2::connection_status
        ORDER BY created_at DESC LIMIT $3`,
      [userId, status, Math.min(limit, 100)],
    );
  }

  listOutgoing(userId: string, status: string = 'pending', limit = 20) {
    return this.ds.query(
      `SELECT * FROM connection_requests
        WHERE requester_id = $1 AND status = $2::connection_status
        ORDER BY created_at DESC LIMIT $3`,
      [userId, status, Math.min(limit, 100)],
    );
  }

  withdraw(requesterId: string, id: string) {
    return this.ds.query(
      `UPDATE connection_requests SET status='withdrawn', responded_at = now()
        WHERE id = $1 AND requester_id = $2 AND status = 'pending' RETURNING *`,
      [id, requesterId],
    ).then(r => r[0]);
  }

  respond(recipientId: string, id: string, decision: 'accept' | 'decline') {
    return this.ds.transaction(async (mgr) => {
      const row = await mgr.query(
        `UPDATE connection_requests
            SET status = $3::connection_status, responded_at = now()
          WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
          RETURNING *`,
        [id, recipientId, decision === 'accept' ? 'accepted' : 'declined'],
      ).then((r: any) => r[0]);

      if (row && decision === 'accept') {
        // Insert canonical (lo, hi) connection
        await mgr.query(
          `INSERT INTO connections (user_a_id, user_b_id)
           VALUES (LEAST($1::uuid, $2::uuid), GREATEST($1::uuid, $2::uuid))
           ON CONFLICT DO NOTHING`,
          [row.requester_id, row.recipient_id],
        );
      }
      return row;
    });
  }

  // ---------- connections ----------
  isConnected(a: string, b: string) {
    return this.ds.query(
      `SELECT 1 FROM connections
        WHERE user_a_id = LEAST($1::uuid, $2::uuid) AND user_b_id = GREATEST($1::uuid, $2::uuid)
        LIMIT 1`,
      [a, b],
    ).then(r => r.length > 0);
  }

  removeConnection(a: string, b: string) {
    return this.ds.query(
      `DELETE FROM connections
        WHERE user_a_id = LEAST($1::uuid, $2::uuid) AND user_b_id = GREATEST($1::uuid, $2::uuid)
        RETURNING 1`,
      [a, b],
    );
  }

  /** Returns all direct connections (1°) of the given user. */
  connectionsOf(userId: string, limit = 100) {
    return this.ds.query(
      `SELECT CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END AS user_id, created_at
         FROM connections
        WHERE user_a_id = $1 OR user_b_id = $1
        ORDER BY created_at DESC LIMIT $2`,
      [userId, Math.min(limit, 500)],
    );
  }

  countConnections(userId: string) {
    return this.ds.query(
      `SELECT COUNT(*)::int AS n FROM connections WHERE user_a_id = $1 OR user_b_id = $1`,
      [userId],
    ).then(r => r[0]?.n ?? 0);
  }

  // ---------- blocks ----------
  block(blockerId: string, blockedId: string, reason?: string) {
    return this.ds.query(
      `INSERT INTO user_blocks (blocker_id, blocked_id, reason)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *`,
      [blockerId, blockedId, reason ?? null],
    );
  }
  unblock(blockerId: string, blockedId: string) {
    return this.ds.query(
      `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING 1`,
      [blockerId, blockedId],
    );
  }
  listBlocks(blockerId: string) {
    return this.ds.query(
      `SELECT * FROM user_blocks WHERE blocker_id = $1 ORDER BY created_at DESC`,
      [blockerId],
    );
  }

  // ---------- degree / mutual / suggestions ----------
  degree(viewerId: string, targetId: string) {
    return this.ds.query(
      `SELECT degree, mutual_count FROM network_edges
        WHERE viewer_id = $1 AND target_id = $2 LIMIT 1`,
      [viewerId, targetId],
    ).then(r => r[0] ?? null);
  }

  mutuals(viewerId: string, targetId: string, limit = 20) {
    return this.ds.query(
      `WITH a AS (
         SELECT CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END AS u
           FROM connections WHERE user_a_id = $1 OR user_b_id = $1
       ), b AS (
         SELECT CASE WHEN user_a_id = $2 THEN user_b_id ELSE user_a_id END AS u
           FROM connections WHERE user_a_id = $2 OR user_b_id = $2
       )
       SELECT a.u AS user_id FROM a JOIN b USING (u) LIMIT $3`,
      [viewerId, targetId, Math.min(limit, 100)],
    );
  }

  suggestions(viewerId: string, maxDegree = 2, limit = 12) {
    return this.ds.query(
      `SELECT target_id AS user_id, degree, mutual_count
         FROM network_edges
        WHERE viewer_id = $1 AND degree BETWEEN 2 AND $2
          AND target_id NOT IN (
            SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          )
        ORDER BY mutual_count DESC, degree ASC
        LIMIT $3`,
      [viewerId, maxDegree, Math.min(limit, 50)],
    );
  }

  /** Recompute a viewer's network_edges from current connections.
   *  Bounded to 2nd degree by default. Run after accept / remove / block. */
  recomputeEdges(viewerId: string) {
    return this.ds.transaction(async (mgr) => {
      await mgr.query(`DELETE FROM network_edges WHERE viewer_id = $1`, [viewerId]);
      // 1°
      await mgr.query(
        `INSERT INTO network_edges (viewer_id, target_id, degree, mutual_count)
         SELECT $1, CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END, 1, 0
           FROM connections WHERE user_a_id = $1 OR user_b_id = $1
         ON CONFLICT DO NOTHING`,
        [viewerId],
      );
      // 2° with mutual_count
      await mgr.query(
        `INSERT INTO network_edges (viewer_id, target_id, degree, mutual_count)
         SELECT $1, c2.target_id, 2, COUNT(*)::int
           FROM (
             SELECT CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END AS friend
               FROM connections WHERE user_a_id = $1 OR user_b_id = $1
           ) f
           JOIN LATERAL (
             SELECT CASE WHEN user_a_id = f.friend THEN user_b_id ELSE user_a_id END AS target_id
               FROM connections WHERE (user_a_id = f.friend OR user_b_id = f.friend)
           ) c2 ON c2.target_id <> $1
          WHERE NOT EXISTS (
            SELECT 1 FROM network_edges
             WHERE viewer_id = $1 AND target_id = c2.target_id AND degree = 1
          )
          GROUP BY c2.target_id
          ON CONFLICT (viewer_id, target_id) DO UPDATE
            SET mutual_count = EXCLUDED.mutual_count, refreshed_at = now()`,
        [viewerId],
      );
    });
  }
}
