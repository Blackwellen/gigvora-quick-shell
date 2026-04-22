import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Megaphone, Target, BarChart3, Palette, Users, Zap, Building2, UserCheck } from 'lucide-react';
import productShot from '@/assets/product-shot-feed.jpg'; // Ads page is blank, using feed as placeholder

export default function ShowcaseAdsPage() {
  return (
    <ProductShowcasePage
      title="Gigvora Ads"
      tagline="Advertising platform with campaign management, audience builder, keyword planner, creative studio, A/B testing, and attribution analytics."
      description="Reach 2M+ professionals with targeted advertising built for B2B and professional audiences."
      icon={Megaphone}
      color="text-[hsl(var(--gigvora-amber))]"
      bgColor="bg-[hsl(var(--gigvora-amber)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Ads — Campaign management with audience targeting and analytics"
      stats={[
        { value: '2M+', label: 'Professional reach' },
        { value: '3.2x', label: 'Average ROAS' },
        { value: '85%', label: 'Brand lift' },
        { value: '12', label: 'Ad formats' },
      ]}
      highlights={[
        'Campaign management', 'Audience builder', 'Keyword planner',
        'Creative studio', 'A/B testing', 'Attribution analytics',
        'Sponsored placements', 'Budget controls',
      ]}
      features={[
        { title: 'Campaign Builder', desc: 'Create, manage, and optimize campaigns with real-time budgets and scheduling.', icon: Megaphone },
        { title: 'Audience Targeting', desc: 'Target by role, industry, skills, company size, and behavioral signals.', icon: Target },
        { title: 'Creative Studio', desc: 'Built-in tools to design ad creatives without leaving the platform.', icon: Palette },
        { title: 'A/B Testing', desc: 'Test headlines, creatives, and audiences to maximize performance.', icon: Zap },
        { title: 'Attribution Analytics', desc: 'Track conversions, ROAS, and multi-touch attribution across campaigns.', icon: BarChart3 },
        { title: 'Smart Recommendations', desc: 'AI-powered suggestions for budgets, audiences, and bid strategies.', icon: Users },
      ]}
      ctaText="Start Advertising"
      ctaHref="/ads"
      relatedProducts={[
        { label: 'Enterprise Connect', href: '/showcase/enterprise-connect', icon: Building2 },
        { label: 'Sales Navigator', href: '/showcase/sales-navigator', icon: Target },
      ]}
    />
  );
}
