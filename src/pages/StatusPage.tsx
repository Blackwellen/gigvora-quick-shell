import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageSEO } from '@/components/seo/PageSEO';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, Activity,
  Globe, Server, Database, Shield, Zap, RefreshCw,
  ArrowLeft, ExternalLink,
} from 'lucide-react';

const SERVICES = [
  { name: 'Platform Core', desc: 'Authentication, profiles, and core APIs', status: 'operational' as const, uptime: '99.99%' },
  { name: 'Feed & Social', desc: 'News feed, posts, comments, and reactions', status: 'operational' as const, uptime: '99.98%' },
  { name: 'Jobs & Recruitment', desc: 'Job postings, applications, ATS pipeline', status: 'operational' as const, uptime: '99.97%' },
  { name: 'Gigs & Services', desc: 'Marketplace, orders, and delivery workflows', status: 'operational' as const, uptime: '99.99%' },
  { name: 'Messaging & Inbox', desc: 'Direct messages, group chats, and channels', status: 'operational' as const, uptime: '99.96%' },
  { name: 'Payments & Escrow', desc: 'Stripe integration, payouts, and escrow', status: 'operational' as const, uptime: '99.99%' },
  { name: 'Media & Streaming', desc: 'Video, podcasts, webinars, and live rooms', status: 'operational' as const, uptime: '99.95%' },
  { name: 'AI Services', desc: 'AI assistants, matching, and content tools', status: 'operational' as const, uptime: '99.92%' },
  { name: 'Search & Discovery', desc: 'Global search, filters, and recommendations', status: 'operational' as const, uptime: '99.98%' },
  { name: 'Notifications', desc: 'Push, email, and in-app notifications', status: 'operational' as const, uptime: '99.97%' },
  { name: 'File Storage & CDN', desc: 'Asset uploads, file delivery, and CDN', status: 'operational' as const, uptime: '99.99%' },
  { name: 'Enterprise Connect', desc: 'B2B networking, procurement, and intros', status: 'operational' as const, uptime: '99.98%' },
  { name: 'Recruiter Pro', desc: 'ATS, talent search, and hiring workflows', status: 'operational' as const, uptime: '99.97%' },
  { name: 'Sales Navigator', desc: 'Lead discovery, CRM, and outreach', status: 'operational' as const, uptime: '99.96%' },
  { name: 'Gigvora Ads', desc: 'Ad campaigns, targeting, and analytics', status: 'operational' as const, uptime: '99.95%' },
];

const STATUS_CONFIG = {
  operational: { icon: CheckCircle2, label: 'Operational', color: 'text-[hsl(var(--state-healthy))]', bg: 'bg-[hsl(var(--state-healthy))]/10' },
  degraded: { icon: AlertTriangle, label: 'Degraded', color: 'text-[hsl(var(--gigvora-amber))]', bg: 'bg-[hsl(var(--gigvora-amber))]/10' },
  outage: { icon: XCircle, label: 'Major Outage', color: 'text-destructive', bg: 'bg-destructive/10' },
  maintenance: { icon: Clock, label: 'Maintenance', color: 'text-[hsl(var(--gigvora-blue))]', bg: 'bg-[hsl(var(--gigvora-blue))]/10' },
};

const INCIDENTS = [
  { date: 'Apr 12, 2026', title: 'Resolved — Elevated API latency', desc: 'Brief latency increase in search APIs resolved within 12 minutes. No data loss.', status: 'resolved' as const, duration: '12 min' },
  { date: 'Apr 8, 2026', title: 'Resolved — Payment processing delay', desc: 'Stripe webhook delivery delayed by ~5 minutes. All payments processed successfully.', status: 'resolved' as const, duration: '18 min' },
  { date: 'Apr 2, 2026', title: 'Scheduled — Infrastructure upgrade', desc: 'Database cluster upgrade completed with zero downtime.', status: 'completed' as const, duration: '45 min' },
];

const UPTIME_DAYS = Array.from({ length: 90 }, (_, i) => ({
  day: i,
  status: Math.random() > 0.02 ? 'up' : Math.random() > 0.5 ? 'degraded' : 'down',
}));

