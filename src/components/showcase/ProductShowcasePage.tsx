import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSEO } from '@/components/seo/PageSEO';
import { cn } from '@/lib/utils';
import {
  ArrowRight, CheckCircle2, Sparkles, ArrowUpRight, Star,
  Shield, Zap, Users, Play,
} from 'lucide-react';

export interface ShowcaseFeature {
  title: string;
  desc: string;
  icon: React.ElementType;
}

export interface ShowcaseProps {
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  screenshot: string;
  screenshotAlt: string;
  features: ShowcaseFeature[];
  highlights: string[];
  stats: { value: string; label: string }[];
  ctaText: string;
  ctaHref: string;
  relatedProducts?: { label: string; href: string; icon: React.ElementType }[];
  badge?: string;
}

const ProductShowcasePage: React.FC<ShowcaseProps> = ({
  title, tagline, description, icon: Icon, color, bgColor,
  screenshot, screenshotAlt, features, highlights, stats,
  ctaText, ctaHref, relatedProducts, badge,
}) => (
  <div>
    <PageSEO
      title={`${title} — Gigvora`}
      description={tagline}
      canonical={ctaHref.replace(/^\//, '/showcase/')}
    />

    {/* Hero */}
    <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--gigvora-blue)/0.12),transparent_50%)]" />
      <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5')}>
              <Sparkles className="h-3 w-3" /> {badge || title}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">{title}</h1>
            <p className="text-base text-white/60 mb-6 leading-relaxed max-w-lg">{tagline}</p>
            <p className="text-sm text-white/40 mb-8 max-w-md leading-relaxed">{description}</p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] shadow-xl h-12 text-sm gap-2.5 font-semibold rounded-2xl px-7" asChild>
                <Link to="/signup">{ctaText} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-12 text-sm rounded-2xl px-6 gap-2" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="flex items-center gap-5 text-[11px] text-white/40">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> Free to start</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> No credit card</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <img
              src={screenshot}
              alt={screenshotAlt}
              className="w-full rounded-2xl shadow-2xl shadow-black/40 border border-white/10"
              width={1440} height={900}
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="py-10 bg-[hsl(var(--gigvora-navy))]">
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(s => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Mobile screenshot */}
    <section className="lg:hidden py-8 px-4">
      <img
        src={screenshot}
        alt={screenshotAlt}
        className="w-full rounded-2xl shadow-xl border"
        width={1440} height={900}
        loading="lazy"
      />
    </section>

    {/* Highlights */}
    <section className="py-14 lg:py-20 border-b">
      <div className="max-w-3xl mx-auto px-4 text-center mb-10">
        <h2 className="text-2xl font-bold mb-3">What's Included</h2>
        <p className="text-xs text-muted-foreground">Everything you need to succeed.</p>
      </div>
      <div className="max-w-3xl mx-auto px-4 grid md:grid-cols-2 gap-3">
        {highlights.map(h => (
          <div key={h} className="flex items-center gap-3 rounded-xl bg-card border p-4 hover:shadow-card-hover transition-shadow">
            <div className="h-7 w-7 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />
            </div>
            <span className="text-xs font-medium">{h}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Features deep dive */}
    <section className="py-14 lg:py-20">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-3">Key Features</h2>
          <p className="text-xs text-muted-foreground">Built for professionals who demand the best.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="group rounded-2xl border bg-card p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
              <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center mb-4', bgColor)}>
                <f.icon className={cn('h-5 w-5', color)} />
              </div>
              <h3 className="text-sm font-bold mb-2">{f.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Related products */}
    {relatedProducts && relatedProducts.length > 0 && (
      <section className="py-14 border-t">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <h2 className="text-lg font-bold mb-6">Related Products</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map(rp => (
              <Link key={rp.label} to={rp.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                <rp.icon className="h-5 w-5 text-accent shrink-0" />
                <span className="text-xs font-semibold group-hover:text-accent transition-colors">{rp.label}</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    )}

    {/* CTA */}
    <section className="py-16 bg-gradient-to-br from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-navy-light))]">
      <div className="max-w-[1600px] mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to Get Started?</h2>
        <p className="text-xs text-white/50 mb-6">Join thousands of professionals using {title}.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] h-11 text-sm gap-2 font-semibold" asChild>
            <Link to="/signup">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-11 text-sm" asChild>
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  </div>
);

export default ProductShowcasePage;
