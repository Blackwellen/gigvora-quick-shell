import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { Briefcase, Search, Users, FileText, Star, Shield, Zap, Target, BarChart3, Layers } from 'lucide-react';
import productShot from '@/assets/product-shot-jobs.jpg';

export default function ShowcaseJobsPage() {
  return (
    <ProductShowcasePage
      title="Jobs & Recruitment"
      tagline="Post and find job opportunities, manage applications with a full ATS, conduct video interviews, and build hiring pipelines with AI-powered talent matching."
      description="Whether you're hiring or searching, Gigvora Jobs gives you advanced filters, AI-ranked results, salary insights, and a seamless application experience."
      icon={Briefcase}
      color="text-[hsl(var(--gigvora-blue))]"
      bgColor="bg-[hsl(var(--gigvora-blue)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Jobs — Discovery and hiring with rich filters, salary data, and AI matching"
      stats={[
        { value: '50K+', label: 'Active jobs' },
        { value: '2M+', label: 'Candidates' },
        { value: '95%', label: 'Match accuracy' },
        { value: '40%', label: 'Faster hiring' },
      ]}
      highlights={[
        'AI-powered job matching', 'Full ATS with kanban pipelines', 'Video interview scheduling',
        'Scorecard evaluation', 'Salary insights and benchmarks', 'Job alerts and saved searches',
        'Application tracking', 'Company profiles and reviews',
      ]}
      features={[
        { title: 'AI Job Matching', desc: 'Our AI analyzes skills, experience, and preferences to surface the best-fit opportunities.', icon: Target },
        { title: 'Full ATS Pipeline', desc: 'Kanban-style applicant tracking with stages, notes, and team collaboration.', icon: Layers },
        { title: 'Video Interviews', desc: 'Schedule and conduct video interviews with recording and playback.', icon: Users },
        { title: 'Scorecard Evaluation', desc: 'Structured evaluation with customizable scorecards and team ratings.', icon: Star },
        { title: 'Salary Intelligence', desc: 'Market-rate benchmarks, compensation ranges, and negotiation insights.', icon: BarChart3 },
        { title: 'Smart Alerts', desc: 'Get notified about perfect-match jobs before anyone else.', icon: Zap },
      ]}
      ctaText="Start Hiring"
      ctaHref="/jobs"
      relatedProducts={[
        { label: 'Recruiter Pro', href: '/showcase/recruiter-pro', icon: Search },
        { label: 'Projects', href: '/showcase/projects', icon: FileText },
        { label: 'Gigs', href: '/showcase/gigs', icon: Layers },
      ]}
    />
  );
}
