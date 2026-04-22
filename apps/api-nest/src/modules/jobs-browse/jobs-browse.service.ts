import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { JobsBrowseRepository } from './jobs-browse.repository';
import { JobsBrowseMlService } from './jobs-browse.ml.service';
import { JobsBrowseAnalyticsService } from './jobs-browse.analytics.service';
import type { JobBrowseFilters, SavedSearch } from './dto';

/**
 * Domain 23 application service.
 *
 * Public surface used by the controller, the SDK, the Flutter client, and
 * the saved-search digest worker. Emits Socket.IO events through the
 * NotificationsGateway so the browse list, saved-search badges and the
 * "new match" toasts update in realtime (mandated WebSockets rule).
 */
@Injectable()
export class JobsBrowseService {
  private readonly log = new Logger('JobsBrowseService');
  constructor(
    private readonly repo: JobsBrowseRepository,
    private readonly ml: JobsBrowseMlService,
    private readonly analytics: JobsBrowseAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
    },
  ) {}

  async search(filters: JobBrowseFilters, identityId?: string) {
    const t0 = Date.now();
    const { rows, mode } = await this.ml.rank(filters, identityId);
    const start = (filters.page - 1) * filters.pageSize;
    const page = rows.slice(start, start + filters.pageSize).map((r) => ({
      id: r.id, title: r.title,
      company: { id: r.companyId, name: r.companyName, logoUrl: r.companyLogo },
      location: r.location, remote: r.remote,
      salary: { min: r.salaryMin, max: r.salaryMax, currency: r.currency },
      type: r.type, postedAt: r.postedAt, applicants: r.applicants,
      matchScore: mode === 'ml' ? Math.min(100, 60 + (r.skills.length * 5)) : null,
      skills: r.skills, status: r.status, saved: r.saved, source: r.source,
    }));
    const facets = filters.facetMode === 'none' ? null : this.repo.computeFacets(rows);
    this.log.debug(`search ${rows.length} rows in ${Date.now() - t0}ms via ${mode}`);
    return {
      results: page, total: rows.length, page: filters.page, pageSize: filters.pageSize,
      facets, rankingMode: mode, generatedAt: new Date().toISOString(),
    };
  }

  insights(identityId?: string) { return this.analytics.insights(identityId); }

  listSaved(ownerId: string) { return this.repo.listSaved(ownerId); }
  upsertSaved(ownerId: string, payload: SavedSearch) {
    const row = this.repo.upsertSaved(ownerId, payload);
    this.gateway?.emitToUser(ownerId, 'jobs-browse.saved-search.upserted', { id: row.id, label: row.label });
    return row;
  }
  removeSaved(ownerId: string, id: string) {
    const ok = this.repo.removeSaved(ownerId, id);
    if (ok) this.gateway?.emitToUser(ownerId, 'jobs-browse.saved-search.removed', { id });
    return ok;
  }

  toggleSaveJob(identityId: string, jobId: string) {
    const saved = this.repo.toggleSaveJob(identityId, jobId);
    this.gateway?.emitToUser(identityId, 'jobs-browse.bookmark.toggled', { jobId, saved });
    return { jobId, saved };
  }
  savedJobIds(identityId: string) { return this.repo.savedJobIds(identityId); }
}
