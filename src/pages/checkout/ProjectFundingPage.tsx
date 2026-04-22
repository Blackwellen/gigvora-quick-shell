import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, CheckCircle2, CreditCard, Clock, Lock, Loader2,
  Milestone, DollarSign, Shield, FileText, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const MILESTONES = [
  { id: '1', name: 'Discovery & Research', amount: 2000, status: 'completed', paid: true },
  { id: '2', name: 'Design Phase', amount: 3500, status: 'in-progress', paid: false },
  { id: '3', name: 'Development Sprint 1', amount: 5000, status: 'pending', paid: false },
  { id: '4', name: 'Development Sprint 2', amount: 5000, status: 'pending', paid: false },
  { id: '5', name: 'Testing & Launch', amount: 2500, status: 'pending', paid: false },
];

export default function ProjectFundingPage() {
  const { projectId } = useParams();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>('2');
  const [processing, setProcessing] = useState(false);
  const [funded, setFunded] = useState(false);

  const totalBudget = MILESTONES.reduce((s, m) => s + m.amount, 0);
  const paidAmount = MILESTONES.filter(m => m.paid).reduce((s, m) => s + m.amount, 0);
  const selected = MILESTONES.find(m => m.id === selectedMilestone);

  const handleFund = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setFunded(true); toast.success('Milestone funded successfully'); }, 1500);
  };

  if (funded) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
        <h1 className="text-2xl font-bold mb-2">Milestone Funded!</h1>
        <p className="text-sm text-muted-foreground mb-6">Funds are now held in escrow. They will be released upon milestone completion and your approval.</p>
        <div className="bg-muted/30 rounded-2xl p-4 max-w-sm mx-auto mb-6 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Milestone</span><span className="font-bold">{selected?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount Held</span><span className="font-bold">${selected?.amount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-bold text-primary">In Escrow</span></div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to={`/projects/${projectId || 'demo'}/milestones`}><Button className="h-10 rounded-xl gap-1"><Milestone className="h-4 w-4" />View Milestones</Button></Link>
          <Link to={`/projects/${projectId || 'demo'}`}><Button variant="outline" className="h-10 rounded-xl">Back to Project</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
      <div className="flex items-center gap-2">
        <Link to={`/projects/${projectId || 'demo'}/milestones`}><ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" /></Link>
        <h1 className="text-xl font-bold">Project Funding</h1>
      </div>

      {/* Budget Overview */}
      <SectionCard title="Budget Overview" className="!rounded-2xl">
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="bg-muted/30 rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground">Total Budget</div><div className="text-lg font-bold">${totalBudget.toLocaleString()}</div></div>
          <div className="bg-primary/5 rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground">Paid</div><div className="text-lg font-bold text-primary">${paidAmount.toLocaleString()}</div></div>
          <div className="bg-muted/30 rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground">Remaining</div><div className="text-lg font-bold">${(totalBudget - paidAmount).toLocaleString()}</div></div>
        </div>
        <Progress value={(paidAmount / totalBudget) * 100} className="h-2 rounded-full" />
        <div className="text-[9px] text-muted-foreground mt-1">{Math.round((paidAmount / totalBudget) * 100)}% funded</div>
      </SectionCard>

      {/* Milestones */}
      <SectionCard title="Milestones" icon={<Milestone className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
        <div className="space-y-2">
          {MILESTONES.map(m => (
            <div
              key={m.id}
              onClick={() => !m.paid && setSelectedMilestone(m.id)}
              className={`flex items-center gap-3 py-3 px-3 rounded-xl border transition-all cursor-pointer ${
                selectedMilestone === m.id ? 'border-primary bg-primary/5 shadow-sm' :
                m.paid ? 'border-border/30 bg-muted/10 opacity-60' :
                'border-border hover:border-primary/30'
              }`}
            >
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                m.paid ? 'bg-primary/10 text-primary' :
                m.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {m.paid ? <CheckCircle2 className="h-4 w-4" /> : m.id}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold">{m.name}</div>
                <div className="text-[10px] text-muted-foreground">{m.paid ? 'Paid & completed' : m.status === 'in-progress' ? 'In progress — awaiting funding' : 'Upcoming'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">${m.amount.toLocaleString()}</div>
                {m.paid && <Badge variant="secondary" className="text-[8px]">Paid</Badge>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Payment for selected milestone */}
      {selected && !selected.paid && (
        <SectionCard title={`Fund: ${selected.name}`} icon={<CreditCard className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-[10px]"><span className="font-medium">Escrow Protection:</span> Funds will be held securely until you approve the milestone deliverables. You can request revisions or raise a dispute.</div>
          </div>
          <div className="space-y-3">
            <div><label className="text-xs font-medium mb-1.5 block">Card Number</label><Input placeholder="1234 5678 9012 3456" className="h-10 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium mb-1.5 block">Expiry</label><Input placeholder="MM/YY" className="h-10 rounded-xl" /></div>
              <div><label className="text-xs font-medium mb-1.5 block">CVC</label><Input placeholder="123" className="h-10 rounded-xl" /></div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-3"><Lock className="h-3.5 w-3.5" />256-bit SSL · Escrow protected</div>
          <Button onClick={handleFund} disabled={processing} className="w-full h-11 rounded-xl font-semibold mt-4 gap-1">
            {processing ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Fund Milestone · ${selected.amount.toLocaleString()}</>}
          </Button>
        </SectionCard>
      )}
    </div>
  );
}
