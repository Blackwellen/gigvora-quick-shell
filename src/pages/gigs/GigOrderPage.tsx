import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Clock, CheckCircle2, Package, Upload, MessageSquare, Star,
  FileText, RefreshCw, AlertTriangle, TrendingUp, Send,
  Eye, Download, RotateCcw, ChevronRight, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Mock Order Data ──
const ORDER = {
  id: 'ORD-2024-001',
  gig: 'Professional Logo Design',
  package: 'Standard',
  price: '$100',
  seller: 'Sarah Chen',
  buyer: 'Alex Kim',
  status: 'in-progress',
  ordered: 'Apr 2, 2026',
  delivery: 'Apr 7, 2026',
  revisions: { used: 1, total: 3 },
};

const TIMELINE = [
  { step: 'Order Placed', date: 'Apr 2, 10:00 AM', status: 'done', detail: 'Standard package · $100' },
  { step: 'Requirements Submitted', date: 'Apr 2, 11:30 AM', status: 'done', detail: 'Brand brief and preferences provided' },
  { step: 'In Progress', date: 'Apr 3, 9:00 AM', status: 'active', detail: 'Seller working on 3 concepts' },
  { step: 'Update: Initial sketches', date: 'Apr 4, 2:00 PM', status: 'active', detail: '3 concept sketches uploaded for feedback' },
  { step: 'Delivery', date: 'Apr 7', status: 'pending', detail: 'Expected delivery' },
  { step: 'Review & Accept', date: '', status: 'pending', detail: 'Review deliverables' },
  { step: 'Complete', date: '', status: 'pending', detail: 'Order completed' },
];

const SUBMISSIONS = [
  { id: 's1', title: 'Initial Concepts', date: 'Apr 4', files: 3, status: 'revision-requested', note: 'Love concept 2, can we try different colors?' },
  { id: 's2', title: 'Revised Concept 2', date: 'Apr 6', files: 2, status: 'pending-review', note: '' },
];

const GIG_ANALYTICS = {
  impressions: '12,450',
  clicks: '876',
  orders: '234',
  conversion: '3.2%',
  revenue: '$18,400',
  avgRating: '4.9',
  responseTime: '1.2h',
  completionRate: '98%',
};

// ── Order Timeline ──
const OrderTimeline = () => (
  <div className="space-y-0">
    {TIMELINE.map((t, i) => (
      <div key={i} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-xs',
            t.status === 'done' ? 'bg-gigvora-green/10 text-gigvora-green' :
            t.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
          )}>
            {t.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
          </div>
          {i < TIMELINE.length - 1 && <div className={cn('w-px flex-1 min-h-[32px]', t.status === 'done' ? 'bg-gigvora-green/30' : 'bg-border')} />}
        </div>
        <div className="pb-6">
          <div className="font-medium text-sm">{t.step}</div>
          {t.date && <div className="text-xs text-muted-foreground">{t.date}</div>}
          <div className="text-xs text-muted-foreground">{t.detail}</div>
        </div>
      </div>
    ))}
  </div>
);

