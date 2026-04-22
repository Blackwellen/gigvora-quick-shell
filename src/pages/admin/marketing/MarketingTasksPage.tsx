import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ListTodo, Plus, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string; title: string; assignee: string; due: string; priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done'; campaign?: string;
}

const TASKS: Task[] = [
  { id: 'T-1042', title: 'Q4 SEO audit — designer keyword cluster', assignee: 'Marketing Ops', due: 'Apr 25', priority: 'high', status: 'in_progress', campaign: 'C-1201' },
  { id: 'T-1041', title: 'Refresh AI Tools landing page hero', assignee: 'Maya Chen', due: 'Apr 22', priority: 'medium', status: 'in_progress', campaign: 'C-1197' },
  { id: 'T-1040', title: 'Brief copywriter on Spring promo extension', assignee: 'Lin Park', due: 'Apr 20', priority: 'urgent', status: 'todo', campaign: 'C-1201' },
  { id: 'T-1039', title: 'Approve Q2 enterprise sales creatives', assignee: 'Marcus Rivera', due: 'Apr 21', priority: 'high', status: 'review', campaign: 'C-1199' },
  { id: 'T-1038', title: 'Pull MoM conversion report', assignee: 'Priya Patel', due: 'Apr 19', priority: 'medium', status: 'review' },
  { id: 'T-1037', title: 'Set up A/B test for /pricing CTA', assignee: 'Alex Kim', due: 'Apr 18', priority: 'low', status: 'done' },
  { id: 'T-1036', title: 'Update ads moderation policy doc', assignee: 'Lin Park', due: 'Apr 17', priority: 'low', status: 'done' },
];

const PRIORITY = {
  low: 'bg-muted text-foreground/70',
  medium: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  high: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  urgent: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const COLUMNS: Array<{ key: Task['status']; label: string }> = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'review', label: 'In review' },
  { key: 'done', label: 'Done' },
];

const MarketingTasksPage: React.FC = () => {
  const [tasks] = useState(TASKS);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><ListTodo className="h-3.5 w-3.5" /> Marketing · Delegated Tasks</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Delegated tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Task delegation across the marketing team with SLA tracking.</p>
        </div>
        <Button onClick={() => toast.success('Task created')}><Plus className="h-4 w-4 mr-1.5" /> New task</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-xl border bg-muted/20 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                <Badge variant="secondary" className="tabular-nums">{items.length}</Badge>
              </div>
              <div className="space-y-2 flex-1">
                {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Nothing here.</div>}
                {items.map((t) => (
                  <div key={t.id} className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{t.id}</span>
                      <Badge variant="outline" className={cn('text-[10px] capitalize border-0', PRIORITY[t.priority])}>{t.priority}</Badge>
                    </div>
                    <div className="text-sm font-medium leading-snug">{t.title}</div>
                    {t.campaign && <div className="text-xs text-muted-foreground mt-1.5 font-mono">↗ {t.campaign}</div>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2.5">
                      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{t.assignee}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketingTasksPage;
