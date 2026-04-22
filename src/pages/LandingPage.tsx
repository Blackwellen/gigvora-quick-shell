import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Briefcase, Users, Building2, CheckCircle2,
  Layers, Target, Megaphone, Radio, UserCheck,
  Globe, Zap, FileText, Play,
  Shield, Star, TrendingUp, Award, Lock, CreditCard, Store,
  Send, ArrowUpRight, BarChart3,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageSEO } from '@/components/seo/PageSEO';
import heroBg from '@/assets/hero-bg.jpg';
import productShotFeed from '@/assets/product-shot-feed.jpg';
import productShotInbox from '@/assets/product-shot-inbox.jpg';
import productShotJobs from '@/assets/product-shot-jobs.jpg';
import productShotEnterprise from '@/assets/product-shot-enterprise.jpg';
import productShotRecruiter from '@/assets/product-shot-recruiter.jpg';
import productShotNavigator from '@/assets/product-shot-navigator.jpg';
import heroVideoAsset from '@/assets/hero-video.mp4.asset.json';

/* ── Intersection Observer Hook ── */
const useInView = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
};

/* ── Animated Counter ── */
const AnimatedStat: React.FC<{ value: string; label: string; delay?: number }> = ({ value, label, delay = 0 }) => {
  const { ref, visible } = useInView(0.3);
  return (
    <div ref={ref} className={cn('transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')} style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">{value}</div>
      <div className="text-[11px] text-white/50 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
};

/* ── Section Wrapper ── */
const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className, id }) => (
  <section id={id} className={cn('py-16 lg:py-28', className)}>
    <div className="max-w-[1280px] mx-auto px-4 md:px-8">{children}</div>
  </section>
);

const SectionHeader: React.FC<{ badge: string; badgeIcon: React.ElementType; badgeColor?: string; title: string; subtitle: string }> = ({ badge, badgeIcon: Icon, badgeColor = 'text-[hsl(var(--gigvora-blue))]', title, subtitle }) => (
  <div className="text-center mb-14">
    <div className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold mb-4 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50', badgeColor)}>
      <Icon className="h-3.5 w-3.5" /> {badge}
    </div>
    <h2 className="text-2xl md:text-3xl lg:text-[2.75rem] font-bold mb-3 tracking-tight leading-tight">{title}</h2>
    <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
  </div>
);

/* ═══════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════ */
const HeroSection = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <video
          autoPlay muted loop playsInline
          className={cn('absolute inset-0 w-full h-full object-cover transition-opacity duration-1000', videoLoaded ? 'opacity-60' : 'opacity-0')}
          onCanPlayThrough={() => setVideoLoaded(true)}
        >
          <source src={heroVideoAsset.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--gigvora-navy)/0.95)] via-[hsl(var(--gigvora-navy)/0.85)] to-[hsl(var(--gigvora-navy)/0.6)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,hsl(var(--gigvora-blue)/0.12),transparent_60%)]" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-8 w-full py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 border border-white/12 px-4 py-2 text-[11px] text-white/75 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
              The Professional Platform for the Modern Workforce
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] mb-6 text-white">
              Work. Hire. Grow.{' '}
              <span className="bg-gradient-to-r from-[hsl(var(--gigvora-blue-light))] via-[hsl(var(--gigvora-teal))] to-[hsl(var(--gigvora-blue-light))] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                All in One.
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/55 mb-10 max-w-lg leading-relaxed">
              Gigvora unifies professional networking, freelance services, project delivery, recruitment, sales intelligence, and enterprise operations into one powerful ecosystem.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Button size="lg" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] shadow-xl shadow-[hsl(var(--gigvora-blue)/0.25)] h-12 text-sm gap-2.5 font-semibold rounded-2xl px-7" asChild>
                <Link to="/signup">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-12 text-sm rounded-2xl px-6 gap-2" asChild>
                <Link to="/product"><Play className="h-3.5 w-3.5" /> Watch Demo</Link>
              </Button>
            </div>
            <div className="flex items-center gap-5 text-[11px] text-white/40">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> Free to start</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> 14-day Pro trial</span>
            </div>
          </div>

          {/* Product screenshot */}
          <div className="lg:col-span-7 hidden lg:block">
            <div className="relative">
              <img
                src={productShotFeed}
                alt="Gigvora Feed — Professional social feed with posts, trending topics, and connection recommendations"
                className="w-full rounded-2xl shadow-2xl shadow-black/40 border border-white/10"
                width={1440} height={900}
              />
              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 w-56 rounded-2xl border border-white/10 bg-[hsl(var(--gigvora-navy)/0.9)] backdrop-blur-xl p-4 shadow-2xl animate-in fade-in-0 slide-in-from-left-4 duration-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-xl bg-[hsl(var(--gigvora-teal)/0.2)] flex items-center justify-center"><TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--gigvora-teal))]" /></div>
                  <span className="text-[11px] font-semibold text-white/80">Revenue This Month</span>
                </div>
                <div className="text-xl font-bold text-white">$24,800</div>
                <div className="text-[9px] text-[hsl(var(--state-healthy))] mt-0.5">↑ 18% vs last month</div>
              </div>
              <div className="absolute -top-4 -right-4 w-52 rounded-2xl border border-white/10 bg-[hsl(var(--gigvora-navy)/0.9)] backdrop-blur-xl p-4 shadow-2xl animate-in fade-in-0 slide-in-from-right-4 duration-700 delay-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-xl bg-[hsl(var(--gigvora-blue)/0.2)] flex items-center justify-center"><Users className="h-3.5 w-3.5 text-[hsl(var(--gigvora-blue-light))]" /></div>
                  <span className="text-[11px] font-semibold text-white/80">Network</span>
                </div>
                <div className="text-lg font-bold text-white">2,847</div>
                <div className="text-[9px] text-white/40 mt-0.5">+32 this week</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════ */
