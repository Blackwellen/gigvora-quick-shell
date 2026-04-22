import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitBranch, ArrowRight, Plus, AlertTriangle } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';

const ESCALATIONS = [
  { id: 'CS-9200', subject: 'Cannot withdraw — bank verification', from: 'Billing', to: 'Trust & Safety', age: '47m', sla: '−4m' },
  { id: 'CS-9176', subject: 'Profile shadow-banned wrongly', from: 'Account', to: 'Trust & Safety', age: '1h 12m', sla: '−12m' },
  { id: 'CS-9189', subject: 'Project milestone disputed', from: 'Billing', to: 'Disputes', age: '2h 04m', sla: '12m' },
];

const RULES = [
  { name: 'Urgent + waiting > 30m', target: 'Lead on shift', enabled: true },
  { name: 'Refund > $500', target: 'Finance Admin', enabled: true },
  { name: 'Trust & safety keyword (fraud, hack, breach)', target: 'Trust & Safety', enabled: true },
  { name: 'Enterprise tier ticket', target: 'Enterprise CS', enabled: true },
  { name: 'Repeat reopen (3+)', target: 'Lead on shift', enabled: false },
];

const CsEscalationsPage: React.FC = () => (
  <CsPageShell>
    <CsBackLink />
    <CsPageHeader
      eyebrow="Routing & Escalations"
      title="Escalation paths"
      subtitle="Rules, paths, and live escalations. Lead and Super Admin can edit rules."
      right={<Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> New rule</Button>}
    />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Open escalations</div>
        <div className="divide-y">
          {ESCALATIONS.map((e) => (
            <div key={e.id} className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-muted-foreground">{e.id}</span>
                {e.sla.startsWith('−') && <Badge className="text-[9px] bg-rose-500/15 text-rose-700 dark:text-rose-300 border-0">SLA breach</Badge>}
                <span className="text-[10px] text-muted-foreground ml-auto">{e.age}</span>
              </div>
              <div className="text-sm font-medium mb-2">{e.subject}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{e.from}</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className="text-[10px]">{e.to}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Routing rules</div>
        <div className="divide-y">
          {RULES.map((r, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Routes to {r.target}
                </div>
              </div>
              <Badge variant="secondary" className={cn('text-[10px] border-0',
                r.enabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                {r.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  </CsPageShell>
);

export default CsEscalationsPage;
