import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Store, Calendar, BarChart3, Shield, Star, Zap, Layers, Briefcase } from 'lucide-react';
import productShot from '@/assets/product-shot-services.jpg';

export default function ShowcaseServicesPage() {
  return (
    <ProductShowcasePage
      title="Services Marketplace"
      tagline="Professional consultative services with booking-based or custom-quoted pricing. Book consultations, request proposals, and manage ongoing service engagements."
      description="A catalogue of productized and custom services with full order management, analytics, and buyer protection."
      icon={Store}
      color="text-[hsl(var(--gigvora-green))]"
      bgColor="bg-[hsl(var(--gigvora-green)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Services — Professional service catalogue with orders, analytics, and booking"
      stats={[
        { value: '5', label: 'Published services' },
        { value: '$207K', label: 'Revenue (30d)' },
        { value: '373', label: 'Orders (30d)' },
        { value: '5.2%', label: 'Conversion' },
      ]}
      highlights={[
        'Productized services', 'Custom quote requests', 'Service portfolios',
        'Client management', 'Booking system', 'Bundle creation',
        'Order tracking', 'Revenue analytics',
      ]}
      features={[
        { title: 'Service Builder', desc: 'Create productized services with tiers, add-ons, and custom pricing.', icon: Layers },
        { title: 'Booking System', desc: 'Calendar-based booking for consultations and recurring sessions.', icon: Calendar },
        { title: 'Bundle Creation', desc: 'Package multiple services into bundles for higher-value deals.', icon: Store },
        { title: 'Order Management', desc: 'Track every order from purchase to delivery with status updates.', icon: Shield },
        { title: 'Revenue Analytics', desc: 'Track revenue, conversion rates, and top-performing services.', icon: BarChart3 },
        { title: 'Buyer Protection', desc: 'Satisfaction guarantee, free revisions, and dispute resolution.', icon: Star },
      ]}
      ctaText="Browse Services"
      ctaHref="/services"
      relatedProducts={[
        { label: 'Gigs', href: '/showcase/gigs', icon: Layers },
        { label: 'Projects', href: '/showcase/projects', icon: Briefcase },
      ]}
    />
  );
}
