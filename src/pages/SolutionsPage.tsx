import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, CheckCircle2, Users, Briefcase, Building2,
  UserCheck, Megaphone, Pen, Handshake, Sparkles,
  ChevronRight, Star, Shield, Zap, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SOLUTIONS: Record<string, {
  title: string;
  subtitle: string;
  features: string[];
  cta: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  benefits: { title: string; desc: string; icon: React.ElementType }[];
  stats: { value: string; label: string }[];
  related: string[];
}> = {
  clients: {
    title: 'For Clients',
    subtitle: 'Find and hire the best talent, manage projects, and grow your business with secure, escrow-protected workflows.',
    icon: Users,
    color: 'text-[hsl(var(--gigvora-blue))]',
    bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]',
    features: ['Browse and hire professionals', 'Post jobs and projects', 'Purchase gig services', 'Escrow-protected payments', 'Full project management', 'Review and rate work', 'Saved talent and searches', 'Finance and billing management'],
    benefits: [
      { title: 'Verified Talent', desc: 'Every professional is verified with multi-level identity checks.', icon: Shield },
      { title: 'Secure Payments', desc: 'Escrow holds funds until you confirm delivery.', icon: Star },
      { title: 'Full Workspace', desc: 'Manage everything from one integrated dashboard.', icon: Zap },
    ],
    stats: [{ value: '50K+', label: 'Active clients' }, { value: '98%', label: 'Satisfaction rate' }, { value: '$2.4B+', label: 'Projects funded' }],
    cta: 'Start Hiring',
    related: ['professionals', 'enterprise', 'recruiters'],
  },
  professionals: {
    title: 'For Professionals',
    subtitle: 'Build your career, deliver services, and grow your professional brand with AI-powered tools and analytics.',
    icon: Briefcase,
    color: 'text-[hsl(var(--gigvora-teal))]',
    bg: 'bg-[hsl(var(--gigvora-teal)/0.08)]',
    features: ['Create professional profile', 'Offer gig packages', 'Submit project proposals', 'Advanced project workspace', 'Portfolio showcase', 'Analytics dashboard', 'Creation studio with AI tools', 'Networking and events'],
    benefits: [
      { title: 'Get Discovered', desc: 'AI-powered matching connects you with the right clients.', icon: Zap },
      { title: 'Build Your Brand', desc: 'Portfolio, content creation, and professional networking.', icon: Star },
      { title: 'Grow Revenue', desc: 'Multiple income streams through gigs, projects, and consulting.', icon: Shield },
    ],
    stats: [{ value: '2M+', label: 'Professionals' }, { value: '500K+', label: 'Gigs delivered' }, { value: '4.8/5', label: 'Average rating' }],
    cta: 'Join as Professional',
    related: ['clients', 'creators', 'agencies'],
  },
  enterprise: {
    title: 'For Enterprise',
    subtitle: 'Scale your teams, manage operations, and drive organizational growth with enterprise-grade controls.',
    icon: Building2,
    color: 'text-[hsl(var(--gigvora-purple))]',
    bg: 'bg-[hsl(var(--gigvora-purple)/0.08)]',
    features: ['Team management with RBAC', 'Full ATS and recruitment', 'Sales Navigator and CRM', 'Enterprise Connect ecosystem', 'Shared inbox', 'Custom branding', 'Advanced analytics', 'API access and integrations'],
    benefits: [
      { title: 'Scale Operations', desc: 'Team management, permissions, and organizational controls.', icon: Building2 },
      { title: 'Hire at Scale', desc: 'Full ATS with kanban pipelines and video interviews.', icon: UserCheck },
      { title: 'Drive Revenue', desc: 'Sales Navigator for lead discovery and pipeline management.', icon: Zap },
    ],
    stats: [{ value: '10K+', label: 'Enterprise teams' }, { value: '40%', label: 'Faster hiring' }, { value: '99.9%', label: 'Uptime SLA' }],
    cta: 'Enterprise Solutions',
    related: ['recruiters', 'agencies', 'advertisers'],
  },
  recruiters: {
    title: 'For Recruiters',
    subtitle: 'Source, evaluate, and hire top talent with enterprise-grade ATS tools and AI-powered matching.',
    icon: UserCheck,
    color: 'text-[hsl(var(--gigvora-blue))]',
    bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]',
    features: ['Advanced talent search', 'Kanban candidate pipelines', 'Video interviews', 'Interview scorecards', 'Outreach sequences', 'Talent pools', 'Headhunter workspace', 'Hiring analytics'],
    benefits: [
      { title: 'Find Faster', desc: 'AI-ranked talent search across the entire platform.', icon: Zap },
      { title: 'Evaluate Better', desc: 'Structured interviews with scorecards and team feedback.', icon: Star },
      { title: 'Track Everything', desc: 'Full pipeline analytics and hiring metrics.', icon: Shield },
    ],
    stats: [{ value: '2M+', label: 'Talent pool' }, { value: '40%', label: 'Time saved' }, { value: '3.2x', label: 'Interview efficiency' }],
    cta: 'Try Recruiter Pro',
    related: ['enterprise', 'clients', 'agencies'],
  },
  agencies: {
    title: 'For Agencies',
    subtitle: 'Manage clients, deliver services at scale, and grow your agency with multi-client workspace tools.',
    icon: Handshake,
    color: 'text-[hsl(var(--gigvora-teal))]',
    bg: 'bg-[hsl(var(--gigvora-teal)/0.08)]',
    features: ['Agency profile and portfolio', 'Multi-client management', 'Team workspace', 'Staffing portfolio', 'Client success tracking', 'CRM and sales tools', 'Financial management', 'Custom branding'],
    benefits: [
      { title: 'Manage Clients', desc: 'Multi-client dashboard with dedicated workspaces.', icon: Building2 },
      { title: 'Scale Delivery', desc: 'Team assignment, capacity planning, and project tracking.', icon: Zap },
      { title: 'Grow Revenue', desc: 'Sales tools, CRM, and lead generation built in.', icon: Star },
    ],
    stats: [{ value: '5K+', label: 'Agencies' }, { value: '98%', label: 'Retention rate' }, { value: '2.5x', label: 'Revenue growth' }],
    cta: 'Agency Solutions',
    related: ['enterprise', 'professionals', 'advertisers'],
  },
  advertisers: {
    title: 'For Advertisers',
    subtitle: 'Reach your target audience with powerful, data-driven advertising tools built for professional audiences.',
    icon: Megaphone,
    color: 'text-[hsl(var(--gigvora-amber))]',
    bg: 'bg-[hsl(var(--gigvora-amber)/0.08)]',
    features: ['Campaign management', 'Audience builder', 'Keyword planner', 'Creative studio', 'A/B testing', 'Attribution analytics', 'Sponsored placements', 'Budget controls'],
    benefits: [
      { title: 'Target Precisely', desc: 'Advanced audience builder with professional data.', icon: Zap },
      { title: 'Create Easily', desc: 'Built-in creative studio for ad content.', icon: Pen },
      { title: 'Measure Impact', desc: 'Full attribution analytics and ROI tracking.', icon: Star },
    ],
    stats: [{ value: '3.2x', label: 'Average ROAS' }, { value: '85%', label: 'Brand lift' }, { value: '2M+', label: 'Professional reach' }],
    cta: 'Start Advertising',
    related: ['enterprise', 'creators', 'agencies'],
  },
  creators: {
    title: 'For Creators',
    subtitle: 'Create content, build your audience, and monetize your expertise with professional-grade tools.',
    icon: Pen,
    color: 'text-[hsl(var(--gigvora-purple))]',
    bg: 'bg-[hsl(var(--gigvora-purple)/0.08)]',
    features: ['Creation studio', 'AI writing and image tools', 'Podcast hosting', 'Webinar hosting', 'Live rooms', 'Content analytics', 'Audience growth tools', 'Monetization options'],
    benefits: [
      { title: 'Create Anywhere', desc: 'AI-powered writing, images, and multimedia tools.', icon: Zap },
      { title: 'Build Audience', desc: 'Built-in distribution across the platform.', icon: Users },
      { title: 'Monetize', desc: 'Multiple revenue streams from subscriptions to consulting.', icon: Star },
    ],
    stats: [{ value: '100K+', label: 'Creators' }, { value: '10M+', label: 'Content views' }, { value: '5x', label: 'Audience growth' }],
    cta: 'Start Creating',
    related: ['professionals', 'advertisers', 'agencies'],
  },
};

