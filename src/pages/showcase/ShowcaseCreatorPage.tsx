import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Palette, BarChart3, Star, Globe, Zap, Users, Calendar, Video } from 'lucide-react';
import productShot from '@/assets/product-shot-creator.jpg';

export default function ShowcaseCreatorPage() {
  return (
    <ProductShowcasePage
      title="Creator Studio"
      tagline="Publish content, grow your audience, and monetize your expertise with AI-powered creation tools — articles, podcasts, webinars, live rooms, and ad campaigns."
      description="A complete content management and publishing platform with AI writing, scheduling, analytics, and audience growth tools."
      icon={Palette}
      color="text-[hsl(var(--gigvora-purple))]"
      bgColor="bg-[hsl(var(--gigvora-purple)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Creator Studio — Content management with publishing, analytics, and AI tools"
      stats={[
        { value: '10', label: 'Content items' },
        { value: '18.8K', label: 'Total views' },
        { value: '8.3%', label: 'Engagement' },
        { value: '$2,890', label: 'Revenue' },
      ]}
      highlights={[
        'AI writing tools', 'Content scheduling', 'Multi-format publishing',
        'Audience analytics', 'Revenue tracking', 'Template library',
        'Campaign creation', 'Live room hosting',
      ]}
      features={[
        { title: 'Multi-Format Publishing', desc: 'Create articles, podcasts, webinars, clips, newsletters, and campaigns.', icon: Palette },
        { title: 'AI Writing Assistant', desc: 'Generate, edit, and optimize content with AI-powered tools.', icon: Zap },
        { title: 'Content Calendar', desc: 'Schedule and manage content publication across all formats.', icon: Calendar },
        { title: 'Audience Analytics', desc: 'Track views, engagement, subscribers, and growth metrics.', icon: BarChart3 },
        { title: 'Monetization', desc: 'Revenue from subscriptions, ads, and premium content.', icon: Star },
        { title: 'Live Rooms', desc: 'Host live sessions, AMAs, and webinars with real-time engagement.', icon: Video },
      ]}
      ctaText="Start Creating"
      ctaHref="/creation-studio"
      relatedProducts={[
        { label: 'Podcasts', href: '/showcase/podcasts', icon: Globe },
        { label: 'Events', href: '/showcase/events', icon: Calendar },
      ]}
    />
  );
}
