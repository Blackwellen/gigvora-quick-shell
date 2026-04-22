import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Ticket, MessageSquare, ThumbsUp, Eye, Clock, SlidersHorizontal, Sparkles } from 'lucide-react';

const RESULTS = [
  { type: 'article', title: 'How to withdraw earnings', excerpt: 'Step-by-step guide to withdrawing your available balance via bank transfer or PayPal...', views: 4200, helpful: 96, category: 'Payments', updated: '2 days ago' },
  { type: 'article', title: 'Understanding escrow timelines', excerpt: 'Escrow funds are released upon milestone approval. Typical processing time is 3-5 business days...', views: 2800, helpful: 94, category: 'Payments', updated: '1 week ago' },
  { type: 'faq', title: 'What is escrow protection?', excerpt: 'Escrow ensures funds are held securely until work is approved...', views: 1800, helpful: 98, category: 'General', updated: '3 days ago' },
  { type: 'ticket', title: 'TKT-5201: Cannot withdraw funds', excerpt: 'Resolved — security hold cleared, withdrawal re-initiated...', views: 0, helpful: 0, category: 'My Tickets', updated: '2h ago' },
  { type: 'article', title: 'Setting up direct deposit', excerpt: 'Configure automatic withdrawals to your bank account on a weekly or monthly schedule...', views: 1200, helpful: 90, category: 'Payments', updated: '5 days ago' },
];

const typeIcons = { article: <FileText className="h-3.5 w-3.5 text-accent" />, faq: <MessageSquare className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />, ticket: <Ticket className="h-3.5 w-3.5 text-muted-foreground" /> };

export default function SupportSearchPage() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? RESULTS : RESULTS.filter(r => r.type === tab);

  return (
    <DashboardLayout topStrip={<><Search className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Support Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search help articles, FAQs, and tickets..." className="pl-8 h-9 text-xs rounded-xl" defaultValue="withdraw funds" /></div>
        <Button size="sm" className="h-9 text-[10px] rounded-xl gap-1"><Sparkles className="h-3 w-3" />AI Answer</Button>
      </div>

      <SectionCard className="!rounded-2xl mb-3 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-semibold mb-1">AI-Generated Answer</div>
            <p className="text-[9px] text-muted-foreground leading-relaxed">To withdraw funds, go to Finance Hub → Wallet → Withdraw. You need a verified account, an active payment method, and a minimum balance of $25. Bank transfers take 3-5 business days; PayPal transfers process within 24 hours. If stuck on "Processing", allow 24-48 hours or contact support.</p>
            <div className="flex gap-1 mt-1.5"><Badge variant="outline" className="text-[7px] rounded-md cursor-pointer">Source: Withdrawal Guide</Badge><Badge variant="outline" className="text-[7px] rounded-md cursor-pointer">Source: Escrow FAQ</Badge></div>
          </div>
        </div>
      </SectionCard>

      <KPIBand className="mb-3">
        <KPICard label="Results" value={String(RESULTS.length)} className="!rounded-2xl" />
        <KPICard label="Articles" value={String(RESULTS.filter(r => r.type === 'article').length)} className="!rounded-2xl" />
        <KPICard label="FAQs" value={String(RESULTS.filter(r => r.type === 'faq').length)} className="!rounded-2xl" />
        <KPICard label="Tickets" value={String(RESULTS.filter(r => r.type === 'ticket').length)} className="!rounded-2xl" />
      </KPIBand>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All</TabsTrigger>
          <TabsTrigger value="article" className="text-[10px] px-3">Articles</TabsTrigger>
          <TabsTrigger value="faq" className="text-[10px] px-3">FAQs</TabsTrigger>
          <TabsTrigger value="ticket" className="text-[10px] px-3">Tickets</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map((r, i) => (
          <SectionCard key={i} className="!rounded-2xl cursor-pointer hover:border-accent/30 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{typeIcons[r.type as keyof typeof typeIcons]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{r.title}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md capitalize">{r.type}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{r.category}</Badge>
                </div>
                <p className="text-[8px] text-muted-foreground mb-1 truncate">{r.excerpt}</p>
                <div className="flex items-center gap-3 text-[7px] text-muted-foreground">
                  {r.views > 0 && <span className="flex items-center gap-0.5"><Eye className="h-2 w-2" />{r.views.toLocaleString()}</span>}
                  {r.helpful > 0 && <span className="flex items-center gap-0.5"><ThumbsUp className="h-2 w-2" />{r.helpful}% helpful</span>}
                  <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" />{r.updated}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