const SolutionsPage: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const solution = role ? SOLUTIONS[role] : null;

  if (!solution) {
    return (
      <div>
        <PageSEO title="Solutions" description="See how Gigvora solves challenges for freelancers, agencies, recruiters, and enterprises." canonical="/solutions" />
        {/* Hero */}
        <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 lg:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
          <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5">
              <Sparkles className="h-3 w-3" /> Tailored for every role
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Solutions for Every Professional</h1>
            <p className="text-sm text-white/60 max-w-lg mx-auto">Tailored experiences for every role in the modern workforce.</p>
          </div>
        </section>

        {/* Solutions grid */}
        <section className="py-14 lg:py-20">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(SOLUTIONS).map(([key, sol]) => (
                <Link key={key} to={`/solutions/${key}`} className="group rounded-2xl border bg-card p-6 lg:p-7 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                  <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center mb-5', sol.bg)}>
                    <sol.icon className={cn('h-5 w-5', sol.color)} />
                  </div>
                  <h3 className="text-base font-bold mb-1.5 group-hover:text-accent transition-colors">{sol.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">{sol.subtitle.slice(0, 100)}...</p>
                  <div className="flex items-center gap-3 mb-4">
                    {sol.stats.slice(0, 2).map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-sm font-bold">{s.value}</div>
                        <div className="text-[9px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-accent font-semibold group-hover:underline">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-gradient-to-br from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-navy-light))]">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Not sure which solution fits?</h2>
            <p className="text-xs text-white/50 mb-5">Talk to our team for personalized guidance.</p>
            <Button size="sm" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] h-9 text-xs gap-1.5 font-semibold" asChild>
              <Link to="/support/contact">Contact Sales <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const relatedSolutions = solution.related.map(r => ({ key: r, ...SOLUTIONS[r] })).filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--gigvora-blue)/0.12),transparent_50%)]" />
        <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            <div className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5')}>
              <solution.icon className="h-3 w-3" /> {solution.title}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">{solution.title}</h1>
            <p className="text-sm text-white/60 mb-8 leading-relaxed max-w-lg">{solution.subtitle}</p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] shadow-lg h-11 text-sm gap-2 font-semibold" asChild>
                <Link to="/signup">{solution.cta} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-11 text-sm" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/50">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> Free to start</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> No credit card</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="py-8 bg-[hsl(var(--gigvora-navy))]">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 grid grid-cols-3 gap-6 text-center">
          {solution.stats.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Why {solution.title.replace('For ', '')}?</h2>
            <p className="text-xs text-muted-foreground">Key advantages of using Gigvora.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {solution.benefits.map((b) => (
              <div key={b.title} className="group rounded-2xl border bg-card p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <b.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-sm font-bold mb-2">{b.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 lg:py-20 bg-muted/30 border-y">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">Everything You Need</h2>
            <p className="text-xs text-muted-foreground">All features included to power your workflow.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {solution.features.map((f) => (
              <div key={f} className="flex items-center gap-3 rounded-xl bg-card border p-4 hover:shadow-card-hover transition-shadow">
                <div className="h-7 w-7 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />
                </div>
                <span className="text-xs font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related solutions */}
      {relatedSolutions.length > 0 && (
        <section className="py-14">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
            <h2 className="text-lg font-bold mb-6">Related Solutions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedSolutions.map(sol => (
                <Link key={sol.key} to={`/solutions/${sol.key}`} className="group flex items-start gap-3.5 rounded-xl border bg-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', sol.bg)}>
                    <sol.icon className={cn('h-5 w-5', sol.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold mb-0.5 group-hover:text-accent transition-colors">{sol.title}</h4>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{sol.subtitle.slice(0, 80)}...</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-navy-light))]">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Get Started?</h2>
          <p className="text-xs text-white/50 mb-6 max-w-sm mx-auto">Join thousands of professionals already on Gigvora.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="sm" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] h-9 text-xs gap-1.5 font-semibold" asChild>
              <Link to="/signup">{solution.cta} <ArrowRight className="h-3 w-3" /></Link>
            </Button>
            <Button size="sm" variant="outline" className="border-white/25 text-white hover:bg-white/10 h-9 text-xs" asChild>
              <Link to="/support/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SolutionsPage;
