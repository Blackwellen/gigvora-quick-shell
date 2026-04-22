import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Rocket, TrendingUp, Users, MapPin, DollarSign,
  Building2, Star, Heart, MessageSquare, ExternalLink, Globe,
  Calendar, Award, Target, Shield, Briefcase, BarChart3, Share2,
} from 'lucide-react';

export default function StartupDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/enterprise-connect/startups" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> NeuralForge AI</h1>
        <Badge className="text-[9px] bg-primary/10 text-primary">Series A</Badge>
        <Badge variant="secondary" className="text-[9px]">AI/ML</Badge>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-2xl"><AvatarFallback className="rounded-2xl text-xl bg-primary/20 text-primary font-bold">NF</AvatarFallback></Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold">NeuralForge AI</h2>
            <p className="text-sm text-muted-foreground">Enterprise AI infrastructure for scaling teams</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />San Francisco, CA</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Founded 2023</span>
              <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />neuralforge.ai</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 text-xs rounded-xl gap-1"><Heart className="h-3.5 w-3.5" />Save</Button>
            <Button variant="outline" className="h-9 text-xs rounded-xl gap-1"><Share2 className="h-3.5 w-3.5" />Share</Button>
            <Button className="h-9 text-xs rounded-xl gap-1"><MessageSquare className="h-3.5 w-3.5" />Connect</Button>
          </div>
        </div>
      </div>

      <KPIBand>
        <KPICard label="Total Raised" value="$12M" change="Series A" />
        <KPICard label="Team Size" value="24" change="+8 this quarter" />
        <KPICard label="Revenue Growth" value="+340%" change="YoY" />
        <KPICard label="Clients" value="150+" change="Enterprise" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="About" className="!rounded-2xl">
            <p className="text-xs leading-relaxed text-muted-foreground">NeuralForge AI provides enterprise-grade AI infrastructure that enables scaling teams to deploy, manage, and monitor machine learning models at production scale. Their platform reduces the time from model development to production by 80%, while maintaining enterprise security and compliance standards.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['AI Infrastructure', 'MLOps', 'Enterprise', 'B2B SaaS', 'Cloud', 'Security'].map(t => (
                <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Traction & Milestones" icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { milestone: 'Closed $12M Series A led by Accel Partners', date: 'Mar 2026', icon: DollarSign },
                { milestone: 'Reached 150+ enterprise clients', date: 'Feb 2026', icon: Users },
                { milestone: 'Launched V3 platform with auto-scaling', date: 'Jan 2026', icon: Rocket },
                { milestone: 'Named in Forbes AI 50', date: 'Dec 2025', icon: Award },
                { milestone: 'SOC 2 Type II certification', date: 'Nov 2025', icon: Shield },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/10 last:border-0">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><m.icon className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1"><div className="text-xs font-medium">{m.milestone}</div><div className="text-[9px] text-muted-foreground">{m.date}</div></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Founding Team" icon={<Users className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Alex Chen', role: 'CEO & Co-Founder', bg: 'Ex-Google AI, Stanford PhD', initials: 'AC' },
                { name: 'Priya Sharma', role: 'CTO & Co-Founder', bg: 'Ex-Meta, MIT', initials: 'PS' },
                { name: 'Marcus Johnson', role: 'VP Engineering', bg: 'Ex-Stripe', initials: 'MJ' },
                { name: 'Elena Rodriguez', role: 'VP Sales', bg: 'Ex-Salesforce', initials: 'ER' },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-2.5 p-2.5 rounded-xl border hover:shadow-sm transition-shadow">
                  <Avatar className="h-10 w-10 rounded-xl"><AvatarFallback className="rounded-xl text-[10px] bg-primary/10 text-primary font-bold">{t.initials}</AvatarFallback></Avatar>
                  <div><div className="text-xs font-semibold">{t.name}</div><div className="text-[9px] text-muted-foreground">{t.role}</div><div className="text-[8px] text-muted-foreground">{t.bg}</div></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Funding History" icon={<DollarSign className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              {[
                { round: 'Series A', amount: '$12M', lead: 'Accel Partners', date: 'Mar 2026' },
                { round: 'Seed', amount: '$3.5M', lead: 'Y Combinator', date: 'Sep 2024' },
                { round: 'Pre-Seed', amount: '$800K', lead: 'Angel investors', date: 'Jan 2023' },
              ].map(r => (
                <div key={r.round} className="py-2 border-b border-border/10 last:border-0">
                  <div className="flex justify-between"><span className="text-xs font-semibold">{r.round}</span><span className="text-xs font-bold text-primary">{r.amount}</span></div>
                  <div className="text-[9px] text-muted-foreground">{r.lead} · {r.date}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Key Metrics" icon={<BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              {[
                { label: 'ARR', value: '$4.2M' },
                { label: 'MRR Growth', value: '+28%' },
                { label: 'Net Revenue Retention', value: '135%' },
                { label: 'Customer Churn', value: '<2%' },
                { label: 'Runway', value: '24 months' },
              ].map(m => (
                <div key={m.label} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold">{m.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Similar Startups" className="!rounded-2xl">
            <div className="space-y-2">
              {['DataWeave', 'MLStack', 'CortexAI'].map(name => (
                <div key={name} className="flex items-center gap-2 py-1.5 text-xs hover:text-primary cursor-pointer transition-colors">
                  <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center text-[8px] font-bold">{name[0]}</div>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
