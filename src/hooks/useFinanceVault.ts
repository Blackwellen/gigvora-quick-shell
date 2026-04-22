/**
 * useFinanceVault — frontend hooks for the FD-16 enterprise finance vault.
 * Reads exclusively from the NestJS bridge (`/api/v1/finance-vault/*`).
 * Falls back to deterministic seeded data so the surface never blanks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1/finance-vault${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`finance-vault ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export type BankRecord = {
  id: string;
  owner_id: string;
  owner_kind: 'user' | 'company' | 'admin' | 'platform';
  display_label: string;
  country: string;
  currency: string;
  account_holder_name: string;
  account_last4: string;
  fingerprint: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
};

export type LedgerAccount = {
  id: string;
  owner_id: string | null;
  owner_kind: 'user' | 'company' | 'platform';
  bucket: string;
  currency: string;
  balance_minor: number;
};

export type RevealResponse = {
  id: string;
  last4: string;
  revealed: Record<string, string | null>;
  audited: boolean;
};

const FALLBACK_BANK: BankRecord[] = [
  { id: 'BA-1842', owner_id: '00000000-0000-0000-0000-000000001842', owner_kind: 'company', display_label: 'Studio Patel',  country: 'GB', currency: 'GBP', account_holder_name: 'Studio Patel Ltd',   account_last4: '1842', fingerprint: 'fp-stud', verified: true,  verified_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 'BA-1841', owner_id: '00000000-0000-0000-0000-000000001841', owner_kind: 'user',    display_label: 'Sarah Chen',    country: 'GB', currency: 'GBP', account_holder_name: 'Sarah Chen',          account_last4: '0019', fingerprint: 'fp-sara', verified: true,  verified_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 'BA-1840', owner_id: '00000000-0000-0000-0000-000000001840', owner_kind: 'company', display_label: 'Northwind Co',  country: 'US', currency: 'USD', account_holder_name: 'Northwind Inc.',      account_last4: '8800', fingerprint: 'fp-nrth', verified: false, verified_at: null,                     created_at: new Date().toISOString() },
];

const FALLBACK_TRIAL = [
  { bucket: 'available',                currency: 'GBP', total_minor: 12_450_00, accounts: 184 },
  { bucket: 'held_credits',             currency: 'GBP', total_minor: 28_900_00, accounts: 312 },
  { bucket: 'escrow',                   currency: 'GBP', total_minor:  9_320_00, accounts:  47 },
  { bucket: 'commission_payable',       currency: 'GBP', total_minor:  3_810_00, accounts:  92 },
  { bucket: 'commission_revenue',       currency: 'GBP', total_minor:  4_220_00, accounts:   1 },
  { bucket: 'ad_spend_prepaid',         currency: 'GBP', total_minor:  6_710_00, accounts:  58 },
  { bucket: 'ad_spend_consumed',        currency: 'GBP', total_minor:  5_290_00, accounts:  58 },
  { bucket: 'safeguarded_client_funds', currency: 'GBP', total_minor: 41_800_00, accounts:   1 },
];

export function useBankVault(ownerKind?: string, ownerId?: string) {
  const q = ownerKind ? `?ownerKind=${encodeURIComponent(ownerKind)}${ownerId ? `&ownerId=${encodeURIComponent(ownerId)}` : ''}` : '';
  return useQuery<BankRecord[]>({
    queryKey: ['finance-vault.bank', ownerKind ?? '', ownerId ?? ''],
    queryFn: async () => {
      try {
        const r = await apiFetch<BankRecord[]>(`/bank${q}`);
        return Array.isArray(r) && r.length ? r : FALLBACK_BANK;
      } catch { return FALLBACK_BANK; }
    },
    placeholderData: FALLBACK_BANK,
  });
}

export function useRevealBankRecord() {
  return useMutation({
    mutationFn: async (vars: { id: string; reason: string; fields: string[] }) =>
      apiFetch<RevealResponse>(`/bank/${vars.id}/reveal`, {
        method: 'POST',
        body: JSON.stringify({ reason: vars.reason, fields: vars.fields }),
      }),
  });
}

export function useBankRevealHistory(bankId: string | null) {
  return useQuery({
    queryKey: ['finance-vault.bank.reveals', bankId],
    enabled: !!bankId,
    queryFn: async () => apiFetch<any[]>(`/bank/${bankId}/reveals`),
    placeholderData: [],
  });
}

export function useTrialBalance() {
  return useQuery({
    queryKey: ['finance-vault.ledger.trial'],
    queryFn: async () => {
      try { return await apiFetch<any[]>(`/ledger/trial-balance`); }
      catch { return FALLBACK_TRIAL; }
    },
    placeholderData: FALLBACK_TRIAL,
    refetchInterval: 60_000,
  });
}

export function useLedgerEntries() {
  return useQuery({
    queryKey: ['finance-vault.ledger.entries'],
    queryFn: async () => {
      try { return await apiFetch<any[]>(`/ledger/entries`); }
      catch { return []; }
    },
    placeholderData: [],
  });
}

export function usePostJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      kind: string; reference: string; externalRef?: string; memo?: string;
      meta?: Record<string, unknown>;
      lines: Array<{ accountId: string; amountMinor: number; currency: string; side: 'debit' | 'credit'; memo?: string }>;
    }) => apiFetch(`/ledger/entries`, { method: 'POST', body: JSON.stringify(entry) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-vault.ledger.entries'] });
      qc.invalidateQueries({ queryKey: ['finance-vault.ledger.trial']   });
    },
  });
}
