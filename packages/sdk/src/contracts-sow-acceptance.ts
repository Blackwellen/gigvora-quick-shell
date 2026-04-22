/**
 * Typed SDK for Domain 36 — Contracts, SoW, Terms Acceptance & Signature Follow-Through.
 */
export type ContractStatus =
  | 'draft' | 'sent' | 'partially-signed' | 'signed' | 'countersigned'
  | 'active' | 'rejected' | 'cancelled' | 'expired' | 'superseded';

export type PartyRole = 'client' | 'provider' | 'witness' | 'approver';
export type GoverningLaw = 'UK' | 'US-DE' | 'US-CA' | 'EU' | 'OTHER';

export interface PartyRow {
  id: string; contractId: string; partyId: string; role: PartyRole;
  displayName: string; email: string | null; signOrder: number;
  hasSigned: boolean; signedAt: string | null;
}

export interface SnapshotRow {
  id: string; contractId: string; proposalId: string; capturedAt: string;
  scopeMd: string;
  milestones: { id: string; title: string; amountCents: number; dueAt: string | null }[];
  totalAmountCents: number; currency: string; termsVersion: string; bodyHash: string;
}

export interface SignatureRow {
  id: string; contractId: string; partyRowId: string; partyId: string;
  typedName: string; capturedIp: string; capturedUa: string; capturedAt: string;
  prevHash: string | null; hash: string; acceptedTos: boolean; acceptedScope: boolean;
}

export interface ContractRow {
  id: string; tenantId: string; projectId: string; proposalId: string;
  awardId: string; title: string; governingLaw: GoverningLaw;
  status: ContractStatus; expiresAt: string;
  amendsContractId: string | null; supersededByContractId: string | null;
  contentHash: string; createdAt: string; updatedAt: string;
  activatedAt: string | null; closedAt: string | null; version: number;
}

export interface ContractDetail extends ContractRow {
  parties: PartyRow[];
  snapshot: SnapshotRow | undefined;
  signatures: SignatureRow[];
  events: { id: string; contractId: string; kind: string; actor: string; detail: any; at: string }[];
}

export interface CsaInsights {
  draft: number; sent: number; partiallySigned: number; signed: number;
  active: number; rejected: number; cancelled: number; expired: number; superseded: number;
  total: number; avgTimeToSignHours: number; integrityOkPct: number;
  generatedAt: string; mode: string;
}

export interface ContractsSowAcceptanceClient {
  list(filters?: { projectId?: string; proposalId?: string; status?: ContractStatus[] }): Promise<ContractRow[]>;
  detail(id: string): Promise<ContractDetail | null>;
  mintFromAward(args: {
    awardId: string; proposalId: string; projectId: string; title: string;
    governingLaw?: GoverningLaw; expiresInDays?: number;
    parties: { partyId: string; role: PartyRole; displayName: string; email?: string; signOrder: number }[];
  }): Promise<ContractRow>;
  send(contractId: string, message?: string): Promise<ContractRow>;
  sign(args: { contractId: string; partyId: string; typedName: string; capturedIp?: string; capturedUa?: string }): Promise<{ signature: SignatureRow; contract: ContractRow; allSigned: boolean }>;
  reject(contractId: string, partyId: string, reason: string): Promise<ContractRow>;
  voidContract(contractId: string, reason: string): Promise<ContractRow>;
  amend(contractId: string, changeSummary: string, newExpiresInDays?: number): Promise<ContractRow>;
  verifyHash(contractId: string): Promise<{ ok: boolean; expectedTip: string | null; actualTip: string | null; details: { index: number; ok: boolean }[] }>;
  insights(projectId?: string): Promise<CsaInsights>;
}

export const createContractsSowAcceptanceClient = (
  fetcher: typeof fetch,
  base = '/api/v1/contracts-sow-acceptance',
): ContractsSowAcceptanceClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`csa ${path} ${r.status}`);
    return r.json();
  };
  const idem = (s: string) => `csa-${s}-${(globalThis as any).crypto?.randomUUID?.() ?? Date.now()}`;
  return {
    list: (f) => {
      const qs = new URLSearchParams();
      if (f?.projectId) qs.set('projectId', f.projectId);
      if (f?.proposalId) qs.set('proposalId', f.proposalId);
      if (f?.status?.length) f.status.forEach((s) => qs.append('status', s));
      const q = qs.toString();
      return j(`/contracts${q ? '?' + q : ''}`);
    },
    detail: (id) => j(`/contracts/${id}`),
    mintFromAward: (b) => j('/contracts/from-award', { method: 'POST', body: JSON.stringify({ governingLaw: 'UK', expiresInDays: 30, ...b, idempotencyKey: idem('mint') }) }),
    send: (contractId, message) => j('/contracts/send', { method: 'POST', body: JSON.stringify({ contractId, message }) }),
    sign: (b) => j('/contracts/sign', { method: 'POST', body: JSON.stringify({ ...b, acceptTos: true, acceptScope: true, idempotencyKey: idem('sign') }) }),
    reject: (contractId, partyId, reason) => j('/contracts/reject', { method: 'POST', body: JSON.stringify({ contractId, partyId, reason }) }),
    voidContract: (contractId, reason) => j('/contracts/void', { method: 'POST', body: JSON.stringify({ contractId, reason }) }),
    amend: (contractId, changeSummary, newExpiresInDays) => j('/contracts/amend', { method: 'POST', body: JSON.stringify({ contractId, changeSummary, newExpiresInDays, idempotencyKey: idem('amend') }) }),
    verifyHash: (contractId) => j('/contracts/verify-hash', { method: 'POST', body: JSON.stringify({ contractId }) }),
    insights: (projectId) => j(`/insights${projectId ? `?projectId=${projectId}` : ''}`),
  };
};
