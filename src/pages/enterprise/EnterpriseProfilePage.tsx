import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, Globe, MapPin, Users, Shield, Star, CheckCircle2,
  Briefcase, FileText, Calendar, MessageSquare, TrendingUp,
  Edit, ExternalLink, Handshake, ShoppingCart, Eye, Award,
} from 'lucide-react';

const EnterpriseProfilePage: React.FC = () => {
  const topStrip = (
    <>
      <Building2 className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Enterprise Profile — Acme Corporation</span>
      <Badge className="bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))] text-[7px] border-0">Platinum</Badge>
      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Edit className="h-3 w-3" />Edit Profile</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><ExternalLink className="h-3 w-3" />Public View</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Trust & Verification" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Identity Verified', v: true },
            { l: 'Business License', v: true },
            { l: 'Financial Standing', v: true },
            { l: 'ISO 27001', v: true },
            { l: 'SOC 2 Type II', v: false },
          ].map(c => (
            <div key={c.l} className="flex items-center gap-1.5">
              <CheckCircle2 className={cn('h-3 w-3', c.v ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/30')} />
              <span className={c.v ? '' : 'text-muted-foreground'}>{c.l}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Procurement Signals" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Active RFPs', v: '3' },
            { l: 'Budget Cycle', v: 'Q2 2026' },
            { l: 'Preferred Vendors', v: '8' },
            { l: 'Avg Contract Size', v: '$120K' },
          ].map(s => (
            <div key={s.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{s.l}</span><span className="font-semibold">{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Partnership Signals" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Open to Partnerships', v: 'Yes', color: 'text-[hsl(var(--state-healthy))]' },
            { l: 'Partner Tier Offered', v: 'Gold' },
            { l: 'Referral Program', v: 'Active' },
            { l: 'Integration Partners', v: '14' },
          ].map(s => (
            <div key={s.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{s.l}</span><span className={cn('font-semibold', s.color)}>{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      {/* Hero */}
      <div className="rounded-2xl border bg-card p-5 mb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-accent/10 text-accent text-lg font-bold">AC</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold">Acme Corporation</h2>
              <Badge className="bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))] text-[8px] border-0">Platinum</Badge>
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
              <span>Technology · Cloud Infrastructure</span>
              <span><MapPin className="h-3 w-3 inline" /> San Francisco, CA</span>
              <span><Users className="h-3 w-3 inline" /> 1,000-5,000</span>
              <span><Globe className="h-3 w-3 inline" /> acmecorp.com</span>
            </div>
            <p className="text-[10px] text-muted-foreground max-w-xl">Leading enterprise cloud infrastructure provider specializing in AI/ML workloads, DevOps automation, and multi-cloud orchestration for Fortune 500 companies.</p>
          </div>
          <div className="text-center shrink-0">
            <div className="h-16 w-16 rounded-full bg-[hsl(var(--gigvora-amber))]/10 flex items-center justify-center mx-auto mb-1">
              <span className="text-xl font-bold text-[hsl(var(--gigvora-amber))]">98</span>
            </div>
            <div className="text-[8px] text-muted-foreground">Trust Score</div>
          </div>
        </div>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Partnerships" value="24" className="!rounded-2xl" />
        <KPICard label="Active Projects" value="8" className="!rounded-2xl" />
        <KPICard label="Team Members" value="45" change="On Gigvora" className="!rounded-2xl" />
        <KPICard label="Platform Since" value="2020" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="overview">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          {[
            { v: 'overview', l: 'Overview', icon: Building2 },
            { v: 'team', l: 'Team', icon: Users },
            { v: 'services', l: 'Services', icon: Briefcase },
            { v: 'projects', l: 'Projects', icon: FileText },
            { v: 'partnerships', l: 'Partnerships', icon: Handshake },
            { v: 'procurement', l: 'Procurement', icon: ShoppingCart },
            { v: 'events', l: 'Events', icon: Calendar },
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v} className="text-[10px] h-7 px-2.5 rounded-xl"><t.icon className="h-3 w-3 mr-1" />{t.l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Company Overview" className="!rounded-2xl">
              <div className="space-y-1.5 text-[9px]">
                {[
                  { l: 'Founded', v: '2008' }, { l: 'Revenue', v: '$50M - $100M' },
                  { l: 'Funding', v: 'Series D — $120M' }, { l: 'Headquarters', v: 'San Francisco, CA' },
                  { l: 'Offices', v: 'NYC, London, Singapore' }, { l: 'Industry', v: 'Cloud Infrastructure' },
                ].map(i => (
                  <div key={i.l} className="flex justify-between py-1 border-b last:border-0">
                    <span className="text-muted-foreground">{i.l}</span><span className="font-semibold">{i.v}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Service Capabilities" className="!rounded-2xl">
              <div className="flex flex-wrap gap-1">
                {['Cloud Migration', 'AI/ML Infrastructure', 'Kubernetes', 'DevOps Automation', 'Multi-Cloud', 'Edge Computing', 'Security', 'Compliance'].map(s => (
                  <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-2">
            {[
              { name: 'Sarah Chen', role: 'CEO & Co-Founder', dept: 'Executive' },
              { name: 'Marcus Williams', role: 'CTO', dept: 'Engineering' },
              { name: 'Elena Rodriguez', role: 'VP Partnerships', dept: 'Business Dev' },
              { name: 'James Park', role: 'Head of Procurement', dept: 'Operations' },
            ].map(m => (
              <div key={m.name} className="flex items-center gap-3 rounded-2xl border p-3 hover:shadow-sm transition-all">
                <Avatar className="h-9 w-9 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[9px]">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div><div className="text-[11px] font-semibold">{m.name}</div><div className="text-[9px] text-muted-foreground">{m.role} · {m.dept}</div></div>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg ml-auto"><Eye className="h-2.5 w-2.5 mr-0.5" />Profile</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services"><SectionCard title="Services" className="!rounded-2xl"><p className="text-[9px] text-muted-foreground">Detailed service catalog with pricing, SLAs, and case studies.</p></SectionCard></TabsContent>
        <TabsContent value="projects"><SectionCard title="Active Projects" className="!rounded-2xl"><p className="text-[9px] text-muted-foreground">8 active projects with status tracking and milestone visibility.</p></SectionCard></TabsContent>
        <TabsContent value="partnerships"><SectionCard title="Partnership Network" className="!rounded-2xl"><p className="text-[9px] text-muted-foreground">24 active partnerships across technology, consulting, and channel tiers.</p></SectionCard></TabsContent>
        <TabsContent value="procurement"><SectionCard title="Procurement" className="!rounded-2xl"><p className="text-[9px] text-muted-foreground">3 active RFPs and vendor qualification requirements.</p></SectionCard></TabsContent>
        <TabsContent value="events"><SectionCard title="Enterprise Events" className="!rounded-2xl"><p className="text-[9px] text-muted-foreground">Hosted and participating enterprise events.</p></SectionCard></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default EnterpriseProfilePage;
