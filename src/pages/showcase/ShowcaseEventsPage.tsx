import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Calendar, Users, Globe, Star, Zap, Video, Shield, Target } from 'lucide-react';
import productShot from '@/assets/product-shot-events.jpg';

export default function ShowcaseEventsPage() {
  return (
    <ProductShowcasePage
      title="Events & Webinars"
      tagline="Attend or host professional events — conferences, meetups, workshops, webinars, and speed networking sessions with built-in RSVP and live streaming."
      description="A full events platform with ticketing, virtual venue management, speaker management, and post-event analytics."
      icon={Calendar}
      color="text-[hsl(var(--gigvora-teal))]"
      bgColor="bg-[hsl(var(--gigvora-teal)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Events — Professional events with RSVP, live streaming, and networking"
      stats={[
        { value: '12', label: 'Upcoming events' },
        { value: '1', label: 'Live now' },
        { value: '4', label: 'Your RSVPs' },
        { value: '24', label: 'Past events' },
      ]}
      highlights={[
        'Event creation & RSVP', 'Live streaming & recording', 'Ticketing & registration',
        'Speaker management', 'Speed networking sessions', 'Workshop hosting',
        'Post-event analytics', 'Community building',
      ]}
      features={[
        { title: 'Event Builder', desc: 'Create conferences, workshops, webinars, and meetups with rich details.', icon: Calendar },
        { title: 'Live Streaming', desc: 'Built-in video for webinars and live sessions with chat and Q&A.', icon: Video },
        { title: 'RSVP & Ticketing', desc: 'Free and paid events with registration, waitlists, and seat management.', icon: Star },
        { title: 'Speed Networking', desc: 'Timed sessions at events for structured, high-value introductions.', icon: Zap },
        { title: 'Speaker Profiles', desc: 'Showcase speakers with bios, topics, and session schedules.', icon: Users },
        { title: 'Post-Event Insights', desc: 'Attendance, engagement, and follow-up analytics after every event.', icon: Globe },
      ]}
      ctaText="Browse Events"
      ctaHref="/events"
      relatedProducts={[
        { label: 'Networking', href: '/showcase/networking', icon: Users },
        { label: 'Mentorship', href: '/showcase/mentorship', icon: Star },
      ]}
    />
  );
}
