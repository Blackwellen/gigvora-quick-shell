import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { UserCheck, Search, Users, BarChart3, Video, Star, Target, Briefcase } from 'lucide-react';
import productShot from '@/assets/product-shot-recruiter.jpg';

export default function ShowcaseRecruiterPage() {
  return (
    <ProductShowcasePage
      title="Recruiter Pro"
      badge="Pro"
      tagline="Full applicant tracking system with talent search, candidate pipelines, video interviews, scorecards, outreach tools, and headhunter workflows."
      description="An enterprise-grade recruitment command center for internal hiring teams, agencies, and headhunters."
      icon={UserCheck}
      color="text-[hsl(var(--gigvora-blue))]"
      bgColor="bg-[hsl(var(--gigvora-blue)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Recruiter Pro — Full ATS with pipeline tracking, interviews, and hiring analytics"
      stats={[
        { value: '2M+', label: 'Talent pool' },
        { value: '40%', label: 'Time saved' },
        { value: '3.2x', label: 'Interview efficiency' },
        { value: '98%', label: 'Satisfaction' },
      ]}
      highlights={[
        'Advanced talent search', 'Candidate pipelines', 'Video interviews',
        'Interview scorecards', 'Outreach sequences', 'Talent pools',
        'Headhunter workspace', 'Hiring analytics',
      ]}
      features={[
        { title: 'AI Talent Search', desc: 'Search the entire platform with AI-ranked results based on skills and fit.', icon: Search },
        { title: 'Pipeline Board', desc: 'Kanban-style candidate tracking through customizable hiring stages.', icon: Target },
        { title: 'Video Interviews', desc: 'Scheduled and on-demand video interviews with recording.', icon: Video },
        { title: 'Scorecards', desc: 'Structured evaluation with team collaboration and weighted criteria.', icon: Star },
        { title: 'Outreach Sequences', desc: 'Multi-step candidate outreach with templates and tracking.', icon: Users },
        { title: 'Hiring Analytics', desc: 'Pipeline metrics, time-to-hire, source effectiveness, and team performance.', icon: BarChart3 },
      ]}
      ctaText="Try Recruiter Pro"
      ctaHref="/recruiter-pro"
      relatedProducts={[
        { label: 'Jobs', href: '/showcase/jobs', icon: Briefcase },
        { label: 'Sales Navigator', href: '/showcase/sales-navigator', icon: Target },
        { label: 'Enterprise Connect', href: '/showcase/enterprise-connect', icon: Users },
      ]}
    />
  );
}
