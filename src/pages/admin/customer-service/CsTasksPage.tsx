import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, ListTodo, User, Calendar } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';
import { toast } from 'sonner';
import { useCsTasks, useCsCreateTask, useCsUpdateTask, type CsTask } from '@/hooks/useCsTasks';

const PRIORITY: Record<CsTask['priority'], string> = {
  low:    'bg-muted text-foreground/70',
  normal: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  high:   'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  urgent: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const CsTasksPage: React.FC = () => {
  const { data, isLoading } = useCsTasks();
  const create = useCsCreateTask();
  const update = useCsUpdateTask();
  const [draft, setDraft] = useState('');
  const items = data?.items ?? [];

  const add = async () => {
    if (!draft.trim()) return;
    try {
      await create.mutateAsync({ title: draft.trim(), priority: 'normal' });
      setDraft('');
      toast.success('Task created');
    } catch {
      toast.error('Could not create task — check connection');
    }
  };

  const toggle = async (t: CsTask) => {
    const next = t.status === 'done' ? 'open' : 'done';
    try { await update.mutateAsync({ taskId: t.id, patch: { status: next } }); }
    catch { toast.error('Could not update task'); }
  };

  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader eyebrow="Delegated Tasks" title="Tasks" subtitle="Tasks delegated across CS, Trust & Safety, and Finance with SLA tracking — backed by cs_tasks." />

      <div className="rounded-xl border bg-card p-3 mb-4 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a task — e.g. 'Follow up VIP refund'…" className="h-8 text-xs" />
        <Button size="sm" onClick={add} className="h-8 text-xs" disabled={create.isPending}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <ListTodo className="h-3 w-3" /> {isLoading ? 'Loading…' : `${data?.total ?? items.length} tasks`}
        </div>
        <div className="divide-y">
          {items.map((t) => (
            <div key={t.id} className="p-4 flex items-center gap-3">
              <input type="checkbox" checked={t.status === 'done'} onChange={() => toggle(t)}
                className="rounded border-muted-foreground/30" />
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-medium', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {t.assignee_id ?? 'Unassigned'}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {t.due_at ? new Date(t.due_at).toLocaleDateString() : 'No due date'}</span>
                  <span className="font-mono">{t.reference}</span>
                </div>
              </div>
              <Badge variant="secondary" className={cn('text-[10px] capitalize border-0', PRIORITY[t.priority])}>{t.priority}</Badge>
            </div>
          ))}
          {items.length === 0 && !isLoading && (
            <div className="p-10 text-center text-[13px] text-muted-foreground">No tasks yet. Add one above.</div>
          )}
        </div>
      </div>
    </CsPageShell>
  );
};

export default CsTasksPage;