const HOW_STEPS = [
  { step: '01', title: 'Create Your Profile', desc: 'Sign up free, choose your role — User, Professional, or Enterprise — and set up your workspace in minutes.', icon: Users },
  { step: '02', title: 'Explore the Ecosystem', desc: 'Browse jobs, gigs, services, projects, and professional connections across the full Gigvora platform.', icon: Globe },
  { step: '03', title: 'Work & Grow', desc: 'Hire talent, deliver projects, manage clients, recruit teams, and scale your business — all from one place.', icon: TrendingUp },
];

const HowItWorksSection = () => (
  <Section className="bg-background">
    <SectionHeader badge="Simple to start" badgeIcon={Zap} title="How Gigvora Works" subtitle="Get from sign-up to your first hire, gig, or project in three simple steps." />
    <div className="grid md:grid-cols-3 gap-6">
      {HOW_STEPS.map((s) => (
        <div key={s.step} className="relative rounded-3xl border bg-card p-7 lg:p-8 hover:shadow-card-hover transition-all duration-300 group">
          <div className="text-[64px] font-black text-muted/20 absolute top-4 right-6 leading-none select-none">{s.step}</div>
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-accent/10 mb-5">
            <s.icon className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-lg font-bold mb-2">{s.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  </Section>
);

const HIGHLIGHTS = [
  { value: '9', label: 'Product Modules' },
  { value: '3', label: 'User Roles' },
  { value: 'AI', label: 'Powered Tools' },
  { value: '100%', label: 'Free to Start' },
  { value: '0', label: 'Hidden Fees' },
];

const PlatformHighlightsBand = () => (
  <section className="py-14 bg-[hsl(var(--gigvora-navy))]">
    <div className="max-w-[1280px] mx-auto px-4 md:px-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 text-center">
        {HIGHLIGHTS.map((s, i) => <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 100} />)}
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════
   ROLE PATHWAYS
   ═══════════════════════════════════════════ */
const ROLES = [
  {
    title: 'User',
    description: 'Browse, network, hire talent, purchase services, manage bookings, and track orders — your personal professional cockpit.',
    icon: Users,
    cta: 'Start as User',
    href: '/signup?role=user',
    accent: 'from-[hsl(var(--gigvora-blue)/0.06)] to-transparent border-[hsl(var(--gigvora-blue)/0.12)]',
    iconColor: 'text-[hsl(var(--gigvora-blue))] bg-[hsl(var(--gigvora-blue)/0.1)]',
    features: ['Post jobs & projects', 'Hire freelancers & agencies', 'Secure escrow payments', 'Full order management'],
  },
  {
    title: 'Professional',
    description: 'Sell services, manage gigs and projects, build your brand, recruit talent, create content, and grow your earnings.',
    icon: Briefcase,
    cta: 'Join as Professional',
    href: '/signup?role=professional',
    accent: 'from-[hsl(var(--gigvora-teal)/0.06)] to-transparent border-[hsl(var(--gigvora-teal)/0.12)]',
    iconColor: 'text-[hsl(var(--gigvora-teal))] bg-[hsl(var(--gigvora-teal)/0.1)]',
    features: ['Create gig packages', 'Submit proposals & bids', 'AI Creation Studio', 'Earnings analytics'],
  },
  {
    title: 'Enterprise',
    description: 'Scale teams, manage hiring pipelines, run sales operations, procure services, and operate at organizational scale.',
    icon: Building2,
    cta: 'Enterprise Solutions',
    href: '/solutions/enterprise',
    accent: 'from-[hsl(var(--gigvora-purple)/0.06)] to-transparent border-[hsl(var(--gigvora-purple)/0.12)]',
    iconColor: 'text-[hsl(var(--gigvora-purple))] bg-[hsl(var(--gigvora-purple)/0.1)]',
    features: ['Team & seat management', 'Full ATS & recruitment', 'Gigvora Navigator CRM', 'SSO & compliance'],
  },
];

const RolePathwaySection = () => (
  <Section className="bg-background">
    <SectionHeader badge="For every professional" badgeIcon={Globe} title="Choose Your Path" subtitle="One platform, three operating modes. Switch roles anytime as your needs evolve." />
    <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
      {ROLES.map((role) => (
        <div key={role.title} className={cn('group rounded-3xl border bg-gradient-to-b p-7 lg:p-8 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1', role.accent)}>
          <div className={cn('inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-6', role.iconColor)}>
            <role.icon className="h-5.5 w-5.5" />
          </div>
          <h3 className="text-xl font-bold mb-2">{role.title}</h3>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{role.description}</p>
          <ul className="space-y-2.5 mb-7">
            {role.features.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="text-xs h-9 w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
            <Link to={role.href}>{role.cta} <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════
   PRODUCT ECOSYSTEM
   ═══════════════════════════════════════════ */
const PRODUCTS = [
  { icon: Briefcase, title: 'Jobs', desc: 'Post and discover career opportunities', href: '/jobs', color: 'text-[hsl(var(--gigvora-blue))]' },
  { icon: Layers, title: 'Gigs', desc: 'Freelance service marketplace', href: '/gigs', color: 'text-[hsl(var(--gigvora-teal))]' },
  { icon: Store, title: 'Services', desc: 'Professional consultative services', href: '/services', color: 'text-[hsl(var(--gigvora-green))]' },
  { icon: FileText, title: 'Projects', desc: 'Collaborative project delivery', href: '/projects', color: 'text-[hsl(var(--gigvora-purple))]' },
  { icon: UserCheck, title: 'Recruiter Pro', desc: 'Full ATS and talent pipeline', href: '/recruiter-pro', color: 'text-[hsl(var(--gigvora-blue))]' },
  { icon: Target, title: 'Gigvora Navigator', desc: 'Lead discovery and sales CRM', href: '/navigator', color: 'text-[hsl(var(--gigvora-teal))]' },
  { icon: Building2, title: 'Enterprise Connect', desc: 'B2B networking and procurement', href: '/enterprise-connect', color: 'text-[hsl(var(--gigvora-purple))]' },
  { icon: Megaphone, title: 'Gigvora Ads', desc: 'Advertising and growth engine', href: '/ads', color: 'text-[hsl(var(--gigvora-amber))]' },
  { icon: Radio, title: 'Media & Events', desc: 'Podcasts, webinars, and live sessions', href: '/interactive', color: 'text-[hsl(var(--gigvora-red))]' },
];

const ProductEcosystemSection = () => (
  <Section className="bg-muted/20">
    <SectionHeader badge="Complete ecosystem" badgeIcon={Zap} title="One Ecosystem, Endless Possibilities" subtitle="Every tool you need to work, hire, sell, recruit, and grow — seamlessly connected." />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {PRODUCTS.map((p) => (
        <Link key={p.title} to={p.href} className="group flex items-start gap-4 rounded-2xl bg-card border p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="shrink-0 h-11 w-11 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
            <p.icon className={cn('h-5 w-5', p.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm mb-0.5">{p.title}</h4>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════
   FEATURE SHOWCASES (with real screenshots)
   ═══════════════════════════════════════════ */
interface FeatureShowcaseProps {
  badge: string;
  badgeColor: string;
  badgeIcon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  badge, badgeColor, badgeIcon: BadgeIcon, title, description, features,
  ctaText, ctaHref, image, imageAlt, reverse,
}) => {
  const { ref, visible } = useInView(0.15);
  return (
    <div ref={ref} className={cn('grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
      <div className={reverse ? 'lg:order-2' : ''}>
        <div className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold mb-5 px-3 py-1.5 rounded-full', badgeColor)}>
          <BadgeIcon className="h-3.5 w-3.5" /> {badge}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight leading-snug">{title}</h2>
        <p className="text-sm text-muted-foreground mb-7 leading-relaxed max-w-lg">{description}</p>
        <ul className="space-y-3 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-[13px]">
              <div className="h-5 w-5 rounded-full bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
              </div>
              {f}
            </li>
          ))}
        </ul>
        <Button size="sm" className="text-xs h-10 gap-2 font-semibold rounded-xl px-6" asChild>
          <Link to={ctaHref}>{ctaText} <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
      <div className={cn(reverse ? 'lg:order-1' : '', 'relative')}>
        <img
          src={image}
          alt={imageAlt}
          className="w-full rounded-2xl shadow-xl"
          loading="lazy"
          width={800}
          height={500}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   PREMIUM OPERATING LAYERS
   ═══════════════════════════════════════════ */
const PremiumSection = () => (
  <Section className="bg-muted/20">
    <SectionHeader badge="Premium add-ons" badgeIcon={Award} badgeColor="text-[hsl(var(--gigvora-purple))]" title="Premium Operating Layers" subtitle="Purpose-built tools for recruiters, sales teams, and enterprise operations." />
    <div className="grid md:grid-cols-3 gap-5">
      {[
        { icon: UserCheck, title: 'Recruiter Pro', price: '$49/seat/mo', desc: 'Full ATS with talent search, kanban pipelines, video interviews, scorecards, and headhunter workflows.', href: '/recruiter-pro', color: 'text-[hsl(var(--gigvora-blue))]', bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]', borderAccent: 'border-[hsl(var(--gigvora-blue)/0.15)]' },
        { icon: Target, title: 'Gigvora Navigator', price: '$39/seat/mo', desc: 'Lead and account search, buying committees, outreach sequences, CRM tasks, and relationship graphs.', href: '/navigator', color: 'text-[hsl(var(--gigvora-teal))]', bg: 'bg-[hsl(var(--gigvora-teal)/0.08)]', borderAccent: 'border-[hsl(var(--gigvora-teal)/0.15)]' },
        { icon: Building2, title: 'Enterprise Connect', price: '$29/mo', desc: 'B2B networking, startup showcases, advisor marketplace, procurement workflows, and client success tools.', href: '/enterprise-connect', color: 'text-[hsl(var(--gigvora-purple))]', bg: 'bg-[hsl(var(--gigvora-purple)/0.08)]', borderAccent: 'border-[hsl(var(--gigvora-purple)/0.15)]' },
      ].map((p) => (
        <div key={p.title} className={cn('group rounded-3xl border bg-card p-7 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1', p.borderAccent)}>
          <div className={cn('inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-5', p.bg)}>
            <p.icon className={cn('h-5 w-5', p.color)} />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">{p.title}</h3>
            <span className="text-[11px] font-bold text-[hsl(var(--gigvora-blue))]">{p.price}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{p.desc}</p>
          <Button variant="outline" size="sm" className="text-xs h-9 w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
            <Link to={p.href}>Learn More <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════
   NETWORKING & MEDIA
   ═══════════════════════════════════════════ */
const NetworkingMediaSection = () => {
  const { ref, visible } = useInView(0.15);
  return (
    <Section className="bg-background">
      <div ref={ref} className={cn('grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-700', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}>
        <div className="relative">
          <img
            src={productShotInbox}
            alt="Gigvora Inbox — Enterprise messaging with AI summarization, thread context, and linked objects"
            className="w-full rounded-2xl shadow-xl"
            loading="lazy"
            width={800}
            height={500}
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold mb-5 px-3 py-1.5 rounded-full bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]">
            <MessageSquare className="h-3.5 w-3.5" /> Communication & Media
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight leading-snug">Enterprise Messaging & Rich Media</h2>
          <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
            AI-powered inbox with thread summarization, linked project context, smart categorization — plus built-in podcasts, webinars, and live video rooms.
          </p>
          <ul className="space-y-3 mb-8">
            {['AI thread summarization & smart drafts', 'Group chats, channels & team spaces', 'Podcasts & webinars with monetization', 'Live rooms and speed networking', 'Calendar integration & booking'].map(f => (
              <li key={f} className="flex items-center gap-3 text-[13px]">
                <div className="h-5 w-5 rounded-full bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                </div>
                {f}
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Button size="sm" className="text-xs h-10 gap-2 font-semibold rounded-xl px-6" asChild>
              <Link to="/inbox">Explore Messaging <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-10 gap-2 rounded-xl px-5" asChild>
              <Link to="/interactive">Media Hub <Play className="h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
};

/* ═══════════════════════════════════════════
   TRUST
   ═══════════════════════════════════════════ */
const TrustSection = () => (
  <Section className="bg-muted/20">
    <SectionHeader badge="Enterprise-grade security" badgeIcon={Shield} badgeColor="text-[hsl(var(--state-healthy))]" title="Built for Trust" subtitle="Enterprise-grade security, transparent pricing, and fair dispute resolution." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { icon: Shield, title: 'Escrow Protection', desc: 'Payments held securely until delivery is confirmed by both parties.', color: 'text-[hsl(var(--gigvora-blue))]' },
        { icon: Lock, title: 'Identity Verification', desc: 'Multi-level verification for professionals, companies, and agencies.', color: 'text-[hsl(var(--gigvora-teal))]' },
        { icon: Award, title: 'Fair Disputes', desc: 'Evidence-based dispute resolution with professional arbitration.', color: 'text-[hsl(var(--gigvora-purple))]' },
        { icon: CreditCard, title: 'No Hidden Fees', desc: 'Clear, upfront pricing with no surprises. What you see is what you pay.', color: 'text-[hsl(var(--gigvora-green))]' },
      ].map((t) => (
        <div key={t.title} className="rounded-2xl border bg-card p-6 text-center hover:shadow-card-hover transition-shadow">
          <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-muted/50 mb-4">
            <t.icon className={cn('h-5 w-5', t.color)} />
          </div>
          <h4 className="text-sm font-bold mb-2">{t.title}</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t.desc}</p>
        </div>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════
   NEWSLETTER
   ═══════════════════════════════════════════ */
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="py-14 bg-background border-y">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-lg font-bold mb-2">Stay in the loop</h3>
          <p className="text-xs text-muted-foreground mb-6">Get the latest updates on features, tips, and professional opportunities.</p>
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--state-healthy))] font-medium">
              <CheckCircle2 className="h-4 w-4" /> You're subscribed! Check your email.
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="flex gap-2 max-w-sm mx-auto">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required className="flex-1 h-10 rounded-xl border bg-background px-4 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button type="submit" size="sm" className="h-10 text-xs gap-1.5 font-semibold rounded-xl px-5">
                Subscribe <Send className="h-3 w-3" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════ */
const FinalCTA = () => (
  <section className="relative py-24 overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
      <div className="absolute inset-0 bg-[hsl(var(--gigvora-navy)/0.92)]" />
    </div>
    <div className="relative max-w-[1280px] mx-auto px-4 md:px-8 text-center">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">Ready to Transform How You Work?</h2>
      <p className="text-base text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">Be among the first professionals to build their future on Gigvora.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] shadow-xl shadow-[hsl(var(--gigvora-blue)/0.25)] h-12 text-sm gap-2.5 font-semibold rounded-2xl px-8" asChild>
          <Link to="/signup">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button size="lg" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-12 text-sm rounded-2xl px-7" asChild>
          <Link to="/support/contact">Contact Sales</Link>
        </Button>
      </div>
      <div className="flex items-center justify-center gap-6 mt-8 text-[11px] text-white/35">
        <span>Free forever plan</span>
        <span className="h-3 w-px bg-white/15" />
        <span>14-day Pro trial</span>
        <span className="h-3 w-px bg-white/15" />
        <span>No credit card required</span>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════
   MOBILE STICKY BAR
   ═══════════════════════════════════════════ */
const MobileStickyBar = () => (
  <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t shadow-lg" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
    <div className="flex gap-2 px-4 pt-3">
      <Button size="sm" className="flex-1 text-xs h-10 gap-1 font-semibold rounded-xl shadow-md" asChild>
        <Link to="/signup">Get Started Free <ArrowRight className="h-3 w-3" /></Link>
      </Button>
      <Button variant="outline" size="sm" className="text-xs h-10 rounded-xl" asChild>
        <Link to="/signin">Sign In</Link>
      </Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
const LandingPage: React.FC = () => (
  <div className="pb-16 md:pb-0">
    <PageSEO title="Gigvora — Work, Hire & Grow on One Platform" description="The all-in-one professional platform to hire talent, sell services, manage projects, recruit teams, and grow your business." canonical="/" />
    <HeroSection />
    <PlatformHighlightsBand />
    <RolePathwaySection />
    <HowItWorksSection />
    <ProductEcosystemSection />

    {/* Feature showcases with real product screenshots */}
    <Section className="bg-background">
      <div className="space-y-24">
        <FeatureShowcase
          badge="Professional Feed" badgeColor="bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]" badgeIcon={Users}
          title="Your Professional Network, Supercharged"
          description="A social feed built for professionals — share updates, discover opportunities, post gigs, and connect with your network. AI-powered content and trend discovery."
          features={['Role-filtered content feed', 'Post jobs, gigs, polls & articles', 'Trending topics & hashtag discovery', 'People-to-follow recommendations']}
          ctaText="Explore Feed" ctaHref="/feed"
          image={productShotFeed} imageAlt="Gigvora Feed — Professional social feed with posts, trending topics, and connection recommendations"
        />
        <FeatureShowcase
          badge="Enterprise Messaging" badgeColor="bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]" badgeIcon={MessageSquare}
          title="Enterprise Messaging & Collaboration"
          description="AI-powered inbox with thread summarization, linked project context, smart categorization, and integrated scheduling."
          features={['AI thread summarization & smart drafts', 'Linked project and job context', 'Group chats, channels & team spaces', 'Calendar integration & booking']}
          ctaText="Explore Inbox" ctaHref="/inbox"
          image={productShotInbox} imageAlt="Gigvora Inbox — Enterprise messaging with AI summarization and linked objects" reverse
        />
        <FeatureShowcase
          badge="Jobs & Recruitment" badgeColor="bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]" badgeIcon={Briefcase}
          title="Hire the Right Talent, Fast"
          description="Post jobs, search talent with AI ranking, manage applications through a full ATS, conduct video interviews, and build hiring pipelines."
          features={['Advanced talent search with AI ranking', 'Full ATS with kanban pipelines', 'Video interview scheduling', 'Scorecard-based evaluation']}
          ctaText="Explore Jobs" ctaHref="/jobs"
          image={productShotJobs} imageAlt="Gigvora Jobs — Discovery and hiring with rich filters and analytics"
        />
        <FeatureShowcase
          badge="Enterprise Connect" badgeColor="bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]" badgeIcon={Building2}
          title="B2B Networking at Scale"
          description="Enterprise directory, procurement discovery, partner matching, warm introductions, and trust-scored business networking."
          features={['2,340+ verified enterprise profiles', 'Procurement pipeline tracking', 'Warm intro workflows', 'Trust scoring and partner tiers']}
          ctaText="Explore Enterprise Connect" ctaHref="/enterprise-connect"
          image={productShotEnterprise} imageAlt="Enterprise Connect — B2B networking with procurement and partner discovery" reverse
        />
        <FeatureShowcase
          badge="Recruiter Pro" badgeColor="bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]" badgeIcon={UserCheck}
          title="Full ATS & Talent Pipeline"
          description="Recruitment command center with kanban pipelines, scorecards, video interviews, offer management, and hiring analytics."
          features={['Pipeline board with stage tracking', 'Interview scheduling & scorecards', 'Talent pools and match center', 'Hiring team & seat management']}
          ctaText="Explore Recruiter Pro" ctaHref="/recruiter-pro"
          image={productShotRecruiter} imageAlt="Recruiter Pro — Full ATS with pipeline, interviews, and analytics"
        />
        <FeatureShowcase
          badge="Sales Navigator" badgeColor="bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]" badgeIcon={Target}
          title="Lead Discovery & Sales CRM"
          description="Find and qualify prospects with AI scoring, build smart lists, run outreach sequences, and track relationship graphs."
          features={['AI-powered lead and account search', 'Smart lists with dynamic filtering', 'Outreach sequences and templates', 'Relationship graph and signal feed']}
          ctaText="Explore Navigator" ctaHref="/sales-navigator"
          image={productShotNavigator} imageAlt="Gigvora Navigator — Lead discovery with smart lists and outreach" reverse
        />
      </div>
    </Section>

    <PremiumSection />
    <NetworkingMediaSection />
    <TrustSection />
    <NewsletterSection />
    <FinalCTA />
    <MobileStickyBar />
  </div>
);

export default LandingPage;
