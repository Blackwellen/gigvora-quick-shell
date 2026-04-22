import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Image, Plus, Search, Eye, Edit, Copy, Trash2, Video, FileText,
  Smartphone, Monitor, Layers, Star, CheckCircle2, AlertCircle,
  MoreHorizontal,
} from 'lucide-react';

type CreativeType = 'image' | 'video' | 'text' | 'carousel';
type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';

interface Creative {
  id: string; name: string; type: CreativeType; approval: ApprovalStatus;
  dimensions: string; impressions: string; ctr: string; usedIn: number;
  lastEdited: string; variations: number;
}

const CREATIVES: Creative[] = [
  { id: 'CR-001', name: 'Hero Banner v3', type: 'image', approval: 'approved', dimensions: '1200x628', impressions: '45K', ctr: '2.8%', usedIn: 3, lastEdited: '2h ago', variations: 3 },
  { id: 'CR-002', name: 'Product Demo 15s', type: 'video', approval: 'approved', dimensions: '1080x1080', impressions: '32K', ctr: '3.1%', usedIn: 2, lastEdited: '1d ago', variations: 2 },
  { id: 'CR-003', name: 'Testimonial Carousel', type: 'carousel', approval: 'approved', dimensions: '1080x1080 x4', impressions: '28K', ctr: '2.4%', usedIn: 1, lastEdited: '3d ago', variations: 1 },
  { id: 'CR-004', name: 'Feature Highlight', type: 'image', approval: 'approved', dimensions: '1200x628', impressions: '22K', ctr: '1.8%', usedIn: 2, lastEdited: '5d ago', variations: 2 },
  { id: 'CR-005', name: 'Recruiter CTA Banner', type: 'image', approval: 'pending', dimensions: '1200x628', impressions: '0', ctr: '—', usedIn: 0, lastEdited: '4h ago', variations: 4 },
  { id: 'CR-006', name: 'Explainer 30s', type: 'video', approval: 'draft', dimensions: '1920x1080', impressions: '0', ctr: '—', usedIn: 0, lastEdited: '1h ago', variations: 1 },
];

const TYPE_ICONS: Record<CreativeType, typeof Image> = { image: Image, video: Video, text: FileText, carousel: Layers };
const APPROVAL_COLORS: Record<ApprovalStatus, string> = {
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  pending: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  rejected: 'bg-destructive/10 text-destructive',
  draft: 'bg-muted text-muted-foreground',
};

const AdsCreativeBuilderPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = CREATIVES.filter(c => typeFilter === 'all' || c.type === typeFilter);

  const topStrip = (
    <>
      <Image className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
      <span className="text-xs font-semibold">Ads — Creative Builder</span>
      <div className="flex-1" />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Types</option>
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="carousel">Carousel</option>
        <option value="text">Text</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Creative</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Placement Preview" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Feed', icon: Monitor, supported: true },
            { l: 'Stories', icon: Smartphone, supported: true },
            { l: 'Sidebar', icon: Monitor, supported: true },
            { l: 'Search', icon: Monitor, supported: false },
          ].map(p => (
            <div key={p.l} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer">
              <p.icon className="h-3 w-3 text-muted-foreground" />
              <span className={p.supported ? '' : 'text-muted-foreground line-through'}>{p.l}</span>
              {p.supported && <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] ml-auto" />}
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Specs" className="!rounded-2xl">
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div>Feed: 1200×628 or 1080×1080</div>
          <div>Stories: 1080×1920</div>
          <div>Video: Max 60s, &lt;100MB</div>
          <div>Carousel: 2-10 cards</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Creatives" value={String(CREATIVES.length)} className="!rounded-2xl" />
        <KPICard label="Approved" value={String(CREATIVES.filter(c => c.approval === 'approved').length)} className="!rounded-2xl" />
        <KPICard label="Pending Review" value={String(CREATIVES.filter(c => c.approval === 'pending').length)} className="!rounded-2xl" />
        <KPICard label="Avg CTR" value="2.5%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filtered.map(c => {
          const Icon = TYPE_ICONS[c.type];
          return (
            <div key={c.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md cursor-pointer transition-all group">
              <div className="h-28 bg-gradient-to-br from-muted/50 to-accent/5 flex items-center justify-center">
                <Icon className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge className={cn('text-[7px] border-0 capitalize', APPROVAL_COLORS[c.approval])}>{c.approval}</Badge>
                  <Badge variant="secondary" className="text-[7px] capitalize">{c.type}</Badge>
                  {c.variations > 1 && <Badge variant="secondary" className="text-[7px]">{c.variations} vars</Badge>}
                </div>
                <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{c.name}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{c.dimensions} · Used in {c.usedIn} ads</div>
                <div className="flex gap-2 mt-1.5 text-[9px]">
                  <span className="text-muted-foreground">{c.impressions} impr</span>
                  <span className="font-semibold">{c.ctr} CTR</span>
                </div>
                <div className="flex gap-1 mt-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg gap-0.5 flex-1"><Eye className="h-2.5 w-2.5" />Preview</Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg gap-0.5 flex-1"><Edit className="h-2.5 w-2.5" />Edit</Button>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-lg"><Copy className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default AdsCreativeBuilderPage;
