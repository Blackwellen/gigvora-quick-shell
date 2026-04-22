import React, { useMemo, useState } from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';
import { useAdminOpsList, useAdminOpsBulk } from '@/hooks/useAdminOps';
import { toast } from 'sonner';

const TONE: Record<string, 'success'|'warn'|'danger'|'neutral'> = {
  active: 'success', paused: 'warn', suspended: 'danger', archived: 'neutral',
};

export default function OpsMentorsPage() {
  const { data, isLoading } = useAdminOpsList<any>('mentors');
  const bulk = useAdminOpsBulk();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = data?.items ?? [];
  const allSelected = items.length > 0 && selected.size === items.length;

  const rows = useMemo(() => items.map((m: any) => ([
    <input type="checkbox" checked={selected.has(m.id)} onChange={() => {
      const n = new Set(selected); n.has(m.id) ? n.delete(m.id) : n.add(m.id); setSelected(n);
    }} />,
    m.reference, m.display_name, m.speciality,
    `${Number(m.rating).toFixed(2)} ★`, `${m.sessions} sessions`,
    <OpsBadge tone={TONE[m.status] ?? 'neutral'}>{m.status}</OpsBadge>,
  ])), [items, selected]);

  const act = async (action: 'suspend'|'reinstate'|'archive') => {
    if (!selected.size) return toast.error('Select at least one row');
    await bulk.mutateAsync({ entity: 'mentor', ids: [...selected], action });
    toast.success(`${selected.size} mentors → ${action}`);
    setSelected(new Set());
  };

  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Mentors" subtitle="The mentor directory — verified, with rating, session volume, and audit trail." right={
        <div className="flex gap-1.5">
          <button onClick={() => act('reinstate')} className="rounded-lg border text-[12px] px-3 py-1.5">Reinstate</button>
          <button onClick={() => act('suspend')}   className="rounded-lg border border-rose-500/40 text-rose-700 text-[12px] px-3 py-1.5">Suspend</button>
        </div>
      } />
      <div className="mb-3 text-[11px] text-muted-foreground">
        {isLoading ? 'Loading…' : `${data?.total ?? items.length} mentors · source: ${data?.meta?.source ?? 'live'}`}
        {selected.size > 0 && ` · ${selected.size} selected`}
      </div>
      <OpsTable
        headers={[
          (<input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i: any) => i.id)))} />) as any,
          'ID','Name','Speciality','Rating','Sessions','Status',
        ]}
        rows={rows}
      />
    </OpsPageShell>
  );
}
