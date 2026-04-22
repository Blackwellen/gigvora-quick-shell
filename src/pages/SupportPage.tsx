import React, { useState } from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Link } from 'react-router-dom';
import {
  Search, BookOpen, MessageSquare, HelpCircle, FileText, Users,
  ArrowRight, CheckCircle2, Sparkles, ChevronRight, Headphones,
  CreditCard, Shield, Briefcase, Layers, Settings, Bell,
  Video, Globe, Star, Clock, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { icon: Users, title: 'Getting Started', desc: 'Account setup, profiles, and onboarding guides', href: '/support', articles: 24, color: 'text-[hsl(var(--gigvora-blue))]', bg: 'bg-[hsl(var(--gigvora-blue)/0.08)]' },
  { icon: Briefcase, title: 'Jobs & Hiring', desc: 'Posting jobs, applications, and ATS usage', href: '/support', articles: 18, color: 'text-[hsl(var(--gigvora-teal))]', bg: 'bg-[hsl(var(--gigvora-teal)/0.08)]' },
  { icon: Layers, title: 'Gigs & Services', desc: 'Creating gigs, orders, and service delivery', href: '/support', articles: 22, color: 'text-[hsl(var(--gigvora-green))]', bg: 'bg-[hsl(var(--gigvora-green)/0.08)]' },
  { icon: CreditCard, title: 'Billing & Payments', desc: 'Subscriptions, escrow, invoices, and payouts', href: '/support', articles: 15, color: 'text-[hsl(var(--gigvora-amber))]', bg: 'bg-[hsl(var(--gigvora-amber)/0.08)]' },
  { icon: Shield, title: 'Trust & Safety', desc: 'Verification, disputes, and account security', href: '/support', articles: 12, color: 'text-[hsl(var(--gigvora-red))]', bg: 'bg-[hsl(var(--gigvora-red)/0.08)]' },
  { icon: Settings, title: 'Account & Settings', desc: 'Privacy, preferences, and profile management', href: '/support', articles: 16, color: 'text-[hsl(var(--gigvora-purple))]', bg: 'bg-[hsl(var(--gigvora-purple)/0.08)]' },
];

const POPULAR_ARTICLES = [
  { title: 'How to create your first gig', category: 'Gigs', time: '3 min read' },
  { title: 'Setting up escrow for projects', category: 'Payments', time: '5 min read' },
  { title: 'Understanding role switching', category: 'Getting Started', time: '2 min read' },
  { title: 'Managing team permissions', category: 'Enterprise', time: '4 min read' },
  { title: 'Filing a dispute safely', category: 'Trust & Safety', time: '6 min read' },
  { title: 'Upgrading your plan', category: 'Billing', time: '2 min read' },
];

const QUICK_LINKS = [
  { label: 'Account Settings', href: '/settings', icon: Settings },
  { label: 'View Plans', href: '/pricing', icon: Star },
  { label: 'Report a Problem', href: '/support/contact', icon: Shield },
  { label: 'System Status', href: '/support', icon: Globe },
];

const SupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <PageSEO title="Support & Help Center" description="Get help with Gigvora. Browse guides, submit tickets, and contact our support team." canonical="/support" />
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
        <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5">
            <Headphones className="h-3 w-3" /> Help Center
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">How Can We Help?</h1>
          <p className="text-sm text-white/60 max-w-lg mx-auto mb-8">Search our knowledge base or browse categories below.</p>
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search help articles, guides, and FAQs..."
              className="w-full h-12 rounded-2xl bg-white/10 border border-white/15 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gigvora-blue))] backdrop-blur-sm"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Getting started', 'Billing', 'Escrow', 'Disputes'].map(tag => (
              <button key={tag} className="text-[10px] text-white/50 hover:text-white/80 px-2.5 py-1 rounded-full border border-white/10 hover:border-white/25 transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links strip */}
      <section className="border-b bg-background">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {QUICK_LINKS.map(link => (
              <Link key={link.label} to={link.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                <link.icon className="h-3 w-3" /> {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Browse by Category</h2>
            <p className="text-xs text-muted-foreground">Find answers organized by topic.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.title} to={cat.href} className="group rounded-2xl border bg-card p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', cat.bg)}>
                    <cat.icon className={cn('h-5 w-5', cat.color)} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-bold mb-1.5 group-hover:text-accent transition-colors">{cat.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{cat.desc}</p>
                <span className="text-[10px] text-muted-foreground font-medium">{cat.articles} articles</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="py-14 bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Popular Articles
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Most read guides this week</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[11px] h-7">
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {POPULAR_ARTICLES.map((article, i) => (
              <Link key={i} to="/support" className="group flex items-start gap-3 rounded-xl border bg-card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold group-hover:text-accent transition-colors mb-1">{article.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-medium">{article.category}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {article.time}</span>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-navy-light))] p-8 lg:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="h-6 w-6 text-white/80" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">Still Need Help?</h2>
              <p className="text-xs text-white/50 mb-6 max-w-sm mx-auto">Our support team responds within 24 hours. We're here to help.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="sm" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] h-9 text-xs gap-1.5 font-semibold" asChild>
                  <Link to="/support/contact">Contact Support <ArrowRight className="h-3 w-3" /></Link>
                </Button>
                <Button size="sm" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-9 text-xs" asChild>
                  <Link to="/faq">Browse FAQ</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SupportPage;
