import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Layers, Star, Shield, Zap, Palette, BarChart3, Users, Briefcase, FileText } from 'lucide-react';
import productShot from '@/assets/product-shot-gigs.jpg';

export default function ShowcaseGigsPage() {
  return (
    <ProductShowcasePage
      title="Gigs Marketplace"
      tagline="Offer and purchase productized services through three-tier gig packages, manage orders with full timelines, and protect transactions with escrow."
      description="A marketplace built for professionals to sell their expertise as packaged services with clear pricing, delivery timelines, and buyer protection."
      icon={Layers}
      color="text-[hsl(var(--gigvora-teal))]"
      bgColor="bg-[hsl(var(--gigvora-teal)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Gigs — Freelance service marketplace with packages, ratings, and escrow protection"
      stats={[
        { value: '8K+', label: 'Active gigs' },
        { value: '1,154', label: 'Total orders' },
        { value: '4.8', label: 'Avg rating' },
        { value: '6', label: 'Verified sellers' },
      ]}
      highlights={[
        'Three-tier package builder', 'Full order timeline', 'Escrow protection',
        'Performance analytics', 'Seller verification', 'Custom offers',
        'Category browsing', 'Top seller rankings',
      ]}
      features={[
        { title: 'Package Builder', desc: 'Create Basic, Standard, and Premium tiers with clear scope and pricing.', icon: Layers },
        { title: 'Escrow Protection', desc: 'Funds are held securely until delivery is confirmed by the buyer.', icon: Shield },
        { title: 'Order Management', desc: 'Track progress, communicate, and manage revisions in one timeline.', icon: BarChart3 },
        { title: 'Seller Analytics', desc: 'Revenue, conversion rates, and performance metrics at a glance.', icon: Star },
        { title: 'Custom Offers', desc: 'Send personalized proposals and quotes for unique client needs.', icon: Palette },
        { title: 'Buyer Discovery', desc: 'Category-based browsing with filters, trending tags, and AI recommendations.', icon: Zap },
      ]}
      ctaText="Browse Gigs"
      ctaHref="/gigs"
      relatedProducts={[
        { label: 'Services', href: '/showcase/services', icon: Briefcase },
        { label: 'Projects', href: '/showcase/projects', icon: FileText },
        { label: 'Jobs', href: '/showcase/jobs', icon: Briefcase },
      ]}
    />
  );
}
