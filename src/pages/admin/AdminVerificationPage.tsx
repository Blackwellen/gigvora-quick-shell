import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  Shield, Settings, Eye, FileText, Camera, Zap, Globe,
  Fingerprint, Sparkles, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type VStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'resubmit';

interface VerificationRequest {
  id: string; user: string; type: string; document: string;
  status: VStatus; submitted: string; country: string;
  aiScore?: number; aiFlag?: string;
}

const STATUS_CLS: Record<VStatus, string> = {
  pending: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  reviewing: 'bg-accent/10 text-accent',
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  rejected: 'bg-destructive/10 text-destructive',
  resubmit: 'bg-muted text-muted-foreground',
};

const REQUESTS: VerificationRequest[] = [
  { id: 'VER-0091', user: 'Jordan K.', type: 'Identity', document: 'Passport', status: 'pending', submitted: '3 hours ago', country: 'US', aiScore: 92, aiFlag: undefined },
  { id: 'VER-0090', user: 'Casey D.', type: 'Identity', document: 'Drivers License', status: 'reviewing', submitted: '5 hours ago', country: 'UK', aiScore: 67, aiFlag: 'Blurred text detected' },
  { id: 'VER-0089', user: 'Alex M.', type: 'Business', document: 'Business Registration', status: 'pending', submitted: '8 hours ago', country: 'DE', aiScore: 88 },
  { id: 'VER-0088', user: 'Riley S.', type: 'Identity', document: 'National ID', status: 'approved', submitted: '1 day ago', country: 'IN', aiScore: 98 },
  { id: 'VER-0085', user: 'Morgan L.', type: 'Identity', document: 'Passport', status: 'rejected', submitted: '2 days ago', country: 'CA', aiScore: 24, aiFlag: 'Document appears tampered' },
  { id: 'VER-0082', user: 'Taylor R.', type: 'Address', document: 'Utility Bill', status: 'resubmit', submitted: '3 days ago', country: 'AU', aiScore: 45, aiFlag: 'Older than 3 months' },
];

export default function AdminVerificationPage() {
  const [tab, setTab] = useState('all');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(true);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(90);

  const filtered = REQUESTS.filter(r => tab === 'all' || r.status === tab);

  return (
    <DashboardLayout topStrip={
      <>
        <UserCheck className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">ID Verification</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px]">{REQUESTS.filter(r => r.status === 'pending').length} Pending Review</Badge>
      </>
    } rightRail={
      <div className="space-y-3">
        <SectionCard title="AI Verification Settings" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">AI Auto-Check</div>
                <div className="text-[8px] text-muted-foreground">Automatically scan uploaded documents</div>
              </div>
              <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">Auto-Approve</div>
                <div className="text-[8px] text-muted-foreground">Auto-approve high confidence scores</div>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
            {autoApprove && (
              <div>
                <div className="text-[9px] font-semibold mb-1">Confidence Threshold</div>
                <div className="flex gap-1">
                  {[80, 85, 90, 95].map(v => (
                    <Button key={v} variant={autoApproveThreshold === v ? 'default' : 'outline'} size="sm" className="h-6 text-[8px] rounded-lg flex-1" onClick={() => setAutoApproveThreshold(v)}>{v}%</Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">Liveness Check</div>
                <div className="text-[8px] text-muted-foreground">Require selfie match</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">Tamper Detection</div>
                <div className="text-[8px] text-muted-foreground">Flag edited or altered documents</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Accepted Documents">
          <div className="space-y-1 text-[8px] text-muted-foreground">
            {['Passport', 'National ID Card', 'Drivers License', 'Residence Permit', 'Business Registration', 'Utility Bill (address)'].map(d => (
              <p key={d} className="flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> {d}</p>
            ))}
          </div>
        </SectionCard>
      </div>
    } rightRailWidth="w-56">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Pending" value={String(REQUESTS.filter(r => r.status === 'pending').length)} />
        <KPICard label="Reviewing" value={String(REQUESTS.filter(r => r.status === 'reviewing').length)} />
        <KPICard label="Approved Today" value="18" />
        <KPICard label="AI Pass Rate" value="78%" />
        <KPICard label="Avg Review" value="2.4h" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'pending', 'reviewing', 'approved', 'rejected', 'resubmit'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="p-4 rounded-2xl border border-border/30 bg-card hover:border-accent/30 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', STATUS_CLS[r.status])}>
                <Fingerprint className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{r.user}</span>
                  <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', STATUS_CLS[r.status])}>{r.status}</Badge>
                  <Badge variant="outline" className="text-[7px] h-3.5">{r.type}</Badge>
                  {r.aiFlag && <Badge className="text-[6px] h-3 bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0 gap-0.5"><AlertTriangle className="h-2 w-2" /> {r.aiFlag}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="font-mono">{r.id}</span>
                  <span>{r.document}</span>
                  <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{r.country}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{r.submitted}</span>
                  {r.aiScore !== undefined && (
                    <span className={cn('font-semibold', r.aiScore >= 80 ? 'text-[hsl(var(--state-healthy))]' : r.aiScore >= 50 ? 'text-[hsl(var(--gigvora-amber))]' : 'text-destructive')}>
                      <Sparkles className="h-2.5 w-2.5 inline mr-0.5" />AI: {r.aiScore}%
                    </span>
                  )}
                </div>
              </div>
              {(r.status === 'pending' || r.status === 'reviewing') && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" /> Review</Button>
                  <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 text-destructive"><XCircle className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
