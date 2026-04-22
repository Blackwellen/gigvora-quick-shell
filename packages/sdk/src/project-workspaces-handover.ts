/**
 * Typed SDK for Domain 37 — Project Workspaces & Handover.
 */
export type WorkspaceStatus = 'kickoff' | 'active' | 'in-review' | 'handover' | 'closed' | 'on-hold' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in-progress' | 'submitted' | 'accepted' | 'rejected';
export type DeliverableStatus = 'pending' | 'submitted' | 'accepted' | 'changes-requested';
export type HandoverChecklistKind =
  | 'credentials-rotated' | 'access-revoked' | 'assets-transferred'
  | 'docs-handed-over' | 'final-report-signed-off' | 'retainer-confirmed';

export interface WorkspaceRow {
  id: string; tenantId: string; projectId: string; contractId: string;
  title: string; status: WorkspaceStatus;
  createdAt: string; updatedAt: string; closedAt: string | null; version: number;
}

export interface PartyRow { id: string; workspaceId: string; partyId: string; role: 'client' | 'provider' | 'observer'; displayName: string }

export interface MilestoneRow {
  id: string; workspaceId: string; title: string; amountCents: number; dueAt: string | null;
  status: MilestoneStatus; startedAt: string | null; submittedAt: string | null; acceptedAt: string | null; version: number;
}

export interface DeliverableRow {
  id: string; workspaceId: string; milestoneId: string; title: string; url: string;
  notes: string | null; status: DeliverableStatus; submittedAt: string;
  reviewedAt: string | null; feedback: string | null;
}

export interface ChecklistItemRow {
  id: string; workspaceId: string; kind: HandoverChecklistKind;
  label: string; done: boolean; doneAt: string | null; note: string | null;
}

export interface FinalReportRow { id: string; workspaceId: string; bodyMd: string; publishedAt: string }

export interface WorkspaceDetail extends WorkspaceRow {
  parties: PartyRow[];
  milestones: MilestoneRow[];
  deliverables: DeliverableRow[];
  checklist: ChecklistItemRow[];
  finalReport: FinalReportRow | null;
  events: { id: string; workspaceId: string; kind: string; actor: string; detail: any; at: string }[];
}

export interface PwhInsights {
  kickoff: number; active: number; inReview: number; handover: number; closed: number; onHold: number; cancelled: number;
  total: number;
  milestoneAcceptanceRatePct: number; deliverableAcceptanceRatePct: number;
  handoverReadinessPct: number; avgCycleDays: number;
  generatedAt: string; mode: string;
}

export interface ProjectWorkspacesHandoverClient {
  list(filters?: { projectId?: string; contractId?: string; status?: WorkspaceStatus[] }): Promise<WorkspaceRow[]>;
  detail(id: string): Promise<WorkspaceDetail | null>;
  mintFromContract(args: {
    contractId: string; projectId: string; title: string;
    milestones: { title: string; amountCents: number; dueAt?: string | null }[];
    parties: { partyId: string; role: 'client' | 'provider' | 'observer'; displayName: string }[];
  }): Promise<WorkspaceRow>;
  kickoff(workspaceId: string): Promise<WorkspaceRow>;
  transitionMilestone(args: { workspaceId: string; milestoneId: string; toStatus: MilestoneStatus; expectedVersion: number; note?: string }): Promise<MilestoneRow>;
  submitDeliverable(args: { workspaceId: string; milestoneId: string; title: string; url: string; notes?: string }): Promise<DeliverableRow>;
  reviewDeliverable(args: { workspaceId: string; deliverableId: string; decision: 'accepted' | 'changes-requested'; feedback?: string }): Promise<DeliverableRow>;
  startHandover(workspaceId: string): Promise<WorkspaceRow>;
  completeChecklistItem(args: { workspaceId: string; itemId: string; note?: string }): Promise<ChecklistItemRow>;
  close(args: { workspaceId: string; finalReportMd: string }): Promise<{ workspace: WorkspaceRow; report: FinalReportRow }>;
  hold(workspaceId: string, reason: string): Promise<WorkspaceRow>;
  cancel(workspaceId: string, reason: string): Promise<WorkspaceRow>;
  insights(projectId?: string): Promise<PwhInsights>;
}

export const createProjectWorkspacesHandoverClient = (
  fetcher: typeof fetch,
  base = '/api/v1/project-workspaces-handover',
): ProjectWorkspacesHandoverClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`pwh ${path} ${r.status}`);
    return r.json();
  };
  const idem = (s: string) => `pwh-${s}-${(globalThis as any).crypto?.randomUUID?.() ?? Date.now()}`;
  return {
    list: (f) => {
      const qs = new URLSearchParams();
      if (f?.projectId) qs.set('projectId', f.projectId);
      if (f?.contractId) qs.set('contractId', f.contractId);
      if (f?.status?.length) f.status.forEach((s) => qs.append('status', s));
      const q = qs.toString();
      return j(`/workspaces${q ? '?' + q : ''}`);
    },
    detail: (id) => j(`/workspaces/${id}`),
    mintFromContract: (b) => j('/workspaces/from-contract', { method: 'POST', body: JSON.stringify({ ...b, milestones: b.milestones.map((m) => ({ ...m, dueAt: m.dueAt ?? null })), idempotencyKey: idem('mint') }) }),
    kickoff: (id) => j(`/workspaces/${id}/kickoff`, { method: 'POST' }),
    transitionMilestone: (b) => j('/milestones/transition', { method: 'POST', body: JSON.stringify(b) }),
    submitDeliverable: (b) => j('/deliverables/submit', { method: 'POST', body: JSON.stringify({ ...b, idempotencyKey: idem('deliv') }) }),
    reviewDeliverable: (b) => j('/deliverables/review', { method: 'POST', body: JSON.stringify(b) }),
    startHandover: (workspaceId) => j('/handover/start', { method: 'POST', body: JSON.stringify({ workspaceId }) }),
    completeChecklistItem: (b) => j('/handover/complete-item', { method: 'POST', body: JSON.stringify(b) }),
    close: (b) => j('/workspaces/close', { method: 'POST', body: JSON.stringify({ ...b, idempotencyKey: idem('close') }) }),
    hold: (workspaceId, reason) => j('/workspaces/hold', { method: 'POST', body: JSON.stringify({ workspaceId, reason }) }),
    cancel: (workspaceId, reason) => j('/workspaces/cancel', { method: 'POST', body: JSON.stringify({ workspaceId, reason }) }),
    insights: (projectId) => j(`/insights${projectId ? `?projectId=${projectId}` : ''}`),
  };
};