export default function StatusPage() {
  const allOperational = SERVICES.every(s => s.status === 'operational');

  return (
    <div className="min-h-screen bg-background">
      <PageSEO title="System Status — Gigvora" description="Real-time platform health, uptime metrics, and incident history for all Gigvora services." />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                <h1 className="text-lg font-bold">Gigvora System Status</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] h-7 rounded-xl gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>

          {/* Overall status banner */}
          <div className={cn(
            'rounded-2xl p-5 border flex items-center gap-4',
            allOperational
              ? 'bg-[hsl(var(--state-healthy))]/5 border-[hsl(var(--state-healthy))]/20'
              : 'bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/20'
          )}>
            {allOperational ? (
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--state-healthy))]" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-[hsl(var(--gigvora-amber))]" />
            )}
            <div>
              <h2 className="text-lg font-bold">
                {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Last updated: {new Date().toLocaleString()} · Overall uptime: 99.97%
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 90-day uptime bar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">90-Day Uptime</h3>
            <span className="text-[10px] text-muted-foreground">99.97% overall</span>
          </div>
          <div className="flex gap-px rounded-lg overflow-hidden">
            {UPTIME_DAYS.map((d, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-8 min-w-[3px] transition-all hover:opacity-75',
                  d.status === 'up' ? 'bg-[hsl(var(--state-healthy))]' :
                  d.status === 'degraded' ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-destructive'
                )}
                title={`Day ${90 - i}: ${d.status}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </section>

        {/* Service list */}
        <section>
          <h3 className="text-sm font-bold mb-3">Services</h3>
          <div className="rounded-2xl border bg-card divide-y">
            {SERVICES.map(s => {
              const cfg = STATUS_CONFIG[s.status];
              return (
                <div key={s.name} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <cfg.icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold">{s.name}</div>
                    <div className="text-[9px] text-muted-foreground">{s.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={cn('text-[7px] border-0 rounded-lg', cfg.bg, cfg.color)}>{cfg.label}</Badge>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{s.uptime} uptime</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Metrics */}
        <section>
          <h3 className="text-sm font-bold mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'API Latency', value: '42ms', icon: Zap, desc: 'p95 response time' },
              { label: 'CDN Hit Rate', value: '99.4%', icon: Globe, desc: 'Cache efficiency' },
              { label: 'DB Response', value: '8ms', icon: Database, desc: 'Average query time' },
              { label: 'Error Rate', value: '0.02%', icon: Shield, desc: '5xx responses' },
            ].map(m => (
              <div key={m.label} className="rounded-2xl border bg-card p-4 text-center">
                <m.icon className="h-5 w-5 mx-auto text-accent mb-2" />
                <div className="text-xl font-bold">{m.value}</div>
                <div className="text-[10px] font-semibold">{m.label}</div>
                <div className="text-[8px] text-muted-foreground">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Incident history */}
        <section>
          <h3 className="text-sm font-bold mb-3">Recent Incidents</h3>
          <div className="space-y-3">
            {INCIDENTS.map((inc, i) => (
              <div key={i} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn(
                    'text-[7px] border-0 rounded-lg',
                    inc.status === 'resolved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]'
                  )}>
                    {inc.status === 'resolved' ? 'Resolved' : 'Completed'}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">{inc.date}</span>
                  <span className="text-[9px] text-muted-foreground ml-auto">Duration: {inc.duration}</span>
                </div>
                <div className="text-[12px] font-semibold mb-1">{inc.title}</div>
                <p className="text-[10px] text-muted-foreground">{inc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscribe */}
        <section className="rounded-2xl border bg-card p-6 text-center">
          <h3 className="text-sm font-bold mb-1">Subscribe to Updates</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Get notified about incidents and scheduled maintenance.</p>
          <div className="flex gap-2 max-w-xs mx-auto">
            <input type="email" placeholder="your@email.com" className="flex-1 h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <Button size="sm" className="h-9 text-[10px] rounded-xl">Subscribe</Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-[10px] text-muted-foreground">
          <p>© 2026 Gigvora. All rights reserved. · <Link to="/trust-safety" className="hover:underline">Trust & Safety</Link> · <Link to="/help" className="hover:underline">Help Center</Link></p>
        </div>
      </footer>
    </div>
  );
}
