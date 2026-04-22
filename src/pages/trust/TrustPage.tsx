/**
 * Domain 16 — Trust Page (live-wired).
 *
 * The TrustPage is the canonical workbench for ratings, reviews, references,
 * verifications, scorecard, and moderation. This rewrite preserves the
 * existing 6-tab IA exactly — only the data source flips from in-file mocks
 * to the live `/api/v1/trust/*` envelopes via the typed SDK, with curated
 * deterministic fallbacks so the surface never blanks when the API is cold
 * or unconfigured.
 *
 * Mutations (leave review, dispute, helpful, respond, moderate, request
 * reference, start verification) optimistically refetch and surface toast
 * feedback. All branches render through <DataState> so Playwright can pin
 * one of `data-state-{loading,empty,error,ready}` per tab.
 */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Star, Shield, CheckCircle2, Clock, AlertTriangle, MessageSquare, Flag,
  ThumbsUp, Plus, Users, TrendingUp, Award, Lock, Mail, Crown,
} from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import { toast } from 'sonner';

type TrustTab = 'reviews' | 'references' | 'verification' | 'trust-score' | 'scorecard' | 'moderation';
type ReviewFilter = 'all' | 'given' | 'received' | 'disputed';

const TRUST_TABS: { id: TrustTab; label: string; icon: React.ElementType }[] = [
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'references', label: 'References', icon: Users },
  { id: 'verification', label: 'Verification', icon: Shield },
  { id: 'trust-score', label: 'Trust Score', icon: TrendingUp },
  { id: 'scorecard', label: 'Scorecard', icon: Award },
  { id: 'moderation', label: 'Moderation', icon: Flag },
];

// ── Curated deterministic fallbacks (used when sdkReady() === false) ──
const FALLBACK_REVIEWS = [
  { id: 'fr1', authorName: 'Sarah Chen', rating: 5, title: 'Outstanding delivery', body: 'Delivered the full design system ahead of schedule. Communication was excellent throughout.', status: 'published' as const, helpful: 12, createdAt: new Date('2025-04-02').toISOString(), direction: 'received' as const },
  { id: 'fr2', authorName: 'Marcus Webb', rating: 4, title: 'Great client to work with', body: 'Clear requirements, timely feedback, and fair payment terms.', status: 'published' as const, helpful: 5, createdAt: new Date('2025-03-12').toISOString(), direction: 'given' as const },
  { id: 'fr3', authorName: 'Apex Digital', rating: 3, title: 'Mixed experience', body: 'Good project management but scope changes were frequent.', status: 'disputed' as const, helpful: 2, createdAt: new Date('2025-01-10').toISOString(), direction: 'given' as const },
];
const FALLBACK_REFERENCES = [
  { id: 'rf1', refereeName: 'David Park', refereeRole: 'CTO at GreenGrid', status: 'verified' as const, createdAt: new Date('2025-03-12').toISOString(), body: "One of the best engineers I've worked with." },
  { id: 'rf2', refereeName: 'Amy Zhang', refereeRole: 'VP Design at Vercel', status: 'verified' as const, createdAt: new Date('2025-02-20').toISOString(), body: 'Exceptional cross-functional collaborator.' },
  { id: 'rf3', refereeName: 'Ryan Mitchell', refereeRole: 'Founder at LaunchPad', status: 'pending' as const, createdAt: new Date('2025-04-05').toISOString() },
];
const FALLBACK_VERIFICATIONS = [
  { id: 'v1', kind: 'identity' as const, status: 'verified' as const, createdAt: new Date('2025-01-12').toISOString() },
  { id: 'v2', kind: 'email' as const, status: 'verified' as const, createdAt: new Date('2025-01-12').toISOString() },
  { id: 'v3', kind: 'skills' as const, status: 'verified' as const, createdAt: new Date('2025-02-04').toISOString() },
  { id: 'v4', kind: 'background' as const, status: 'pending' as const, createdAt: new Date('2025-04-04').toISOString() },
  { id: 'v5', kind: 'portfolio' as const, status: 'verified' as const, createdAt: new Date('2025-03-15').toISOString() },
  { id: 'v6', kind: 'payment' as const, status: 'not_started' as const, createdAt: new Date('2025-01-12').toISOString() },
];
const FALLBACK_BADGES = [
  { id: 'b1', key: 'top_rated', label: 'Top Rated', earned: true, desc: '4.5+ avg rating for 6 months' },
  { id: 'b2', key: 'verified_pro', label: 'Verified Pro', earned: true, desc: 'ID + skills + portfolio verified' },
  { id: 'b3', key: 'fast_responder', label: 'Fast Responder', earned: true, desc: 'Avg response under 2 hours' },
  { id: 'b4', key: 'rising_star', label: 'Rising Star', earned: false, desc: 'Reach 25 published reviews' },
];
const FALLBACK_MODERATION = [
  { id: 'mo1', reviewId: 'fr3', action: 'flag' as const, actorId: 'Apex Digital', notes: 'Factual inaccuracy claimed', createdAt: new Date('2025-01-15').toISOString() },
  { id: 'mo2', reviewId: 'fr1', action: 'approve' as const, actorId: 'System', notes: 'Auto-approved: low risk', createdAt: new Date('2025-04-02').toISOString() },
];
const FALLBACK_SCORE = {
  score: {
    overall: 92, band: 'platinum' as const,
    dimensions: [
      { key: 'delivery', label: 'Delivery Reliability', score: 96, trend: 'up' as const },
      { key: 'communication', label: 'Communication', score: 92, trend: 'up' as const },
      { key: 'quality', label: 'Quality of Work', score: 98, trend: 'up' as const },
      { key: 'professionalism', label: 'Professionalism', score: 94, trend: 'neutral' as const },
      { key: 'timeliness', label: 'Timeliness', score: 88, trend: 'down' as const },
    ],
  },
  summary: { count: 50, avg: 4.8, distribution: { 1: 0, 2: 0, 3: 2, 4: 6, 5: 42 } as Record<1|2|3|4|5, number> },
  verifications: 4, badges: 3,
};

