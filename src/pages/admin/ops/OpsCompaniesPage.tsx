import React, { useMemo, useState } from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';
import { useAdminOpsList, useAdminOpsBulk } from '@/hooks/useAdminOps';
import { toast } from 'sonner';

const TONE: Record<string, 'success'|'warn'|'danger'|'info'|'neutral'> = {
  active: 'success', watch: 'warn', suspended: 'danger', archived: 'neutral',
};

export default function OpsCompaniesPage() {
  const { data, isLoading } = useAdminOpsList<any>('companies');
  const bulk = useAdminOpsBulk();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = data?.items ?? [];
  const allSelected = items.length > 0 && selected.size === items.length;

  const rows = useMemo(() => items.map((c: any) => ([
    <input type="checkbox" checked={selected.has(c.id)} onChange={() => {
      const n = new Set(selected); n.has(c.id) ? n.delete(c.id) : n.add(c.id); setSelected(n);
    }} />,
    c.reference, c.name,
    <OpsBadge tone={c.verification === 'verified' ? 'success' : c.verification === 'rejected' ? 'danger' : 'info'}>{c.verification}</OpsBadge>,
    String(c.headcount ?? 0), c.plan,
    <OpsBadge tone={TONE[c.status] ?? 'neutral'}>{c.status}</OpsBadge>,
  ])), [items, selected]);

  const act = async (action: 'suspend'|'reinstate'|'verify'|'reject'|'archive'|'watch') => {
    if (!selected.size) return toast.error('Select at least one row');
    await bulk.mutateAsync({ entity: 'company', ids: [...selected], action });
    toast.success(`${selected.size} companies → ${action}`);
    setSelected(new Set());
  };

  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Companies" subtitle="All company records on the platform with verification, plan, and audit trail." right={
        <div className="flex gap-1.5">
          <button onClick={() => act('verify')}    className="rounded-lg border text-[12px] px-3 py-1.5">Verify</button>
          <button onClick={() => act('watch')}     className="rounded-lg border text-[12px] px-3 py-1.5">Watch</button>
          <button onClick={() => act('suspend')}   className="rounded-lg border border-rose-500/40 text-rose-700 text-[12px] px-3 py-1.5">Suspend</button>
        </div>
      } />
      <div className="mb-3 text-[11px] text-muted-foreground">
        {isLoading ? 'Loading…' : `${data?.total ?? items.length} records · source: ${data?.meta?.source ?? 'live'}`}
        {selected.size > 0 && ` · ${selected.size} selected`}
      </div>
      <OpsTable
        headers={[
          (<input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i: any) => i.id)))} />) as any,
          'ID','Name','Verification','Headcount','Plan','Status',
        ]}
        rows={rows}
      />
    </OpsPageShell>
  );
}
