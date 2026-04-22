import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Building2, ChevronRight, Star, DollarSign, Eye,
  MessageSquare, AlertTriangle, Shield, Calendar, Users,
} from 'lucide-react';

type VendorStatus = 'active' | 'under-review' | 'at-risk' | 'inactive';

interface Vendor {
  id: string; name: string; type: string; status: VendorStatus; rating: number;
  spend: string; contracts: number; renewal: string; risk: boolean;
}

const VENDORS: Vendor[] = [
  { id: '1', name: 'Studio Alpha', type: 'Design Agency', status: 'active', rating: 4.9, spend: '$120K', contracts: 3, renewal: 'Jun 2026', risk: false },
  { id: '2', name: 'DataOps Inc', type: 'Engineering', status: 'at-risk', rating: 3.8, spend: '$42K', contracts: 1, renewal: 'Apr 2026', risk: true },
  { id: '3', name: 'Creative Co', type: 'Branding', status: 'active', rating: 4.7, spend: '$28K', contracts: 2, renewal: 'Sep 2026', risk: false },
  { id: '4', name: 'SecureNet', type: 'Security', status: 'under-review', rating: 4.5, spend: '$15K', contracts: 1, renewal: '—', risk: false },
  { id: '5', name: 'CloudScale', type: 'Infrastructure', status: 'active', rating: 4.6, spend: '$85K', contracts: 2, renewal: 'Aug 2026', risk: false },
  { id: '6', name: 'TalentBridge', type: 'Recruiting', status: 'inactive', rating: 4.0, spend: '$8K', contracts: 0, renewal: '—', risk: false },
];

const STATUS_MAP: Record<VendorStatus, { badge: 'live' | 'caution' | 'pending' | 'blocked'; label: string }> = {
  active: { badge: 'live', label: 'Active' }, 'under-review': { badge: 'pending', label: 'Under Review' },
  'at-risk': { badge: 'caution', label: 'At Risk' }, inactive: { badge: 'blocked', label: 'Inactive' },
};

export default function EntVendorsServicesPage() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Vendor | null>(null);
  const filtered = filter === 'all' ? VENDORS : VENDORS.filter(v => v.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Building2 className="h-5 w-5 text-accent" /> Vendors & Services</h1>
        <p className="text-[11px] text-muted-foreground">Monitor vendor relationships, performance, and service contracts</p>
      </div>

      <KPIBand>
        <KPICard label="Active Vendors" value="3" />
        <KPICard label="Total Spend" value="$298K" change="+18% YoY" trend="up" />
        <KPICard label="Avg Rating" value="4.4" />
        <KPICard label="At Risk" value="1" change="Contract issue" trend="down" />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['all', 'active', 'under-review', 'at-risk', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f === 'all' ? 'All' : f.replace('-', ' ')}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(v => {
          const sm = STATUS_MAP[v.status];
          return (
            <div key={v.id} onClick={() => setSelected(v)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors text-sm font-bold text-muted-foreground">{v.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{v.name}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                  {v.risk && <Badge variant="outline" className="text-[7px] rounded-lg border-[hsl(var(--state-blocked)/0.3)] text-[hsl(var(--state-blocked))]">Risk</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span>{v.type}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5" />{v.rating}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{v.spend}</span>
                  <span>{v.contracts} contracts</span>
                  {v.renewal !== '—' && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />Renewal: {v.renewal}</span>}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Vendor Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{ l: 'Type', v: selected.type }, { l: 'Rating', v: `${selected.rating}/5` }, { l: 'Spend', v: selected.spend }, { l: 'Contracts', v: String(selected.contracts) }].map(d => (
                  <div key={d.l} className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-semibold">{d.v}</div></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />View Profile</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Contact</Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Compliance</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