// ── Main Page ──
const GigOrderPage: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{ORDER.gig}</h1>
            <Badge variant="secondary" className="text-xs capitalize">{ORDER.status.replace('-', ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Order {ORDER.id} · {ORDER.package} package · {ORDER.price}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /> Message Seller</Button>
          <Button variant="outline" size="sm" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Report Issue</Button>
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="mb-4">
          <TabsTrigger value="timeline">Order Timeline</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries & Revisions</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="analytics">Gig Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-4">Order Progress</h2>
                <OrderTimeline />
              </div>
              {/* Step Updates */}
              <div className="rounded-xl border bg-card p-6 mt-4">
                <h2 className="font-semibold mb-4">Step-by-Step Updates</h2>
                <div className="space-y-3">
                  {[
                    { author: 'Sarah C.', text: 'Started working on your logo concepts! Here are 3 initial directions based on your brief.', time: 'Apr 4, 2:00 PM', files: ['concept1.png', 'concept2.png', 'concept3.png'] },
                    { author: 'You', text: 'Love concept 2! Can we try it in navy blue and forest green?', time: 'Apr 4, 4:30 PM', files: [] },
                    { author: 'Sarah C.', text: 'Great choice! Working on the color variations now. Will have them ready by tomorrow.', time: 'Apr 5, 9:00 AM', files: [] },
                  ].map((u, i) => (
                    <div key={i} className="flex gap-2">
                      <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{u.author[0]}</AvatarFallback></Avatar>
                      <div className={cn('rounded-xl px-3 py-2 max-w-[80%]', u.author === 'You' ? 'bg-accent/10 rounded-tr-none ml-auto' : 'bg-muted/50 rounded-tl-none')}>
                        <div className="text-xs font-medium mb-0.5">{u.author}</div>
                        <p className="text-sm">{u.text}</p>
                        {u.files.length > 0 && (
                          <div className="flex gap-1 mt-2">{u.files.map(f => <Badge key={f} variant="outline" className="text-[10px] gap-1"><FileText className="h-2.5 w-2.5" />{f}</Badge>)}</div>
                        )}
                        <span className="text-[10px] text-muted-foreground">{u.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Seller</span><span className="font-medium">{ORDER.seller}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{ORDER.package}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-semibold">{ORDER.price}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ordered</span><span>{ORDER.ordered}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{ORDER.delivery}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Revisions</span><span>{ORDER.revisions.used}/{ORDER.revisions.total}</span></div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full" size="sm"><Upload className="h-3.5 w-3.5 mr-1" /> Deliver Work</Button>
                  <Button variant="outline" className="w-full" size="sm"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Request Revision</Button>
                  <Button variant="outline" className="w-full" size="sm">Extend Delivery</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deliveries">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Delivery Center</h2>
            <div className="space-y-4">
              {SUBMISSIONS.map(s => (
                <div key={s.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-accent" />
                      <span className="font-medium text-sm">{s.title}</span>
                      <Badge variant="secondary" className="text-xs">{s.files} files</Badge>
                    </div>
                    <Badge className={cn('text-xs', s.status === 'revision-requested' ? 'bg-gigvora-amber/10 text-gigvora-amber' : 'bg-accent/10 text-accent')}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{s.date}</p>
                  {s.note && <p className="text-sm bg-muted/30 rounded-lg px-3 py-2 mb-2">"{s.note}"</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Eye className="h-3 w-3" /> Preview</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Download className="h-3 w-3" /> Download</Button>
                    {s.status === 'pending-review' && <Button size="sm" className="h-7 text-xs gap-1 ml-auto"><CheckCircle2 className="h-3 w-3" /> Accept</Button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Revision Center</h2>
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30">
              <div className="text-center"><div className="text-lg font-bold">{ORDER.revisions.used}</div><div className="text-xs text-muted-foreground">Used</div></div>
              <div className="text-center"><div className="text-lg font-bold">{ORDER.revisions.total - ORDER.revisions.used}</div><div className="text-xs text-muted-foreground">Remaining</div></div>
              <div className="text-center"><div className="text-lg font-bold">{ORDER.revisions.total}</div><div className="text-xs text-muted-foreground">Total</div></div>
            </div>
            <Button className="w-full" variant="outline"><RotateCcw className="h-4 w-4 mr-2" /> Request Revision</Button>
          </div>
        </TabsContent>

        <TabsContent value="requirements">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Requirements</h2>
            <div className="space-y-4">
              {[
                { q: 'Brand Name', a: 'LaunchPad AI' },
                { q: 'Industry', a: 'Technology / AI SaaS' },
                { q: 'Style Preference', a: 'Modern, minimal, tech-forward' },
                { q: 'Color Preferences', a: 'Blues and greens, avoid red' },
                { q: 'Reference Logos', a: '3 reference images uploaded' },
                { q: 'Additional Notes', a: 'The logo should work on both light and dark backgrounds. Needs to be recognizable at small sizes.' },
              ].map(r => (
                <div key={r.q}>
                  <div className="text-sm font-medium mb-1">{r.q}</div>
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">{r.a}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(GIG_ANALYTICS).map(([key, val]) => (
              <div key={key} className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-xl font-bold">{val}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Performance Overview</h3>
            <div className="h-48 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">Charts and analytics visualizations</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GigOrderPage;
