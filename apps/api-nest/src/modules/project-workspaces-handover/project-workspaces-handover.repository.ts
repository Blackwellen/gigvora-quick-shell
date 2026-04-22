/**
 * D37 repository — Workspaces, milestones, deliverables, handover checklist,
 * final report, and event log. In-memory store with seeded fixtures matching
 * the rest of the monorepo.
 *
 * State machine:
 *   kickoff → active → in-review → handover → closed
 *                                  ↘ on-hold | cancelled
 *
 * Optimistic concurrency: every workspace + milestone exposes a `version` that
 * must be supplied on transitions to detect concurrent edits.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  WorkspaceStatus, MilestoneStatus, DeliverableStatus, HandoverChecklistKind,
} from './dto';

export type WorkspaceRow = {
  id: string;
  tenantId: string;
  projectId: string;
  contractId: string;
  title: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  version: number;
};

export type PartyRow = {
  id: string;
  workspaceId: string;
  partyId: string;
  role: 'client' | 'provider' | 'observer';
  displayName: string;
};

export type MilestoneRow = {
  id: string;
  workspaceId: string;
  title: string;
  amountCents: number;
  dueAt: string | null;
  status: MilestoneStatus;
  startedAt: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  version: number;
};

export type DeliverableRow = {
  id: string;
  workspaceId: string;
  milestoneId: string;
  title: string;
  url: string;
  notes: string | null;
  status: DeliverableStatus;
  submittedAt: string;
  reviewedAt: string | null;
  feedback: string | null;
};

export type ChecklistItemRow = {
  id: string;
  workspaceId: string;
  kind: HandoverChecklistKind;
  label: string;
  done: boolean;
  doneAt: string | null;
  note: string | null;
};

export type FinalReportRow = {
  id: string;
  workspaceId: string;
  bodyMd: string;
  publishedAt: string;
};

export type WorkspaceEventRow = {
  id: string;
  workspaceId: string;
  kind: string;
  actor: string;
  detail: any;
  at: string;
};

const DEFAULT_CHECKLIST: { kind: HandoverChecklistKind; label: string }[] = [
  { kind: 'credentials-rotated',    label: 'Rotate shared credentials and remove old keys' },
  { kind: 'access-revoked',         label: 'Revoke provider access to client systems' },
  { kind: 'assets-transferred',     label: 'Transfer source files, design assets, and exports' },
  { kind: 'docs-handed-over',       label: 'Hand over documentation, runbooks, and READMEs' },
  { kind: 'final-report-signed-off',label: 'Final report acknowledged by client' },
  { kind: 'retainer-confirmed',     label: 'Confirm post-launch retainer arrangement (if any)' },
];

@Injectable()
export class ProjectWorkspacesHandoverRepository {
  private readonly log = new Logger('pwh.repo');
  private workspaces = new Map<string, WorkspaceRow>();
  private parties = new Map<string, PartyRow[]>();
  private milestones = new Map<string, MilestoneRow[]>();
  private deliverables = new Map<string, DeliverableRow[]>();
  private checklist = new Map<string, ChecklistItemRow[]>();
  private reports = new Map<string, FinalReportRow>();
  private events = new Map<string, WorkspaceEventRow[]>();
  private idemMint = new Map<string, string>();         // idem → workspaceId
  private idemDeliverable = new Map<string, string>();  // idem → deliverableId
  private idemClose = new Map<string, string>();        // idem → reportId
  private byContract = new Map<string, string>();       // contractId → workspaceId

  constructor() { this.seed(); }

  private seed() {
    const id = 'pwh-seed-1';
    const now = new Date().toISOString();
    const ws: WorkspaceRow = {
      id, tenantId: 'tenant-demo',
      projectId: '11111111-1111-1111-1111-111111111111',
      contractId: 'csa-seed-contract-1',
      title: 'Ops Dashboard MVP — Workspace',
      status: 'active',
      createdAt: now, updatedAt: now, closedAt: null, version: 1,
    };
    this.workspaces.set(id, ws);
    this.byContract.set(ws.contractId, id);
    this.parties.set(id, [
      { id: randomUUID(), workspaceId: id, partyId: 'client-acme',  role: 'client',   displayName: 'Acme Buyer' },
      { id: randomUUID(), workspaceId: id, partyId: 'provider-sc', role: 'provider', displayName: 'Sarah Chen Studio' },
    ]);
    this.milestones.set(id, [
      { id: randomUUID(), workspaceId: id, title: 'Discovery + wireframes', amountCents: 6_000_00, dueAt: null, status: 'accepted',    startedAt: now, submittedAt: now, acceptedAt: now, version: 3 },
      { id: randomUUID(), workspaceId: id, title: 'Build sprint 1',         amountCents: 8_000_00, dueAt: null, status: 'in-progress', startedAt: now, submittedAt: null, acceptedAt: null, version: 1 },
      { id: randomUUID(), workspaceId: id, title: 'Build sprint 2',         amountCents: 8_000_00, dueAt: null, status: 'pending',     startedAt: null, submittedAt: null, acceptedAt: null, version: 1 },
      { id: randomUUID(), workspaceId: id, title: 'Launch + handover',      amountCents: 6_000_00, dueAt: null, status: 'pending',     startedAt: null, submittedAt: null, acceptedAt: null, version: 1 },
    ]);
    this.deliverables.set(id, []);
    this.checklist.set(id, DEFAULT_CHECKLIST.map((c) => ({
      id: randomUUID(), workspaceId: id, kind: c.kind, label: c.label, done: false, doneAt: null, note: null,
    })));
    this.events.set(id, [
      { id: randomUUID(), workspaceId: id, kind: 'workspace.minted', actor: 'system', detail: { fromContract: ws.contractId }, at: now },
    ]);
    this.log.log(`seeded workspace ${id}`);
  }

  // ---- read ----
  byId(id: string) { return this.workspaces.get(id); }
  byContractId(contractId: string) { const id = this.byContract.get(contractId); return id ? this.workspaces.get(id) : undefined; }
  list(tenantId: string, f: { projectId?: string; contractId?: string; status?: WorkspaceStatus[] }) {
    let rows = Array.from(this.workspaces.values()).filter((r) => r.tenantId === tenantId);
    if (f.projectId) rows = rows.filter((r) => r.projectId === f.projectId);
    if (f.contractId) rows = rows.filter((r) => r.contractId === f.contractId);
    if (f.status?.length) rows = rows.filter((r) => f.status!.includes(r.status));
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  partiesFor(id: string) { return this.parties.get(id) ?? []; }
  milestonesFor(id: string) { return this.milestones.get(id) ?? []; }
  deliverablesFor(id: string) { return this.deliverables.get(id) ?? []; }
  checklistFor(id: string) { return this.checklist.get(id) ?? []; }
  reportFor(id: string) { return this.reports.get(id); }
  eventsFor(id: string) { return this.events.get(id) ?? []; }
  idemMintHit(idem: string) { const id = this.idemMint.get(idem); return id ? this.workspaces.get(id) : undefined; }
  idemDeliverableHit(idem: string) {
    const did = this.idemDeliverable.get(idem); if (!did) return undefined;
    for (const arr of this.deliverables.values()) { const hit = arr.find((d) => d.id === did); if (hit) return hit; }
    return undefined;
  }
  idemCloseHit(idem: string) {
    const rid = this.idemClose.get(idem); if (!rid) return undefined;
    for (const r of this.reports.values()) if (r.id === rid) return r;
    return undefined;
  }

  // ---- write ----
  mint(args: {
    tenantId: string; projectId: string; contractId: string; title: string;
    milestones: { title: string; amountCents: number; dueAt: string | null }[];
    parties: { partyId: string; role: 'client' | 'provider' | 'observer'; displayName: string }[];
    idempotencyKey: string; actor: string;
  }): WorkspaceRow {
    const hit = this.idemMintHit(args.idempotencyKey);
    if (hit) return hit;
    const existing = this.byContractId(args.contractId);
    if (existing) return existing;
    const id = randomUUID();
    const now = new Date().toISOString();
    const ws: WorkspaceRow = {
      id, tenantId: args.tenantId, projectId: args.projectId, contractId: args.contractId,
      title: args.title, status: 'kickoff', createdAt: now, updatedAt: now, closedAt: null, version: 1,
    };
    this.workspaces.set(id, ws);
    this.byContract.set(args.contractId, id);
    this.parties.set(id, args.parties.map((p) => ({ id: randomUUID(), workspaceId: id, ...p })));
    this.milestones.set(id, args.milestones.map((m) => ({
      id: randomUUID(), workspaceId: id, title: m.title, amountCents: m.amountCents, dueAt: m.dueAt,
      status: 'pending', startedAt: null, submittedAt: null, acceptedAt: null, version: 1,
    })));
    this.deliverables.set(id, []);
    this.checklist.set(id, DEFAULT_CHECKLIST.map((c) => ({
      id: randomUUID(), workspaceId: id, kind: c.kind, label: c.label, done: false, doneAt: null, note: null,
    })));
    this.events.set(id, [{ id: randomUUID(), workspaceId: id, kind: 'workspace.minted', actor: args.actor, detail: { fromContract: args.contractId }, at: now }]);
    this.idemMint.set(args.idempotencyKey, id);
    return ws;
  }

  setStatus(workspaceId: string, status: WorkspaceStatus, actor: string, detail: any = {}): WorkspaceRow {
    const ws = this.workspaces.get(workspaceId); if (!ws) throw new Error('not_found');
    ws.status = status;
    ws.updatedAt = new Date().toISOString();
    ws.version += 1;
    if (status === 'closed' || status === 'cancelled') ws.closedAt = ws.updatedAt;
    this.appendEvent(workspaceId, `workspace.${status}`, actor, detail);
    return ws;
  }

  transitionMilestone(workspaceId: string, milestoneId: string, to: MilestoneStatus, expectedVersion: number, actor: string, note?: string) {
    const arr = this.milestones.get(workspaceId); if (!arr) throw new Error('not_found');
    const m = arr.find((x) => x.id === milestoneId); if (!m) throw new Error('milestone_not_found');
    if (m.version !== expectedVersion) throw new Error('version_conflict');
    const VALID: Record<MilestoneStatus, MilestoneStatus[]> = {
      pending:     ['in-progress'],
      'in-progress': ['submitted', 'pending'],
      submitted:   ['accepted', 'rejected'],
      accepted:    [],
      rejected:    ['in-progress'],
    };
    if (!VALID[m.status].includes(to)) throw new Error(`illegal_milestone_transition_${m.status}_to_${to}`);
    const now = new Date().toISOString();
    m.status = to;
    m.version += 1;
    if (to === 'in-progress' && !m.startedAt) m.startedAt = now;
    if (to === 'submitted') m.submittedAt = now;
    if (to === 'accepted') m.acceptedAt = now;
    this.appendEvent(workspaceId, `milestone.${to}`, actor, { milestoneId, note: note ?? null });
    return m;
  }

  submitDeliverable(args: {
    workspaceId: string; milestoneId: string; title: string; url: string; notes?: string;
    idempotencyKey: string; actor: string;
  }): DeliverableRow {
    const hit = this.idemDeliverableHit(args.idempotencyKey);
    if (hit) return hit;
    const ws = this.workspaces.get(args.workspaceId); if (!ws) throw new Error('not_found');
    const milestones = this.milestones.get(args.workspaceId) ?? [];
    const m = milestones.find((x) => x.id === args.milestoneId);
    if (!m) throw new Error('milestone_not_found');
    if (m.status === 'accepted') throw new Error('milestone_already_accepted');
    const arr = this.deliverables.get(args.workspaceId) ?? [];
    const row: DeliverableRow = {
      id: randomUUID(), workspaceId: args.workspaceId, milestoneId: args.milestoneId,
      title: args.title, url: args.url, notes: args.notes ?? null,
      status: 'submitted', submittedAt: new Date().toISOString(),
      reviewedAt: null, feedback: null,
    };
    arr.push(row);
    this.deliverables.set(args.workspaceId, arr);
    this.idemDeliverable.set(args.idempotencyKey, row.id);
    this.appendEvent(args.workspaceId, 'deliverable.submitted', args.actor, { deliverableId: row.id, milestoneId: args.milestoneId });
    return row;
  }

  reviewDeliverable(workspaceId: string, deliverableId: string, decision: 'accepted' | 'changes-requested', feedback: string | undefined, actor: string) {
    const arr = this.deliverables.get(workspaceId) ?? [];
    const d = arr.find((x) => x.id === deliverableId);
    if (!d) throw new Error('deliverable_not_found');
    if (d.status !== 'submitted') throw new Error(`deliverable_not_in_submitted_state`);
    d.status = decision;
    d.reviewedAt = new Date().toISOString();
    d.feedback = feedback ?? null;
    this.appendEvent(workspaceId, `deliverable.${decision}`, actor, { deliverableId });
    return d;
  }

  completeChecklistItem(workspaceId: string, itemId: string, actor: string, note?: string) {
    const arr = this.checklist.get(workspaceId) ?? [];
    const item = arr.find((x) => x.id === itemId); if (!item) throw new Error('item_not_found');
    if (item.done) return item;
    item.done = true;
    item.doneAt = new Date().toISOString();
    item.note = note ?? null;
    this.appendEvent(workspaceId, 'handover.item-completed', actor, { itemId, kind: item.kind });
    return item;
  }

  publishFinalReport(workspaceId: string, bodyMd: string, idempotencyKey: string, actor: string) {
    const hit = this.idemCloseHit(idempotencyKey);
    if (hit) return hit;
    const report: FinalReportRow = {
      id: randomUUID(), workspaceId, bodyMd, publishedAt: new Date().toISOString(),
    };
    this.reports.set(workspaceId, report);
    this.idemClose.set(idempotencyKey, report.id);
    this.appendEvent(workspaceId, 'final-report.published', actor, { reportId: report.id });
    return report;
  }

  appendEvent(workspaceId: string, kind: string, actor: string, detail: any) {
    const arr = this.events.get(workspaceId) ?? [];
    arr.push({ id: randomUUID(), workspaceId, kind, actor, detail, at: new Date().toISOString() });
    this.events.set(workspaceId, arr);
  }
}
