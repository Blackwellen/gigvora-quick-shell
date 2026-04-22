import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Search, Users, Target, Calendar, FileText, BarChart3,
  Mail, CreditCard, Star, Shield, Sparkles, ChevronRight, Clock,
  Layers,
} from 'lucide-react';

const WORKBENCHES = [
  { label: 'Job Workspace', icon: Briefcase, path: '/recruiter-pro/jobs', description: 'Manage job posts, requirements, and hiring teams', count: 12 },
  { label: 'Candidate Search', icon: Search, path: '/recruiter-pro/search', description: 'AI-powered talent discovery and boolean search', count: null },
  { label: 'Match Center', icon: Target, path: '/recruiter-pro/match', description: 'Candidate-job fit scoring and recommendations', count: 8 },
  { label: 'Saved Talent Pools', icon: Star, path: '/recruiter-pro/pools', description: 'Curated talent lists and watchlists', count: 5 },
  { label: 'Outreach Workspace', icon: Mail, path: '/recruiter-pro/outreach', description: 'Sequenced outreach, templates, and tracking', count: 34 },
  { label: 'Candidate Pipeline', icon: Layers, path: '/recruiter-pro/pipeline', description: 'Stage-based pipeline with drag-and-drop', count: 47 },
  { label: 'Interview Scheduler', icon: Calendar, path: '/recruiter-pro/interviews', description: 'Availability capture and scheduling', count: 6 },
  { label: 'Scorecards', icon: FileText, path: '/recruiter-pro/scorecards', description: 'Structured evaluations and team feedback', count: 15 },
  { label: 'Hiring Team', icon: Users, path: '/recruiter-pro/team', description: 'Collaboration, notes, and role assignments', count: null },
  { label: 'Analytics', icon: BarChart3, path: '/recruiter-pro/analytics', description: 'Source quality, conversion, and time-to-hire', count: null },
  { label: 'Billing & Seats', icon: CreditCard, path: '/recruiter-pro/billing', description: 'Credits, subscriptions, and seat management', count: null },
];

export default function RecruiterProHomePage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 overflow-x-auto pb-1 w-full">
          <div className="flex items-center gap-2 mr-4">
            <Shield className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
            <div>
              <h1 className="text-sm font-bold">Recruiter Pro</h1>
              <p className="text-[9px] text-muted-foreground">Private recruiting workspace</p>
            </div>
          </div>
          <KPICard label="Open Roles" value="12" change="+2 this week" trend="up" />
          <KPICard label="Active Candidates" value="234" change="+18 today" trend="up" />
          <KPICard label="Interviews" value="6" change="Next: 2h" trend="neutral" />
          <KPICard label="Offers" value="3" change="1 pending" trend="neutral" />
          <KPICard label="Time-to-Hire" value="23d" change="-4d" trend="down" />
        </div>
      }
    >
      <SectionCard title="Workbenches" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {WORKBENCHES.map((wb) => (
            <button
              key={wb.label}
              onClick={() => navigate(wb.path)}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all text-left group"
            >
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <wb.icon className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{wb.label}</span>
                  {wb.count !== null && (
                    <Badge variant="secondary" className="text-[8px] h-4 px-1.5">{wb.count}</Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{wb.description}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-accent shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SectionCard title="Recent Pipeline Activity" icon={<Target className="h-3.5 w-3.5 text-muted-foreground" />}>
          {[
            { name: 'Ana Torres', action: 'moved to Technical Interview', time: '12 min ago', icon: Target },
            { name: 'David Kim', action: 'scorecard submitted by Sarah', time: '45 min ago', icon: FileText },
            { name: 'Priya Patel', action: 'offer letter generated', time: '2h ago', icon: Sparkles },
            { name: 'James Chen', action: 'added to Senior Frontend pool', time: '3h ago', icon: Star },
            { name: 'Lisa Wang', action: 'outreach sequence started', time: '4h ago', icon: Mail },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium">{item.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1">{item.action}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Hiring Priorities" icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}>
          {[
            { role: 'Senior Frontend Engineer', stage: 'Final Interview', candidates: 3, urgent: true },
            { role: 'Engineering Manager', stage: 'Sourcing', candidates: 12, urgent: false },
            { role: 'ML Engineer', stage: 'Phone Screen', candidates: 8, urgent: true },
            { role: 'Product Designer', stage: 'Offer', candidates: 1, urgent: true },
            { role: 'DevOps Engineer', stage: 'Technical', candidates: 5, urgent: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium">{item.role}</span>
                  {item.urgent && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-risk)/0.1)] text-[hsl(var(--state-risk))] border-0">Urgent</Badge>}
                </div>
                <span className="text-[9px] text-muted-foreground">{item.stage} · {item.candidates} candidates</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] px-2">
                View <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
              </Button>
            </div>
          ))}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