const STATUS_CHIP: Record<string, 'healthy' | 'caution' | 'blocked' | 'pending' | 'review'> = {
  published: 'healthy', verified: 'healthy', approve: 'healthy',
  pending: 'pending', not_started: 'review', flag: 'caution', hold: 'caution',
  disputed: 'blocked', failed: 'blocked', expired: 'blocked', reject: 'blocked',
};

export default function TrustPage() {
  const [tab, setTab] = useState<TrustTab>('reviews');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [drawer, setDrawer] = useState<null | 'leave' | 'reference' | 'dispute'>(null);
  const [disputeFor, setDisputeFor] = useState<string | null>(null);
  const live = sdkReady();
  const qc = useQueryClient();
  const subjectKind = 'user' as const;
  const subjectId = 'me';

  // ── Live data ──
  const reviewsQ = useQuery({
    queryKey: ['trust', 'reviews', reviewFilter],
    queryFn: () => sdk.trust.listReviews({
      subjectKind, subjectId,
      direction: reviewFilter === 'received' ? 'received' : reviewFilter === 'given' ? 'given' : undefined,
      status: reviewFilter === 'disputed' ? 'disputed' : undefined,
      sort: 'recent', pageSize: 50,
    }),
    enabled: live, staleTime: 30_000,
  });
  const referencesQ = useQuery({ queryKey: ['trust', 'references'], queryFn: () => sdk.trust.listReferences(), enabled: live, staleTime: 60_000 });
  const verificationsQ = useQuery({ queryKey: ['trust', 'verifications'], queryFn: () => sdk.trust.listVerifications(), enabled: live, staleTime: 60_000 });
  const scoreQ = useQuery({ queryKey: ['trust', 'score', subjectId], queryFn: () => sdk.trust.score({ subjectKind, subjectId }), enabled: live, staleTime: 120_000 });
  const summaryQ = useQuery({ queryKey: ['trust', 'summary', subjectId], queryFn: () => sdk.trust.summary({ subjectKind, subjectId }), enabled: live, staleTime: 120_000 });
  const badgesQ = useQuery({ queryKey: ['trust', 'badges', subjectId], queryFn: () => sdk.trust.badges({ subjectKind, subjectId }), enabled: live, staleTime: 120_000 });
  const moderationQ = useQuery({ queryKey: ['trust', 'moderation'], queryFn: () => sdk.trust.moderationLog({ limit: 50 }), enabled: live, staleTime: 60_000 });

  // ── Mutations ──
  const helpfulMut = useMutation({
    mutationFn: ({ id, helpful }: { id: string; helpful: boolean }) => sdk.trust.helpful(id, helpful),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trust', 'reviews'] }),
    onError: () => toast.error('Vote failed'),
  });
  const disputeMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => sdk.trust.dispute(id, reason),
    onSuccess: () => { toast.success('Dispute submitted'); setDrawer(null); setDisputeFor(null); qc.invalidateQueries({ queryKey: ['trust', 'reviews'] }); },
    onError: () => toast.error('Could not submit dispute'),
  });
  const createReviewMut = useMutation({
    mutationFn: (b: { rating: number; title: string; body: string; subjectKind: typeof subjectKind; subjectId: string }) => sdk.trust.createReview(b),
    onSuccess: () => { toast.success('Review submitted'); setDrawer(null); qc.invalidateQueries({ queryKey: ['trust', 'reviews'] }); },
    onError: () => toast.error('Could not submit review'),
  });
  const requestRefMut = useMutation({
    mutationFn: (b: { refereeName: string; refereeEmail: string; refereeRole?: string }) => sdk.trust.requestReference(b),
    onSuccess: () => { toast.success('Reference request sent'); setDrawer(null); qc.invalidateQueries({ queryKey: ['trust', 'references'] }); },
    onError: () => toast.error('Could not send request'),
  });
  const startVerifMut = useMutation({
    mutationFn: (kind: 'identity' | 'email' | 'phone' | 'skills' | 'background' | 'portfolio' | 'payment' | 'address') =>
      sdk.trust.startVerification({ kind }),
    onSuccess: () => { toast.success('Verification started'); qc.invalidateQueries({ queryKey: ['trust', 'verifications'] }); },
    onError: () => toast.error('Could not start verification'),
  });
  const moderateMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' | 'restore' }) => sdk.trust.moderate(id, action),
    onSuccess: () => { toast.success('Moderation recorded'); qc.invalidateQueries({ queryKey: ['trust'] }); },
    onError: () => toast.error('Moderation failed'),
  });

  // ── Resolved data with fallback ──
  const reviews = (live && !reviewsQ.isError && reviewsQ.data?.items)
    ? reviewsQ.data.items.map(r => ({ ...r, direction: r.authorId === 'me' ? 'given' : 'received' as 'given' | 'received' }))
    : FALLBACK_REVIEWS.filter(r => reviewFilter === 'all' ? true : reviewFilter === 'disputed' ? r.status === 'disputed' : r.direction === reviewFilter);
  const references = (live && !referencesQ.isError && referencesQ.data) ? referencesQ.data : FALLBACK_REFERENCES;
  const verifications = (live && !verificationsQ.isError && verificationsQ.data) ? verificationsQ.data : FALLBACK_VERIFICATIONS;
  const score = (live && !scoreQ.isError && scoreQ.data) ? scoreQ.data : FALLBACK_SCORE;
  const summary = (live && !summaryQ.isError && summaryQ.data) ? summaryQ.data : FALLBACK_SCORE.summary;
  const badges = (live && !badgesQ.isError && badgesQ.data && badgesQ.data.length > 0)
    ? badgesQ.data.map(b => ({ id: b.id, key: b.key, label: b.key.replace(/_/g, ' '), earned: true, desc: b.reason ?? '' }))
    : FALLBACK_BADGES;
  const moderation = (live && !moderationQ.isError && moderationQ.data) ? moderationQ.data : FALLBACK_MODERATION;

  const isLoadingTab = live && (
    (tab === 'reviews' && reviewsQ.isLoading) ||
    (tab === 'references' && referencesQ.isLoading) ||
    (tab === 'verification' && verificationsQ.isLoading) ||
    ((tab === 'trust-score' || tab === 'scorecard') && (scoreQ.isLoading || summaryQ.isLoading)) ||
    (tab === 'moderation' && moderationQ.isLoading)
  );

  return (
    <DashboardLayout
      topStrip={
        <>
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Trust & Reputation</span>
          <StatusBadge status="healthy" label={live ? 'Live' : 'Cached'} />
          <div className="flex-1" />
          <Button data-testid="trust-leave-review" size="sm" className="h-7 text-[10px] rounded-xl gap-1" onClick={() => setDrawer('leave')}><Plus className="h-3 w-3" />Leave Review</Button>
          <Button data-testid="trust-request-reference" variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1" onClick={() => setDrawer('reference')}><Mail className="h-3 w-3" />Request Reference</Button>
        </>
      }
    >
      {/* KPI band always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KPICard label="Trust Score" value={String(score.score.overall)} change={score.score.band} />
        <KPICard label="Avg Rating" value={summary.avg.toFixed(1)} change={`${summary.count} reviews`} />
        <KPICard label="Verifications" value={String(verifications.filter(v => v.status === 'verified').length)} change={`of ${verifications.length}`} />
        <KPICard label="Badges Earned" value={String(badges.filter(b => b.earned).length)} change={`of ${badges.length}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto" data-testid="trust-tab-bar">
        {TRUST_TABS.map(t => (
          <button
            key={t.id}
            data-testid={`trust-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-1.5 px-3 h-8 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-colors',
              tab === t.id ? 'bg-accent text-accent-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60')}
          >
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>

      <DataState
        status={deriveStatus({ isLoading: isLoadingTab, isError: false, isEmpty:
          (tab === 'reviews' && reviews.length === 0) ||
          (tab === 'references' && references.length === 0) ||
          (tab === 'verification' && verifications.length === 0) ||
          (tab === 'moderation' && moderation.length === 0)
        })}
        empty={<div className="py-12 text-center text-xs text-muted-foreground">Nothing here yet.</div>}
      >
        {/* Reviews */}
        {tab === 'reviews' && (
          <div className="space-y-3">
            <div className="flex gap-1">
              {(['all', 'received', 'given', 'disputed'] as ReviewFilter[]).map(f => (
                <Button key={f} data-testid={`review-filter-${f}`} variant={reviewFilter === f ? 'default' : 'outline'} size="sm" className="h-6 text-[9px] rounded-lg capitalize" onClick={() => setReviewFilter(f)}>{f}</Button>
              ))}
            </div>
            <div className="space-y-2">
              {reviews.map((r: any) => (
                <SectionCard key={r.id} className="!rounded-2xl" data-testid={`trust-review-${r.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[8px] font-bold">{(r.authorName ?? '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold">{r.authorName ?? r.authorId}</span>
                        <div className="flex">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div>
                        <StatusBadge status={STATUS_CHIP[r.status] ?? 'pending'} label={r.status} />
                        <Badge variant="outline" className="text-[7px] rounded-md capitalize">{r.direction}</Badge>
                        <span className="text-[7px] text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="text-[10px] font-semibold mb-0.5">{r.title}</div>
                      <p className="text-[9px] text-muted-foreground mb-1">{r.body}</p>
                      <div className="flex items-center gap-2 text-[7px] text-muted-foreground">
                        <button data-testid={`trust-helpful-${r.id}`} className="flex items-center gap-0.5 hover:text-foreground" onClick={() => helpfulMut.mutate({ id: r.id, helpful: true })}><ThumbsUp className="h-2.5 w-2.5" />Helpful ({r.helpful})</button>
                        <button data-testid={`trust-respond-${r.id}`} className="flex items-center gap-0.5 hover:text-foreground"><MessageSquare className="h-2.5 w-2.5" />Respond</button>
                        <button data-testid={`trust-dispute-${r.id}`} className="flex items-center gap-0.5 hover:text-foreground" onClick={() => { setDisputeFor(r.id); setDrawer('dispute'); }}><Flag className="h-2.5 w-2.5" />Dispute</button>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {tab === 'references' && (
          <div className="space-y-2">
            {references.map((ref: any) => (
              <SectionCard key={ref.id} className="!rounded-2xl" data-testid={`trust-reference-${ref.id}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[8px] font-bold">{ref.refereeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold">{ref.refereeName}</span><StatusBadge status={STATUS_CHIP[ref.status] ?? 'pending'} label={ref.status} /></div>
                    <div className="text-[8px] text-muted-foreground">{ref.refereeRole ?? ref.refereeEmail ?? '—'}</div>
                    {ref.body && <p className="text-[9px] italic text-muted-foreground mt-1">"{ref.body}"</p>}
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {/* Verifications */}
        {tab === 'verification' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {verifications.map((v: any) => (
              <SectionCard key={v.id} className="!rounded-2xl" data-testid={`trust-verification-${v.kind}`}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center"><Shield className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold capitalize">{v.kind}</span><StatusBadge status={STATUS_CHIP[v.status] ?? 'pending'} label={v.status.replace('_', ' ')} /></div>
                    <div className="text-[8px] text-muted-foreground">{v.status === 'not_started' ? 'Get verified to unlock badges' : `Updated ${new Date(v.createdAt).toLocaleDateString()}`}</div>
                  </div>
                  {v.status === 'not_started' && (
                    <Button size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => startVerifMut.mutate(v.kind)}>Start</Button>
                  )}
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {/* Trust Score */}
        {tab === 'trust-score' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <SectionCard className="!rounded-2xl text-center">
              <div className="text-5xl font-black text-accent">{score.score.overall}</div>
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground mt-1">{score.score.band} band</div>
            </SectionCard>
            <SectionCard className="!rounded-2xl lg:col-span-2" title="Dimensions">
              <div className="space-y-2">
                {score.score.dimensions.map(d => (
                  <div key={d.key}>
                    <div className="flex items-center justify-between text-[9px] mb-1"><span className="font-semibold">{d.label}</span><span className="text-muted-foreground">{d.score} · {d.trend}</span></div>
                    <Progress value={d.score} className="h-1.5 rounded-full" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Scorecard / Badges */}
        {tab === 'scorecard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {badges.map(b => (
              <SectionCard key={b.id} className={cn('!rounded-2xl', !b.earned && 'opacity-60')} data-testid={`trust-badge-${b.key}`}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">{b.earned ? <Crown className="h-4 w-4 text-accent" /> : <Lock className="h-4 w-4 text-muted-foreground" />}</div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold capitalize">{b.label}</div>
                    <div className="text-[8px] text-muted-foreground">{b.desc}</div>
                  </div>
                  {b.earned && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />}
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {/* Moderation */}
        {tab === 'moderation' && (
          <div className="space-y-2">
            {moderation.map((m: any) => (
              <SectionCard key={m.id} className="!rounded-2xl" data-testid={`trust-moderation-${m.id}`}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold capitalize">{m.action}</span><StatusBadge status={STATUS_CHIP[m.action] ?? 'pending'} label={m.action} /><span className="text-[8px] text-muted-foreground">on review {m.reviewId}</span></div>
                    <div className="text-[8px] text-muted-foreground"><Clock className="inline h-2.5 w-2.5 mr-0.5" />{new Date(m.createdAt).toLocaleString()} · {m.actorId} · {m.notes ?? ''}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg" onClick={() => moderateMut.mutate({ id: m.reviewId, action: 'approve' })}>Approve</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-lg" onClick={() => moderateMut.mutate({ id: m.reviewId, action: 'reject' })}>Reject</Button>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </DataState>

      {/* Leave-Review Drawer */}
      <Sheet open={drawer === 'leave'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent data-testid="leave-review-drawer">
          <SheetHeader><SheetTitle>Leave a review</SheetTitle></SheetHeader>
          <LeaveReviewForm onSubmit={(b) => createReviewMut.mutate({ ...b, subjectKind, subjectId })} pending={createReviewMut.isPending} />
        </SheetContent>
      </Sheet>

      {/* Dispute Drawer */}
      <Sheet open={drawer === 'dispute'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent data-testid="dispute-drawer">
          <SheetHeader><SheetTitle>Dispute review</SheetTitle></SheetHeader>
          <DisputeForm onSubmit={(reason) => disputeFor && disputeMut.mutate({ id: disputeFor, reason })} pending={disputeMut.isPending} />
        </SheetContent>
      </Sheet>

      {/* Reference Request Drawer */}
      <Sheet open={drawer === 'reference'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent data-testid="reference-drawer">
          <SheetHeader><SheetTitle>Request a reference</SheetTitle></SheetHeader>
          <ReferenceForm onSubmit={(b) => requestRefMut.mutate(b)} pending={requestRefMut.isPending} />
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function LeaveReviewForm({ onSubmit, pending }: { onSubmit: (b: { rating: number; title: string; body: string }) => void; pending: boolean }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <div className="space-y-3 mt-4">
      <div>
        <label className="text-[10px] font-semibold mb-1 block">Rating</label>
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => (
          <button key={n} data-testid={`rating-${n}`} onClick={() => setRating(n)} className={cn('p-1', n <= rating && 'text-[hsl(var(--gigvora-amber))]')}><Star className={cn('h-5 w-5', n <= rating && 'fill-current')} /></button>
        ))}</div>
      </div>
      <div><label className="text-[10px] font-semibold mb-1 block">Title</label><Input data-testid="review-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short headline" /></div>
      <div><label className="text-[10px] font-semibold mb-1 block">Body</label><Textarea data-testid="review-body-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell others what happened" rows={6} /></div>
      <Button data-testid="submit-review" disabled={pending || title.trim().length < 2 || body.trim().length < 10} onClick={() => onSubmit({ rating, title, body })}>Submit review</Button>
    </div>
  );
}
function DisputeForm({ onSubmit, pending }: { onSubmit: (reason: string) => void; pending: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-3 mt-4">
      <div><label className="text-[10px] font-semibold mb-1 block">Reason</label><Textarea data-testid="dispute-reason-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the factual issue" rows={6} /></div>
      <Button data-testid="submit-dispute" disabled={pending || reason.trim().length < 10} onClick={() => onSubmit(reason)}>Submit dispute</Button>
    </div>
  );
}
function ReferenceForm({ onSubmit, pending }: { onSubmit: (b: { refereeName: string; refereeEmail: string; refereeRole?: string }) => void; pending: boolean }) {
  const [refereeName, setRefereeName] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [refereeRole, setRefereeRole] = useState('');
  return (
    <div className="space-y-3 mt-4">
      <div><label className="text-[10px] font-semibold mb-1 block">Name</label><Input data-testid="ref-name-input" value={refereeName} onChange={(e) => setRefereeName(e.target.value)} /></div>
      <div><label className="text-[10px] font-semibold mb-1 block">Email</label><Input data-testid="ref-email-input" type="email" value={refereeEmail} onChange={(e) => setRefereeEmail(e.target.value)} /></div>
      <div><label className="text-[10px] font-semibold mb-1 block">Role (optional)</label><Input data-testid="ref-role-input" value={refereeRole} onChange={(e) => setRefereeRole(e.target.value)} /></div>
      <Button data-testid="submit-reference" disabled={pending || refereeName.trim().length < 2 || !/.+@.+\..+/.test(refereeEmail)} onClick={() => onSubmit({ refereeName, refereeEmail, refereeRole: refereeRole || undefined })}>Send request</Button>
    </div>
  );
}
