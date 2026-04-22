/**
 * Domain 32 repository.
 *
 * In-memory backing store with realistic seeded fixtures so the workbench
 * renders believable rows while the Drizzle persistence layer is wired in.
 * Mirrors the pattern used by D24 (jobs-browse) — every state mutation goes
 * through here so the service stays purely orchestrational.
 *
 * State machines:
 *   project:  draft → open ↔ paused → in_review → awarded → completed
 *                                        ↘ cancelled
 *   proposal: draft → submitted → shortlisted ↔ changes_requested
 *                                ↘ rejected
 *                                ↘ accepted
 *                                ↘ withdrawn
 *   saved-search: inactive ↔ active → snoozed → active → archived
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ProjectBrowseFilters,
  SavedProjectSearch,
  ProposalDraft,
  ProjectStatus,
  ProposalStatus,
  AttachmentUploadComplete,
} from './dto';

export type ProjectRow = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientVerified: boolean;
  budgetMin: number; budgetMax: number; currency: string;
  engagement: 'fixed' | 'hourly' | 'milestone' | 'retainer';
  durationBucket: 'lt_1w' | '1_4w' | '1_3m' | '3_6m' | '6m_plus';
  remote: 'remote' | 'hybrid' | 'onsite';
  location: string;
  skills: string[];
  categories: string[];
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  postedAt: string;
  proposals: number;
  status: ProjectStatus;
  hasNda: boolean;
  views: number;
  attachments: { id: string; name: string; size: number; mime: string }[];
};

export type ProposalRow = {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  coverLetter: string;
  proposedAmount: number;
  currency: string;
  engagement: 'fixed' | 'hourly' | 'milestone' | 'retainer';
  durationDays: number | null;
  status: ProposalStatus;
  submittedAt: string | null;
  decisionNote?: string | null;
};

const FIXTURE_CLIENTS = [
  { id: 'cl-greenleaf', name: 'GreenLeaf Co.', verified: true },
  { id: 'cl-fitpro', name: 'FitPro Inc.', verified: true },
  { id: 'cl-startupxyz', name: 'StartupXYZ', verified: false },
  { id: 'cl-datavault', name: 'DataVault Ltd.', verified: true },
  { id: 'cl-acme', name: 'Acme Solutions', verified: true },
  { id: 'cl-northwind', name: 'Northwind Trading', verified: false },
];
const SKILLS = ['React', 'React Native', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Spark', 'Shopify', 'UX Design', 'UI/UX', 'Branding', 'Strategy', 'Illustrator'];
const CATEGORIES = ['Web Development', 'Mobile Apps', 'Design', 'Data Engineering', 'Marketing', 'Branding'];

@Injectable()
export class ProjectsBrowseDiscoveryRepository {
  private readonly log = new Logger('ProjectsBrowseDiscoveryRepository');
  private projects: ProjectRow[] = [];
  private proposals: ProposalRow[] = [];
  private savedSearches = new Map<string, SavedProjectSearch & { ownerId: string; updatedAt: string }>();
  private bookmarks = new Map<string, Set<string>>();
  private flags: { id: string; projectId: string; reporterId: string; reason: string; detail?: string; at: string }[] = [];
  private invites: { id: string; projectId: string; toIdentityId: string; fromIdentityId: string; message?: string; at: string; status: 'pending'|'accepted'|'declined' }[] = [];

  constructor() { this.seed(); }

  private seed() {
    const titles = [
      'E-commerce Platform Redesign', 'Mobile App for Fitness Tracking', 'Brand Identity & Guidelines',
      'Data Pipeline Architecture', 'Marketing Site Migration', 'iOS Loyalty App', 'B2B Dashboard Build',
      'Headless CMS Implementation', 'Lead Capture Funnel', 'Logistics Tracking Module',
    ];
    for (let i = 0; i < 48; i++) {
      const c = FIXTURE_CLIENTS[i % FIXTURE_CLIENTS.length];
      const min = 5_000 + (i * 1200);
      this.projects.push({
        id: randomUUID(),
        title: titles[i % titles.length],
        description: `Detailed scope for ${titles[i % titles.length]}. Includes discovery, design, build, and handover phases with clear acceptance criteria.`,
        clientId: c.id, clientName: c.name, clientVerified: c.verified,
        budgetMin: min, budgetMax: min + 12_000, currency: 'GBP',
        engagement: (['fixed','hourly','milestone','retainer'] as const)[i % 4],
        durationBucket: (['lt_1w','1_4w','1_3m','3_6m','6m_plus'] as const)[i % 5],
        remote: (['remote', 'hybrid', 'onsite'] as const)[i % 3],
        location: ['Remote', 'London', 'Manchester', 'New York', 'Berlin'][i % 5],
        skills: SKILLS.slice(i % 7, (i % 7) + 4),
        categories: [CATEGORIES[i % CATEGORIES.length]],
        experienceLevel: (['entry','intermediate','expert'] as const)[i % 3],
        postedAt: new Date(Date.now() - i * 1000 * 60 * 60 * 4).toISOString(),
        proposals: 2 + (i * 3) % 32,
        status: i % 11 === 0 ? 'awarded' : (i % 13 === 0 ? 'paused' : 'open'),
        hasNda: i % 6 === 0,
        views: 30 + (i * 11) % 800,
        attachments: i % 5 === 0 ? [{ id: randomUUID(), name: 'brief.pdf', size: 184_320, mime: 'application/pdf' }] : [],
      });
    }
    this.log.log(`seeded ${this.projects.length} project fixtures`);
  }

  list(): ProjectRow[] { return this.projects; }
  byId(id: string) { return this.projects.find((p) => p.id === id) ?? null; }

  applyFilters(rows: ProjectRow[], f: ProjectBrowseFilters): ProjectRow[] {
    let out = rows.filter((r) => f.status ? f.status.includes(r.status) : r.status !== 'cancelled' && r.status !== 'draft');
    if (f.q) {
      const needle = f.q.toLowerCase();
      out = out.filter((r) => r.title.toLowerCase().includes(needle) || r.description.toLowerCase().includes(needle) || r.skills.some((s) => s.toLowerCase().includes(needle)));
    }
    if (f.budgetMin != null) out = out.filter((r) => r.budgetMax >= f.budgetMin!);
    if (f.budgetMax != null) out = out.filter((r) => r.budgetMin <= f.budgetMax!);
    if (f.engagement?.length) out = out.filter((r) => f.engagement!.includes(r.engagement));
    if (f.durationBuckets?.length) out = out.filter((r) => f.durationBuckets!.includes(r.durationBucket));
    if (f.remote && f.remote !== 'any') out = out.filter((r) => r.remote === f.remote);
    if (f.location) out = out.filter((r) => r.location.toLowerCase().includes(f.location!.toLowerCase()));
    if (f.skills?.length) out = out.filter((r) => f.skills!.some((s) => r.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase())));
    if (f.categories?.length) out = out.filter((r) => f.categories!.some((c) => r.categories.includes(c)));
    if (f.experienceLevel?.length) out = out.filter((r) => f.experienceLevel!.includes(r.experienceLevel));
    if (f.postedWithinDays != null) {
      const cutoff = Date.now() - f.postedWithinDays * 86_400_000;
      out = out.filter((r) => Date.parse(r.postedAt) >= cutoff);
    }
    if (f.proposalsBelow != null) out = out.filter((r) => r.proposals < f.proposalsBelow!);
    if (f.clientVerified != null) out = out.filter((r) => r.clientVerified === f.clientVerified);
    if (f.hasNda != null) out = out.filter((r) => r.hasNda === f.hasNda);
    return out;
  }

  computeFacets(rows: ProjectRow[]) {
    const tally = (key: keyof ProjectRow): { value: string; count: number }[] => {
      const m = new Map<string, number>();
      rows.forEach((r) => {
        const v = r[key];
        if (Array.isArray(v)) v.forEach((x) => m.set(String(x), (m.get(String(x)) ?? 0) + 1));
        else if (v != null) m.set(String(v), (m.get(String(v)) ?? 0) + 1);
      });
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([value, count]) => ({ value, count }));
    };
    return {
      engagement: tally('engagement'),
      durationBucket: tally('durationBucket'),
      remote: tally('remote'),
      experienceLevel: tally('experienceLevel'),
      categories: tally('categories'),
      topSkills: tally('skills'),
    };
  }

  // ─── Saved searches ────────────────────────────────────────────────────
  listSaved(ownerId: string): SavedProjectSearch[] {
    return [...this.savedSearches.values()].filter((s) => s.ownerId === ownerId);
  }
  upsertSaved(ownerId: string, payload: SavedProjectSearch): SavedProjectSearch {
    const id = payload.id ?? randomUUID();
    const row = { ...payload, id, ownerId, updatedAt: new Date().toISOString() };
    this.savedSearches.set(id, row);
    return row;
  }
  removeSaved(ownerId: string, id: string): boolean {
    const existing = this.savedSearches.get(id);
    if (!existing || existing.ownerId !== ownerId) return false;
    this.savedSearches.delete(id);
    return true;
  }

  // ─── Bookmarks ─────────────────────────────────────────────────────────
  toggleBookmark(identityId: string, projectId: string): boolean {
    if (!this.bookmarks.has(identityId)) this.bookmarks.set(identityId, new Set());
    const set = this.bookmarks.get(identityId)!;
    if (set.has(projectId)) { set.delete(projectId); return false; }
    set.add(projectId); return true;
  }
  bookmarkIds(identityId: string): string[] { return [...(this.bookmarks.get(identityId) ?? [])]; }

  // ─── Proposals ─────────────────────────────────────────────────────────
  listProposalsForProject(projectId: string): ProposalRow[] { return this.proposals.filter((p) => p.projectId === projectId); }
  listProposalsForAuthor(authorId: string): ProposalRow[] { return this.proposals.filter((p) => p.authorId === authorId); }
  getProposal(id: string) { return this.proposals.find((p) => p.id === id) ?? null; }

  draftProposal(authorId: string, authorName: string, dto: ProposalDraft): ProposalRow {
    const row: ProposalRow = {
      id: randomUUID(), projectId: dto.projectId, authorId, authorName,
      coverLetter: dto.coverLetter, proposedAmount: dto.proposedAmount, currency: dto.currency,
      engagement: dto.engagement, durationDays: dto.durationDays ?? null,
      status: 'draft', submittedAt: null,
    };
    this.proposals.push(row);
    return row;
  }
  submitProposal(id: string): ProposalRow | null {
    const p = this.getProposal(id); if (!p || p.status !== 'draft') return null;
    p.status = 'submitted'; p.submittedAt = new Date().toISOString();
    const proj = this.byId(p.projectId); if (proj) proj.proposals += 1;
    return p;
  }
  decideProposal(id: string, decision: 'shortlist'|'reject'|'accept'|'request_changes', note?: string): ProposalRow | null {
    const p = this.getProposal(id); if (!p) return null;
    const map: Record<typeof decision, ProposalStatus> = { shortlist: 'shortlisted', reject: 'rejected', accept: 'accepted', request_changes: 'changes_requested' };
    p.status = map[decision]; p.decisionNote = note ?? null;
    return p;
  }
  withdrawProposal(id: string, authorId: string): ProposalRow | null {
    const p = this.getProposal(id); if (!p || p.authorId !== authorId) return null;
    if (p.status === 'accepted' || p.status === 'rejected') return null;
    p.status = 'withdrawn'; return p;
  }

  // ─── Project transitions, flags, invites, attachments ─────────────────
  transitionProject(id: string, next: ProjectStatus): ProjectRow | null {
    const p = this.byId(id); if (!p) return null;
    p.status = next; return p;
  }
  trackView(id: string) { const p = this.byId(id); if (p) p.views += 1; return p; }

  flagProject(reporterId: string, projectId: string, reason: string, detail?: string) {
    const f = { id: randomUUID(), projectId, reporterId, reason, detail, at: new Date().toISOString() };
    this.flags.push(f); return f;
  }

  inviteToProject(fromIdentityId: string, projectId: string, toIdentityId: string, message?: string) {
    const inv = { id: randomUUID(), projectId, toIdentityId, fromIdentityId, message, at: new Date().toISOString(), status: 'pending' as const };
    this.invites.push(inv); return inv;
  }

  attachUpload(dto: AttachmentUploadComplete) {
    const p = this.byId(dto.projectId); if (!p) return null;
    const att = { id: randomUUID(), name: dto.fileName, size: dto.sizeBytes, mime: dto.mimeType };
    p.attachments.push(att);
    return att;
  }
  removeAttachment(projectId: string, attachmentId: string) {
    const p = this.byId(projectId); if (!p) return false;
    const before = p.attachments.length;
    p.attachments = p.attachments.filter((a) => a.id !== attachmentId);
    return p.attachments.length < before;
  }
}
