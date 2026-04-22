import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Eye, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  Calendar, Globe, Users, Tag, Image, Film, FileText, Clock,
  Shield, Lock, Unlock, DollarSign, ChevronLeft, Edit, Sparkles,
  Monitor, Smartphone, Tablet, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckItem { label: string; status: 'pass' | 'warn' | 'fail'; detail?: string; }

const CHECKLIST: CheckItem[] = [
  { label: 'Title present and within limits', status: 'pass' },
  { label: 'Description filled (min. 50 chars)', status: 'pass' },
  { label: 'Cover image / thumbnail set', status: 'pass' },
  { label: 'Tags added (min. 3)', status: 'warn', detail: 'Only 2 tags added — consider adding more for discoverability' },
  { label: 'Category selected', status: 'pass' },
  { label: 'Destination chosen', status: 'pass' },
  { label: 'Access level configured', status: 'pass' },
  { label: 'Monetization settings reviewed', status: 'pass' },
  { label: 'Content moderation pre-check', status: 'pass' },
  { label: 'Captions / transcript available', status: 'warn', detail: 'No transcript provided — auto-generate recommended' },
  { label: 'Media assets fully processed', status: 'pass' },
  { label: 'SEO meta description set', status: 'fail', detail: 'Missing — required for search visibility' },
];

const STATUS_ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle };
const STATUS_COLOR = {
  pass: 'text-[hsl(var(--state-healthy))]',
  warn: 'text-[hsl(var(--gigvora-amber))]',
  fail: 'text-destructive',
};

export default function PublishReviewPage() {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const navigate = useNavigate();

  const passes = CHECKLIST.filter(c => c.status === 'pass').length;
  const warnings = CHECKLIST.filter(c => c.status === 'warn').length;
  const fails = CHECKLIST.filter(c => c.status === 'fail').length;
  const canPublish = fails === 0;

  return (
    <DashboardLayout topStrip={
      <>
        <Eye className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Publish Review</span>
        <div className="flex-1" />
        <Link to="/creation-studio" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Studio <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Preview */}
        <div className="xl:col-span-2">
          <SectionCard title="Content Preview" icon={<Eye className="h-3.5 w-3.5 text-accent" />}
            action={
              <div className="flex gap-0.5">
                {(['desktop', 'tablet', 'mobile'] as const).map(d => {
                  const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
                  return (
                    <button key={d} onClick={() => setPreviewDevice(d)} className={cn('h-6 w-6 rounded-lg flex items-center justify-center', previewDevice === d ? 'bg-accent/10 text-accent' : 'text-muted-foreground')}>
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            }
          >
            <div className={cn(
              'mx-auto rounded-2xl bg-gradient-to-br from-accent/5 to-muted/20 border border-border/30 overflow-hidden transition-all',
              previewDevice === 'desktop' ? 'w-full aspect-video' :
              previewDevice === 'tablet' ? 'w-[480px] aspect-[3/4]' :
              'w-[280px] aspect-[9/16]'
            )}>
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <Film className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs font-semibold">Content Preview</p>
                  <p className="text-[9px] text-muted-foreground mt-1">How your content will appear on {previewDevice}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Metadata Summary */}
          <SectionCard title="Metadata Summary" icon={<Settings className="h-3.5 w-3.5 text-accent" />} className="mt-3">
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <span className="text-[8px] font-semibold text-muted-foreground block">Title</span>
                <span className="font-medium">AI Tools for Developers Guide</span>
              </div>
              <div>
                <span className="text-[8px] font-semibold text-muted-foreground block">Type</span>
                <Badge variant="outline" className="text-[8px] h-4">Article</Badge>
              </div>
              <div>
                <span className="text-[8px] font-semibold text-muted-foreground block">Destination</span>
                <span>Feed → Public</span>
              </div>
              <div>
                <span className="text-[8px] font-semibold text-muted-foreground block">Access</span>
                <span className="flex items-center gap-1"><Unlock className="h-2.5 w-2.5" /> Public</span>
              </div>
              <div>
                <span className="text-[8px] font-semibold text-muted-foreground block">Tags</span>
                <div className="flex gap-1"><Badge variant="secondary" className="text-[7px] h-3.5">ai</Badge><Badge variant="secondary" className="text-[7px] h-3.5">development</Badge></div>
              </div>
              <div>
                <span className="text-[8px] font-semibold text-muted-foreground block">Monetization</span>
                <span className="flex items-center gap-1"><DollarSign className="h-2.5 w-2.5" /> Tips enabled</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Rail — Checklist */}
        <div>
          <SectionCard title="Publish Checklist" icon={<Shield className="h-3.5 w-3.5 text-accent" />}>
            <div className="flex items-center gap-3 mb-3 text-[9px]">
              <span className="text-[hsl(var(--state-healthy))] font-semibold">{passes} passed</span>
              <span className="text-[hsl(var(--gigvora-amber))] font-semibold">{warnings} warnings</span>
              <span className="text-destructive font-semibold">{fails} failed</span>
            </div>
            <div className="space-y-1.5">
              {CHECKLIST.map(c => {
                const Icon = STATUS_ICON[c.status];
                return (
                  <div key={c.label} className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <Icon className={cn('h-3 w-3 shrink-0', STATUS_COLOR[c.status])} />
                      <span className={cn(c.status === 'pass' ? 'text-foreground' : 'font-medium')}>{c.label}</span>
                    </div>
                    {c.detail && <p className="text-[8px] text-muted-foreground mt-0.5 ml-4.5 pl-1">{c.detail}</p>}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Publish Actions */}
          <div className="mt-3 space-y-2">
            <Button
              className={cn('w-full h-10 rounded-xl gap-1', canPublish ? '' : 'opacity-50 cursor-not-allowed')}
              disabled={!canPublish}
            >
              <Send className="h-4 w-4" /> Publish Now
            </Button>
            <Button variant="outline" className="w-full h-10 rounded-xl gap-1">
              <Calendar className="h-4 w-4" /> Schedule
            </Button>
            <Button variant="ghost" className="w-full h-8 rounded-xl gap-1 text-[10px]">
              <ChevronLeft className="h-3.5 w-3.5" /> Back to Editor
            </Button>
          </div>

          {!canPublish && (
            <div className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-destructive mb-1">
                <XCircle className="h-3.5 w-3.5" /> Cannot publish
              </div>
              <p className="text-[9px] text-muted-foreground">Fix all failed checks before publishing. Warnings are optional but recommended.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
