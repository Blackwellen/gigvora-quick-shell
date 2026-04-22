import React, { useMemo, useState } from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';
import { useAdminOpsList, useAdminOpsBulk } from '@/hooks/useAdminOps';
import { toast } from 'sonner';

const TONE: Record<string, 'success'|'warn'|'danger'|'info'|'neutral'> = {
  active: 'success', watch: 'warn', suspended: 'danger', locked: 'danger', archived: 'neutral',
};

export default function OpsUsersPage() {
  const { data, isLoading } = useAdminOpsList<any>('users');
  const bulk = useAdminOpsBulk();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = data?.items ?? [];
  const allSelected = items.length > 0 && selected.size === items.length;

  const rows = useMemo(() => items.map((u: any) => ([
    <input type="checkbox" checked={selected.has(u.id)} onChange={() => {
      const n = new Set(selected); n.has(u.id) ? n.delete(u.id) : n.add(u.id); setSelected(n);
    }} />,
    u.reference, `@${u.handle}`, u.plan, u.region ?? '—',
    <OpsBadge tone={TONE[u.status] ?? 'neutral'}>{u.status}</OpsBadge>,
    u.joined_at ?? '—',
  ])), [items, selected]);

  const act = async (action: 'suspend'|'reinstate'|'archive'|'watch') => {
    if (!selected.size) return toast.error('Select at least one row');
    await bulk.mutateAsync({ entity: 'user', ids: [...selected], action });
    toast.success(`${selected.size} users → ${action}`);
    setSelected(new Set());
  };

  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Users" subtitle="All user accounts on the platform — with plan tier, account state, and per-row audit." right={
        <div className="flex gap-1.5">
          <button onClick={() => act('reinstate')} className="rounded-lg border text-[12px] px-3 py-1.5">Reinstate</button>
          <button onClick={() => act('watch')}     className="rounded-lg border text-[12px] px-3 py-1.5">Watch</button>
          <button onClick={() => act('suspend')}   className="rounded-lg border border-rose-500/40 text-rose-700 text-[12px] px-3 py-1.5">Suspend</button>
        </div>
      } />
      <div className="mb-3 text-[11px] text-muted-foreground">
        {isLoading ? 'Loading…' : `${data?.total ?? items.length} users · source: ${data?.meta?.source ?? 'live'}`}
        {selected.size > 0 && ` · ${selected.size} selected`}
      </div>
      <OpsTable
        headers={[
          (<input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i: any) => i.id)))} />) as any,
          'ID','Handle','Plan','Region','Status','Joined',
        ]}
        rows={rows}
      />
    </OpsPageShell>
  );
}
