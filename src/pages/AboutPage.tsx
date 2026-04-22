import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users, Globe, Award, Heart, ArrowRight, Target,
  CheckCircle2, Building2, Briefcase, Rocket, Shield,
  TrendingUp, Sparkles,
} from 'lucide-react';

const TIMELINE = [
  { year: '2023', title: 'Founded', desc: 'Gigvora launched with a vision to unify the fragmented professional ecosystem.' },
  { year: '2024', title: 'Platform Launch', desc: 'Jobs, Gigs, Projects, and Networking went live with 100K early adopters.' },
  { year: '2025', title: 'Enterprise Expansion', desc: 'Recruiter Pro, Sales Navigator, and Enterprise Connect launched for organizations.' },
  { year: '2026', title: 'Global Scale', desc: 'Serving 2M+ professionals across 150+ countries with full-stack professional tools.' },
];

const TEAM = [
  { name: 'Alex Chen', role: 'CEO & Co-founder', initials: 'AC' },
  { name: 'Sarah Williams', role: 'CTO & Co-founder', initials: 'SW' },
  { name: 'Marcus Rodriguez', role: 'VP Product', initials: 'MR' },
  { name: 'Priya Patel', role: 'VP Engineering', initials: 'PP' },
  { name: 'James Liu', role: 'VP Design', initials: 'JL' },
  { name: 'Elena Kowalski', role: 'VP Sales', initials: 'EK' },
];

const AboutPage: React.FC = () => (
  <div>
    <PageSEO title="About Gigvora" description="Learn about Gigvora — the platform connecting freelancers, agencies, and enterprises for hiring, services, and growth." canonical="/about" />
    {/* Hero */}
    <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--gigvora-blue)/0.12),transparent_50%)]" />
      <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5">
          <Sparkles className="h-3 w-3" /> Our story
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Building the Operating System<br />for the Modern Workforce</h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
          The hybrid professional platform unifying networking, freelance services, recruitment, sales, and enterprise operations.
        </p>
      </div>
    </section>

    {/* Stats band */}
    <section className="py-8 bg-[hsl(var(--gigvora-navy))]">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { value: '2M+', label: 'Professionals' },
          { value: '150+', label: 'Countries' },
          { value: '500K+', label: 'Gigs Completed' },
          { value: '99.9%', label: 'Uptime' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Mission & Values */}
    <section className="py-16 lg:py-24">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold mb-4 px-2.5 py-1 rounded-full bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]">
              <Target className="h-3.5 w-3.5" /> Our Mission
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Empowering Every Professional</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              We believe the future of work is hybrid. Gigvora empowers professionals, freelancers, recruiters, sales teams, and enterprises to connect, collaborate, and grow — all from one platform.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By combining the best of professional networking, freelance marketplaces, project management, and enterprise tools, we're building the operating system for the modern workforce.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, title: 'People First', desc: 'Every feature designed around real professional needs and workflows.' },
              { icon: Globe, title: 'Global Access', desc: 'Connecting talent and opportunity across borders and time zones.' },
              { icon: Shield, title: 'Trust & Safety', desc: 'Secure escrow, verification, and fair dispute resolution.' },
              { icon: Heart, title: 'Transparency', desc: 'Clear pricing, honest communication, no hidden fees or lock-ins.' },
            ].map((v) => (
              <div key={v.title} className="rounded-xl border bg-card p-5 hover:shadow-card-hover transition-shadow">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center mb-3">
                  <v.icon className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
                </div>
                <h4 className="text-sm font-semibold mb-1">{v.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Timeline */}
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Our Journey</h2>
          <p className="text-sm text-muted-foreground">From idea to global professional platform.</p>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-8">
            {TIMELINE.map((t, i) => (
              <div key={t.year} className="relative pl-12">
                <div className="absolute left-0 top-0 h-9 w-9 rounded-full bg-card border-2 border-accent flex items-center justify-center">
                  <span className="text-[10px] font-bold text-accent">{t.year}</span>
                </div>
                <h4 className="text-sm font-bold mb-1">{t.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="py-16 lg:py-24">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Leadership Team</h2>
          <p className="text-sm text-muted-foreground">The people building the future of professional work.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TEAM.map(t => (
            <div key={t.name} className="rounded-xl border bg-card p-5 text-center hover:shadow-card-hover transition-shadow">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-bold text-primary">{t.initials}</span>
              </div>
              <h4 className="text-xs font-semibold">{t.name}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 bg-gradient-to-br from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-navy-light))]">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Join Our Mission</h2>
        <p className="text-xs text-white/50 mb-6 max-w-sm mx-auto">Be part of the platform that's redefining professional work.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="sm" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] h-9 text-xs gap-1.5 font-semibold" asChild>
            <Link to="/signup">Get Started <ArrowRight className="h-3 w-3" /></Link>
          </Button>
          <Button size="sm" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-9 text-xs" asChild>
            <Link to="/support/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
