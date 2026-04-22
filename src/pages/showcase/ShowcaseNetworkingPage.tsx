import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Users, Zap, Star, Globe, Calendar, Shield, Briefcase, Target } from 'lucide-react';
import productShot from '@/assets/product-shot-networking.jpg';

export default function ShowcaseNetworkingPage() {
  return (
    <ProductShowcasePage
      title="Professional Networking"
      tagline="LinkedIn-level profiles, groups, events, speed networking with AI matching, live rooms, and a full mentor marketplace — all with built-in video."
      description="Build meaningful professional relationships through smart matching, live rooms, speed networking, and AI-powered follow-up reminders."
      icon={Users}
      color="text-[hsl(var(--gigvora-blue))]"
      bgColor="bg-[hsl(var(--gigvora-blue)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Networking — Professional networking hub with connections, rooms, and events"
      stats={[
        { value: '342', label: 'Connections' },
        { value: '1.2K', label: 'Followers' },
        { value: '28', label: 'Cards shared' },
        { value: '72%', label: 'Connection rate' },
      ]}
      highlights={[
        'Speed networking', 'Live rooms', 'Event hosting',
        'Mentor marketplace', 'Digital business cards', 'Follow-up center',
        'Warm introductions', 'Network analytics',
      ]}
      features={[
        { title: 'Speed Networking', desc: 'Timed 1:1 sessions with AI-matched professionals for rapid connections.', icon: Zap },
        { title: 'Live Rooms', desc: 'Audio/video rooms for discussions, panels, and casual networking.', icon: Globe },
        { title: 'Digital Cards', desc: 'Create and share professional identity cards with QR codes.', icon: Star },
        { title: 'Events', desc: 'Discover and host professional events, meetups, and conferences.', icon: Calendar },
        { title: 'Follow-Up Center', desc: 'Track and manage relationship actions with smart reminders.', icon: Shield },
        { title: 'Introductions', desc: 'Request and manage warm intros through mutual connections.', icon: Users },
      ]}
      ctaText="Start Networking"
      ctaHref="/networking"
      relatedProducts={[
        { label: 'Events & Webinars', href: '/showcase/events', icon: Calendar },
        { label: 'Mentorship', href: '/showcase/mentorship', icon: Star },
      ]}
    />
  );
}
