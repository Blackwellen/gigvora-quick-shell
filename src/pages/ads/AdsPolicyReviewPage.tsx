import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Clock, Eye,
  FileText, MessageSquare, MoreHorizontal, Filter, Star, RefreshCw,
} from 'lucide-react';

type ReviewStatus = 'approved' | 'rejected' | 'in-review' | 'changes-required' | 'appealed';

interface PolicyReview {
  id: string; adName: string; campaignName: string; status: ReviewStatus;
  qualityScore: number; submittedAt: string; reviewedAt?: string;
  issues: string[]; feedback?: string; category: string;
}

const REVIEWS: PolicyReview[] = [
  { id: 'PR1', adName: 'Enterprise Platform Hero — V3', campaignName: 'Q2 Brand Awareness', status: 'approved', qualityScore: 92, submittedAt: '2d ago', reviewedAt: '1d ago', issues: [], category: 'Brand' },
  { id: 'PR2', adName: 'Flash Sale Banner', campaignName: 'Spring Promo', status: 'rejected', qualityScore: 34, submittedAt: '1d ago', reviewedAt: '6h ago', issues: ['Misleading claim: "guaranteed results"', 'Missing disclaimer for pricing'], feedback: 'Remove absolute guarantees. Add pricing terms link.', category: 'Promotional' },
  { id: 'PR3', adName: 'Hiring Campaign — Engineers', campaignName: 'Engineering Recruitment', status: 'in-review', qualityScore: 0, submittedAt: '3h ago', issues: [], category: 'Recruitment' },
  { id: 'PR4', adName: 'Customer Testimonial Carousel', campaignName: 'Social Proof', status: 'changes-required', qualityScore: 68, submittedAt: '3d ago', reviewedAt: '2d ago', issues: ['Testimonial needs verification badge', 'Image quality below minimum resolution'], feedback: 'Please add verified badge to testimonial quotes and re-upload images at 1200×628 minimum.', category: 'Social Proof' },
  { id: 'PR5', adName: 'AI Features Spotlight', campaignName: 'Product Launch', status: 'appealed', qualityScore: 55, submittedAt: '5d ago', reviewedAt: '4d ago', issues: ['AI capability claims require substantiation'], feedback: 'Provide documentation backing AI performance claims.', category: 'Product' },
];

const STATUS_MAP: Record<ReviewStatus, { color: string; icon: React.ElementType; label: string }> = {
  approved: { color: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]', icon: XCircle, label: 'Rejected' },
  'in-review': { color: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]', icon: Clock, label: 'In Review' },
  'changes-required': { color: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]', icon: AlertTriangle, label: 'Changes Required' },
  appealed: { color: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]', icon: MessageSquare, label: 'Appealed' },
};

const AdsPolicyReviewPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const filtered = REVIEWS.filter(r => statusFilter === 'all' || r.status === statusFilter);

  const topStrip = (
    <>
      <Shield className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Ads — Policy, Review & Quality Center</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'in-review', 'changes-required', 'rejected', 'approved'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={cn('px-2 py-1 rounded-lg text-[9px] font-medium transition-colors', statusFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {f === 'all' ? 'All' : f === 'in-review' ? 'Pending' : f === 'changes-required' ? 'Changes' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Review Summary" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {Object.entries(STATUS_MAP).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 w-20 justify-center rounded-lg', color)}>{label}</Badge>
              <span className="font-semibold">{REVIEWS.filter(r => r.status === key).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Policy Guidelines" className="!rounded-2xl">
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div>• No misleading claims</div>
          <div>• Min image resolution: 1200×628</div>
          <div>• Testimonials need verification</div>
          <div>• AI claims need substantiation</div>
          <div>• Pricing must include terms link</div>
        </div>
      </SectionCard>
    </div>
  );

  const avgQuality = Math.round(REVIEWS.filter(r => r.qualityScore > 0).reduce((s, r) => s + r.qualityScore, 0) / REVIEWS.filter(r => r.qualityScore > 0).length);

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Reviews" value={String(REVIEWS.length)} change="All time" className="!rounded-2xl" />
        <KPICard label="Approval Rate" value={`${Math.round(REVIEWS.filter(r => r.status === 'approved').length / REVIEWS.length * 100)}%`} change="Last 30 days" className="!rounded-2xl" />
        <KPICard label="Avg Quality Score" value={String(avgQuality)} change="Out of 100" className="!rounded-2xl" />
        <KPICard label="Pending Review" value={String(REVIEWS.filter(r => r.status === 'in-review').length)} change="In queue" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(review => {
          const st = STATUS_MAP[review.status];
          const Icon = st.icon;
          return (
            <div key={review.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-2.5">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', st.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold truncate">{review.adName}</span>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', st.color)}>{st.label}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{review.campaignName}</span>
                    <span>·</span>
                    <span>{review.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Submitted {review.submittedAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.qualityScore > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className={cn('h-3 w-3', review.qualityScore >= 70 ? 'text-[hsl(var(--state-healthy))]' : review.qualityScore >= 40 ? 'text-[hsl(var(--gigvora-amber))]' : 'text-[hsl(var(--state-blocked))]')} />
                      <span className="text-[10px] font-bold">{review.qualityScore}</span>
                    </div>
                  )}
                  {review.status === 'rejected' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><RefreshCw className="h-3 w-3" />Resubmit</Button>}
                  {review.status === 'changes-required' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><FileText className="h-3 w-3" />Fix</Button>}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              {review.issues.length > 0 && (
                <div className="rounded-xl bg-[hsl(var(--state-blocked)/0.05)] border border-[hsl(var(--state-blocked)/0.15)] p-2.5 mb-2">
                  <div className="text-[9px] font-semibold text-[hsl(var(--state-blocked))] mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Policy Issues</div>
                  <ul className="space-y-0.5">
                    {review.issues.map((issue, i) => (
                      <li key={i} className="text-[9px] text-muted-foreground flex items-start gap-1">
                        <span className="text-[hsl(var(--state-blocked))] mt-0.5">•</span>{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {review.feedback && (
                <div className="rounded-xl bg-muted/30 p-2.5">
                  <div className="text-[9px] font-semibold mb-0.5 flex items-center gap-1"><MessageSquare className="h-3 w-3 text-muted-foreground" />Reviewer Feedback</div>
                  <div className="text-[9px] text-muted-foreground leading-relaxed">{review.feedback}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default AdsPolicyReviewPage;
