import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Layers, FileText, UserCheck, Target,
  Building2, Megaphone, Users, Radio, ArrowRight,
  ArrowUpRight, CheckCircle2, Store, Sparkles,
  GraduationCap, Palette, Shield, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    icon: Briefcase, title: 'Jobs & Recruitment', color: 'text-[hsl(var(--gigvora-blue))]', bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]',
    desc: 'Post and find job opportunities, manage applications with a full ATS, conduct video interviews, and build hiring pipelines with AI-powered talent matching.',
    features: ['AI-powered job matching', 'Full ATS with kanban', 'Video interviews', 'Scorecard evaluation'],
    href: '/jobs',
  },
  {
    icon: Layers, title: 'Gigs Marketplace', color: 'text-[hsl(var(--gigvora-teal))]', bg: 'bg-[hsl(var(--gigvora-teal)/0.08)]',
    desc: 'Offer and purchase productized services through three-tier gig packages, manage orders with full timelines, and protect transactions with escrow.',
    features: ['Three-tier package builder', 'Full order timeline', 'Escrow protection', 'Performance analytics'],
    href: '/gigs',
  },
  {
    icon: Store, title: 'Services Marketplace', color: 'text-[hsl(var(--gigvora-green))]', bg: 'bg-[hsl(var(--gigvora-green)/0.08)]',
    desc: 'Professional consultative services with booking-based or custom-quoted pricing. Book consultations, request proposals, and manage ongoing service engagements.',
    features: ['Consultative bookings', 'Custom quote requests', 'Service portfolios', 'Client management'],
    href: '/services',
  },
  {
    icon: FileText, title: 'Project Workspaces', color: 'text-[hsl(var(--gigvora-purple))]', bg: 'bg-[hsl(var(--gigvora-purple)/0.08)]',
    desc: 'Advanced project management with kanban boards, task delegation, milestones, in-project chat, and milestone-based escrow releases.',
    features: ['Kanban & timeline views', 'Multi-freelancer teams', 'Milestone escrow', 'In-project chat'],
    href: '/projects',
  },
  {
    icon: UserCheck, title: 'Recruiter Pro', color: 'text-[hsl(var(--gigvora-blue))]', bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]',
    desc: 'Full applicant tracking system with talent search, candidate pipelines, video interviews, scorecards, outreach tools, and headhunter workflows.',
    features: ['Advanced talent search', 'Candidate pipelines', 'Video interviews', 'Hiring analytics'],
    href: '/recruiter-pro',
  },
  {
    icon: Target, title: 'Sales Navigator', color: 'text-[hsl(var(--gigvora-teal))]', bg: 'bg-[hsl(var(--gigvora-teal)/0.08)]',
    desc: 'Lead discovery, account search, buying committee mapping, outreach sequences, CRM task management, and relationship intelligence.',
    features: ['Lead discovery', 'Account search', 'Outreach sequences', 'CRM integration'],
    href: '/sales-navigator',
  },
  {
    icon: Building2, title: 'Enterprise Connect', color: 'text-[hsl(var(--gigvora-purple))]', bg: 'bg-[hsl(var(--gigvora-purple)/0.08)]',
    desc: 'Startup showcases, advisor marketplace, business plan vaults, partnership management, and client success tracking for growing organizations.',
    features: ['Startup showcases', 'Advisor marketplace', 'Partnership management', 'Client success'],
    href: '/enterprise-connect',
  },
  {
    icon: Megaphone, title: 'Gigvora Ads', color: 'text-[hsl(var(--gigvora-amber))]', bg: 'bg-[hsl(var(--gigvora-amber)/0.08)]',
    desc: 'Advertising platform with campaign management, audience builder, keyword planner, creative studio, A/B testing, and attribution analytics.',
    features: ['Campaign management', 'Audience builder', 'A/B testing', 'Attribution analytics'],
    href: '/ads',
  },
  {
    icon: Users, title: 'Professional Networking', color: 'text-[hsl(var(--gigvora-blue))]', bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]',
    desc: 'LinkedIn-level profiles, groups, events, speed networking with AI matching, live rooms, and a full mentor marketplace — all with built-in video.',
    features: ['Speed networking', 'Live rooms', 'Event hosting', 'Mentor marketplace'],
    href: '/networking',
  },
  {
    icon: Radio, title: 'Media & Creation', color: 'text-[hsl(var(--gigvora-red))]', bg: 'bg-[hsl(var(--gigvora-red)/0.08)]',
    desc: 'Podcasts, webinars, live sessions with full creation studio including AI writing, image generation, and multimedia production tools.',
    features: ['Podcast hosting', 'Webinar tools', 'AI creation studio', 'Content analytics'],
    href: '/interactive',
  },
];

const ProductPage: React.FC = () => (
  <div>
    <PageSEO title="Product Overview" description="Discover all Gigvora features — hiring, gigs, services, projects, content creation, ads, and enterprise tools." canonical="/product" />
    {/* Hero */}
    <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
      <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5">
          <Sparkles className="h-3 w-3" /> Complete platform overview
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">The Gigvora Platform</h1>
        <p className="text-sm text-white/60 max-w-lg mx-auto leading-relaxed">
          One unified platform for professional networking, freelance services, recruitment, sales, and enterprise operations.
        </p>
      </div>
    </section>

    {/* Product grid */}
    <section className="py-16 lg:py-24">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 space-y-8">
        {SECTIONS.map((section, i) => (
          <div key={section.title} className={cn('grid lg:grid-cols-2 gap-8 items-center', i % 2 !== 0 && 'direction-rtl')}>
            <div className={i % 2 !== 0 ? 'lg:order-2' : ''}>
              <div className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold mb-4 px-2.5 py-1 rounded-full', section.bg, section.color)}>
                <section.icon className="h-3.5 w-3.5" /> {section.title}
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{section.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">{section.desc}</p>
              <ul className="space-y-2 mb-6">
                {section.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1" asChild>
                <Link to={section.href}>Explore {section.title} <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className={i % 2 !== 0 ? 'lg:order-1' : ''}>
              <div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/30 border p-8 h-44 flex items-center justify-center text-muted-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--gigvora-blue)/0.04),transparent_70%)]" />
                <section.icon className="h-14 w-14 opacity-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 bg-gradient-to-br from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-navy-light))]">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Start Building Today</h2>
        <p className="text-xs text-white/50 mb-6">All features available on the free plan. Upgrade for premium tools.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="sm" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] h-9 text-xs gap-1.5 font-semibold" asChild>
            <Link to="/signup">Get Started Free <ArrowRight className="h-3 w-3" /></Link>
          </Button>
          <Button size="sm" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-9 text-xs" asChild>
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  </div>
);

export default ProductPage;
