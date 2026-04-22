import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Target, Search, BarChart3, Users, Zap, Shield, UserCheck, Briefcase } from 'lucide-react';
import productShot from '@/assets/product-shot-navigator.jpg';

export default function ShowcaseNavigatorPage() {
  return (
    <ProductShowcasePage
      title="Sales Navigator"
      badge="Pro"
      tagline="Lead discovery, account search, buying committee mapping, outreach sequences, CRM task management, and relationship intelligence."
      description="Find and qualify prospects with AI scoring, build smart lists, run outreach sequences, and track relationship graphs across the Gigvora ecosystem."
      icon={Target}
      color="text-[hsl(var(--gigvora-teal))]"
      bgColor="bg-[hsl(var(--gigvora-teal)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Sales Navigator — Lead discovery with smart lists, outreach, and CRM"
      stats={[
        { value: '500K+', label: 'Leads indexed' },
        { value: '3.8x', label: 'Pipeline growth' },
        { value: '67%', label: 'Response rate' },
        { value: '2.1x', label: 'Close rate' },
      ]}
      highlights={[
        'Lead discovery', 'Account search', 'Smart lists',
        'Outreach sequences', 'CRM integration', 'Buying committees',
        'Relationship graphs', 'Signal feed',
      ]}
      features={[
        { title: 'Lead Discovery', desc: 'AI-powered search across the platform to find decision-makers and prospects.', icon: Search },
        { title: 'Smart Lists', desc: 'Dynamic lists that auto-update based on criteria and engagement signals.', icon: Target },
        { title: 'Outreach Sequences', desc: 'Multi-step email and InMail campaigns with templates and A/B testing.', icon: Zap },
        { title: 'CRM Dashboard', desc: 'Pipeline management with deal stages, tasks, and revenue forecasts.', icon: BarChart3 },
        { title: 'Buying Committees', desc: 'Map key stakeholders and track engagement across accounts.', icon: Users },
        { title: 'Signal Feed', desc: 'Real-time alerts for job changes, funding, and company updates.', icon: Shield },
      ]}
      ctaText="Try Sales Navigator"
      ctaHref="/sales-navigator"
      relatedProducts={[
        { label: 'Recruiter Pro', href: '/showcase/recruiter-pro', icon: UserCheck },
        { label: 'Enterprise Connect', href: '/showcase/enterprise-connect', icon: Users },
        { label: 'Gigvora Ads', href: '/showcase/ads', icon: Briefcase },
      ]}
    />
  );
}
