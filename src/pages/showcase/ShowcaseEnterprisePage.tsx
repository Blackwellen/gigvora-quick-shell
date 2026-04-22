import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Building2, Users, Shield, Star, BarChart3, Zap, Target, UserCheck, Briefcase } from 'lucide-react';
import productShot from '@/assets/product-shot-enterprise.jpg';

export default function ShowcaseEnterprisePage() {
  return (
    <ProductShowcasePage
      title="Enterprise Connect"
      tagline="Startup showcases, advisor marketplace, business plan vaults, partnership management, and client success tracking for growing organizations."
      description="B2B networking at scale — procurement discovery, partner matching, warm introductions, and trust-scored business networking."
      icon={Building2}
      color="text-[hsl(var(--gigvora-purple))]"
      bgColor="bg-[hsl(var(--gigvora-purple)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Enterprise Connect — B2B networking with procurement, partner discovery, and trust scoring"
      stats={[
        { value: '2,340+', label: 'Verified enterprises' },
        { value: '180+', label: 'Active partnerships' },
        { value: '94%', label: 'Match success' },
        { value: '$12M+', label: 'Deals facilitated' },
      ]}
      highlights={[
        'Enterprise directory', 'Procurement pipeline', 'Warm introductions',
        'Trust scoring', 'Startup showcases', 'Advisor marketplace',
        'Partnership management', 'Client success tracking',
      ]}
      features={[
        { title: 'Enterprise Directory', desc: 'Browse verified companies with detailed profiles and trust scores.', icon: Building2 },
        { title: 'Procurement Pipeline', desc: 'Discover vendors, compare proposals, and manage sourcing workflows.', icon: Target },
        { title: 'Warm Introductions', desc: 'Request and manage introductions through mutual connections.', icon: Users },
        { title: 'Trust Scoring', desc: 'Multi-factor trust scores based on verification, reviews, and activity.', icon: Shield },
        { title: 'Startup Showcases', desc: 'Showcase your startup to investors, advisors, and enterprise buyers.', icon: Star },
        { title: 'Partnership Analytics', desc: 'Track referrals, pipeline value, and partnership outcomes.', icon: BarChart3 },
      ]}
      ctaText="Explore Enterprise Connect"
      ctaHref="/enterprise-connect"
      relatedProducts={[
        { label: 'Sales Navigator', href: '/showcase/sales-navigator', icon: Target },
        { label: 'Recruiter Pro', href: '/showcase/recruiter-pro', icon: UserCheck },
        { label: 'Gigvora Ads', href: '/showcase/ads', icon: Briefcase },
      ]}
    />
  );
}
