import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Rocket, Target, Star, Users, BarChart3, Calendar, Shield, GraduationCap } from 'lucide-react';
import productShot from '@/assets/product-shot-launchpad.jpg';

export default function ShowcaseLaunchpadPage() {
  return (
    <ProductShowcasePage
      title="Experience Launchpad"
      tagline="Guided pathways for graduates, career changers, and school leavers — find mentored opportunities, build your portfolio, and launch your career."
      description="A full experience-building ecosystem with opportunities, pathways, challenges, mentors, and portfolio tools designed for emerging professionals."
      icon={Rocket}
      color="text-[hsl(var(--gigvora-teal))]"
      bgColor="bg-[hsl(var(--gigvora-teal)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Experience Launchpad — Career readiness with pathways, mentors, and portfolio builder"
      stats={[
        { value: '72%', label: 'Career ready' },
        { value: '4', label: 'Mentor sessions' },
        { value: '3', label: 'Projects done' },
        { value: '6', label: 'Badges earned' },
      ]}
      highlights={[
        'Career readiness scoring', 'Structured pathways', 'Mentor matching',
        'Portfolio builder', 'Skill challenges', 'Event access',
        'Application tracking', 'Progress dashboard',
      ]}
      features={[
        { title: 'Pathways', desc: 'Structured tracks for graduates, career changers, and school leavers.', icon: Target },
        { title: 'Mentor Matching', desc: 'Find and book sessions with mentors matched to your career goals.', icon: Users },
        { title: 'Portfolio Builder', desc: 'Showcase challenges, projects, badges, and work samples.', icon: Star },
        { title: 'Skill Challenges', desc: 'Complete real-world tasks to build proof of competence.', icon: Shield },
        { title: 'Progress Dashboard', desc: 'Track readiness score, milestones, and recommended next steps.', icon: BarChart3 },
        { title: 'Events & Networking', desc: 'Access workshops, AMAs, and speed networking for early-career talent.', icon: Calendar },
      ]}
      ctaText="Start Your Journey"
      ctaHref="/launchpad"
      relatedProducts={[
        { label: 'Mentorship', href: '/showcase/mentorship', icon: GraduationCap },
        { label: 'Jobs', href: '/showcase/jobs', icon: Target },
        { label: 'Networking', href: '/showcase/networking', icon: Users },
      ]}
    />
  );
}
