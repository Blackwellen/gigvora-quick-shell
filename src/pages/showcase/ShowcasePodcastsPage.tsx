import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Headphones, Star, Globe, BarChart3, Zap, Users, Calendar, Palette } from 'lucide-react';
import productShot from '@/assets/product-shot-podcasts.jpg';

export default function ShowcasePodcastsPage() {
  return (
    <ProductShowcasePage
      title="Podcasts"
      tagline="Listen and learn from experts — discover shows, subscribe to series, and access live podcast sessions with built-in analytics and creator tools."
      description="A full podcast hub with show discovery, episode streaming, subscriptions, and creator studio for recording and publishing."
      icon={Headphones}
      color="text-[hsl(var(--gigvora-red))]"
      bgColor="bg-[hsl(var(--gigvora-red)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Podcasts — Show discovery, episodes, and creator studio"
      stats={[
        { value: '2.4K', label: 'Shows' },
        { value: '128', label: 'New episodes' },
        { value: '12', label: 'Subscribed' },
        { value: '8', label: 'Queue' },
      ]}
      highlights={[
        'Show discovery', 'Episode streaming', 'Subscriptions & queue',
        'Live podcasts', 'Creator studio', 'Analytics dashboard',
        'Series & playlists', 'Category browsing',
      ]}
      features={[
        { title: 'Show Discovery', desc: 'Browse by category, trending, and personalized recommendations.', icon: Globe },
        { title: 'Live Podcasts', desc: 'Join live recording sessions with real-time chat and Q&A.', icon: Zap },
        { title: 'Creator Studio', desc: 'Record, edit, and publish episodes directly from the platform.', icon: Palette },
        { title: 'Subscriptions', desc: 'Follow shows and get notified about new episodes and live sessions.', icon: Star },
        { title: 'Listener Analytics', desc: 'Track plays, completion rates, and audience demographics.', icon: BarChart3 },
        { title: 'Community', desc: 'Comment, rate, and discuss episodes with other listeners.', icon: Users },
      ]}
      ctaText="Browse Podcasts"
      ctaHref="/podcasts"
      relatedProducts={[
        { label: 'Events', href: '/showcase/events', icon: Calendar },
        { label: 'Creator Studio', href: '/showcase/creator-studio', icon: Palette },
      ]}
    />
  );
}
