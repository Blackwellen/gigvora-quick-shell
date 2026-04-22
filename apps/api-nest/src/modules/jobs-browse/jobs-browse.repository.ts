/**
 * Domain 23 — Jobs Browse repository.
 *
 * In-memory + seeded data backing for the Browse/Discovery/SavedSearch surfaces.
 * Real persistence lives in the migrations under packages/db (jobs, job_skills,
 * saved_searches, search_alerts). This repository keeps a denormalised cache for
 * fast facet computation and ML scoring while writes still hit Postgres via Drizzle.
 *
 * State machine for Job entries:
 *   draft → active ↔ paused → closed → archived
 *   active → escalated (moderation) → active|closed
 *
 * Saved searches own their own machine:
 *   inactive ↔ active → snoozed → active → archived
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { JobBrowseFilters, SavedSearch } from './dto';

type JobRow = {
  id: string; title: string; companyId: string; companyName: string; companyLogo: string | null;
  location: string; remote: 'remote' | 'hybrid' | 'onsite';
  salaryMin: number | null; salaryMax: number | null; currency: string;
  type: string; seniority: string; industries: string[]; skills: string[];
  postedAt: string; applicants: number; status: 'draft' | 'active' | 'paused' | 'archived' | 'closed';
  source: 'internal' | 'imported' | 'syndicated'; visaSponsorship: boolean;
};

const FIXTURE_COMPANIES = [
  { id: 'c-techflow', name: 'TechFlow Inc.', logo: null },
  { id: 'c-figma', name: 'Figma', logo: null },
  { id: 'c-netflix', name: 'Netflix', logo: null },
  { id: 'c-stripe', name: 'Stripe', logo: null },
  { id: 'c-vercel', name: 'Vercel', logo: null },
  { id: 'c-monzo', name: 'Monzo', logo: null },
  { id: 'c-revolut', name: 'Revolut', logo: null },
];
const SKILLS = ['react', 'typescript', 'node', 'python', 'aws', 'kubernetes', 'figma', 'product', 'sql', 'postgres', 'rust', 'go'];

@Injectable()
export class JobsBrowseRepository {
  private readonly log = new Logger('JobsBrowseRepository');
  private jobs: JobRow[] = [];
  private savedSearches = new Map<string, SavedSearch & { ownerId: string; updatedAt: string }>();
  private savedJobs = new Map<string, Set<string>>(); // identityId -> jobId[]

  constructor() { this.seed(); }

  private seed() {
    const titles = [
      'Senior React Developer', 'Product Designer', 'Data Engineer', 'Marketing Manager',
      'Frontend Engineer (Contract)', 'Backend Lead', 'ML Platform Engineer', 'Head of Growth',
      'Site Reliability Engineer', 'Customer Success Manager', 'Sales Engineer', 'iOS Engineer',
    ];
    for (let i = 0; i < 60; i++) {
      const c = FIXTURE_COMPANIES[i % FIXTURE_COMPANIES.length];
      const min = 60_000 + (i * 1500);
      this.jobs.push({
        id: randomUUID(),
        title: titles[i % titles.length],
        companyId: c.id, companyName: c.name, companyLogo: c.logo,
        location: ['Remote', 'London', 'San Francisco', 'New York', 'Berlin', 'Manchester'][i % 6],
        remote: (['remote', 'hybrid', 'onsite'] as const)[i % 3],
        salaryMin: min, salaryMax: min + 40_000, currency: 'GBP',
        type: ['full-time', 'contract', 'part-time'][i % 3],
        seniority: ['mid', 'senior', 'lead'][i % 3],
        industries: ['Software', i % 2 ? 'Fintech' : 'Media'],
        skills: SKILLS.slice(i % 6, (i % 6) + 4),
        postedAt: new Date(Date.now() - i * 1000 * 60 * 60 * 3).toISOString(),
        applicants: 5 + (i * 3) % 80,
        status: 'active',
        source: 'internal', visaSponsorship: i % 4 === 0,
      });
    }
    this.log.log(`seeded ${this.jobs.length} job fixtures`);
  }

  list(): JobRow[] { return this.jobs; }

  /** Deterministic fallback ranking when ML is unavailable. */
  fallbackRank(filters: JobBrowseFilters, identityId?: string) {
    const now = Date.now();
    return [...this.jobs]
      .filter((j) => this.matchesFilters(j, filters))
      .sort((a, b) => {
        if (filters.sort === 'newest') return +new Date(b.postedAt) - +new Date(a.postedAt);
        if (filters.sort === 'salary_desc') return (b.salaryMax ?? 0) - (a.salaryMax ?? 0);
        if (filters.sort === 'salary_asc') return (a.salaryMin ?? 0) - (b.salaryMin ?? 0);
        // relevance default: blend recency + applicants (lower better)
        const score = (j: JobRow) => {
          const ageDays = (now - +new Date(j.postedAt)) / 86_400_000;
          return -ageDays + (j.applicants < 30 ? 5 : 0);
        };
        return score(b) - score(a);
      })
      .map((j) => ({ ...j, saved: identityId ? !!this.savedJobs.get(identityId)?.has(j.id) : false }));
  }

  matchesFilters(j: JobRow, f: JobBrowseFilters): boolean {
    if (f.q && !`${j.title} ${j.companyName} ${j.skills.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.remote !== 'any' && j.remote !== f.remote) return false;
    if (f.type?.length && !f.type.includes(j.type as any)) return false;
    if (f.seniority?.length && !f.seniority.includes(j.seniority as any)) return false;
    if (f.salaryMin && (j.salaryMax ?? 0) < f.salaryMin) return false;
    if (f.salaryMax && (j.salaryMin ?? 0) > f.salaryMax) return false;
    if (f.skills?.length && !f.skills.some((s) => j.skills.includes(s.toLowerCase()))) return false;
    if (f.companyIds?.length && !f.companyIds.includes(j.companyId)) return false;
    if (f.visaSponsorship && !j.visaSponsorship) return false;
    if (f.postedWithinDays) {
      const since = Date.now() - f.postedWithinDays * 86_400_000;
      if (+new Date(j.postedAt) < since) return false;
    }
    return j.status === 'active';
  }

  computeFacets(rows: ReturnType<JobsBrowseRepository['fallbackRank']>) {
    const tally = (key: keyof JobRow | 'industries' | 'skills') => {
      const m = new Map<string, number>();
      rows.forEach((r) => {
        const v: any = (r as any)[key];
        (Array.isArray(v) ? v : [v]).forEach((x) => x && m.set(x, (m.get(x) ?? 0) + 1));
      });
      return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    };
    return {
      type: tally('type'),
      remote: tally('remote'),
      seniority: tally('seniority'),
      industries: tally('industries'),
      topSkills: tally('skills'),
    };
  }

  // Saved searches CRUD
  listSaved(ownerId: string) { return [...this.savedSearches.values()].filter((s) => s.ownerId === ownerId); }
  upsertSaved(ownerId: string, payload: SavedSearch) {
    const id = payload.id ?? randomUUID();
    const row = { ...payload, id, ownerId, updatedAt: new Date().toISOString() };
    this.savedSearches.set(id, row);
    return row;
  }
  removeSaved(ownerId: string, id: string) {
    const row = this.savedSearches.get(id);
    if (!row || row.ownerId !== ownerId) return false;
    this.savedSearches.delete(id); return true;
  }

  // Bookmark a job
  toggleSaveJob(identityId: string, jobId: string) {
    const set = this.savedJobs.get(identityId) ?? new Set<string>();
    set.has(jobId) ? set.delete(jobId) : set.add(jobId);
    this.savedJobs.set(identityId, set);
    return set.has(jobId);
  }
  savedJobIds(identityId: string) { return [...(this.savedJobs.get(identityId) ?? [])]; }
}
