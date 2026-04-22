import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { GraduationCap, Star, Users, Shield, Zap, Calendar, Target, BarChart3 } from 'lucide-react';
import productShot from '@/assets/product-shot-mentorship.jpg';

export default function ShowcaseMentorshipPage() {
  return (
    <ProductShowcasePage
      title="Mentorship"
      tagline="Find expert advisors and mentors — book sessions, join mentorship programs, and accelerate your career with guided professional development."
      description="A full mentor marketplace with verified mentors, session booking, packages, and outcome tracking."
      icon={GraduationCap}
      color="text-[hsl(var(--gigvora-purple))]"
      bgColor="bg-[hsl(var(--gigvora-purple)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Mentorship — Mentor marketplace with booking, packages, and reviews"
      stats={[
        { value: '4', label: 'Featured mentors' },
        { value: '4.9', label: 'Avg rating' },
        { value: '2,180', label: 'Sessions delivered' },
        { value: '95%', label: 'Satisfaction' },
      ]}
      highlights={[
        'Mentor discovery', 'Session booking', 'Mentorship packages',
        'Client management', 'Notes hub', 'Outcome tracking',
        'Payouts', 'Verified mentors',
      ]}
      features={[
        { title: 'Mentor Discovery', desc: 'Search by expertise, industry, and availability with ratings and reviews.', icon: Target },
        { title: 'Session Booking', desc: 'Calendar-based booking with flexible scheduling and reminders.', icon: Calendar },
        { title: 'Mentorship Packages', desc: 'Structured programs with milestones, resources, and progress tracking.', icon: Star },
        { title: 'Outcome Tracking', desc: 'Track goals, milestones, and outcomes across mentorship engagements.', icon: BarChart3 },
        { title: 'Notes & Resources', desc: 'Shared notes hub with session summaries and recommended resources.', icon: Shield },
        { title: 'Become a Mentor', desc: 'Set up your profile, availability, and pricing to start mentoring.', icon: Users },
      ]}
      ctaText="Find a Mentor"
      ctaHref="/mentorship"
      relatedProducts={[
        { label: 'Experience Launchpad', href: '/showcase/launchpad', icon: Zap },
        { label: 'Networking', href: '/showcase/networking', icon: Users },
        { label: 'Events', href: '/showcase/events', icon: Calendar },
      ]}
    />
  );
}
