import React from 'react';
import ProductShowcasePage from '@/components/showcase/ProductShowcasePage';
import { FileText, Users, Zap, BarChart3, Shield, Layers, Target, Briefcase } from 'lucide-react';
import productShot from '@/assets/product-shot-projects.jpg';

export default function ShowcaseProjectsPage() {
  return (
    <ProductShowcasePage
      title="Projects Marketplace"
      tagline="Advanced project management with kanban boards, task delegation, milestones, in-project chat, and milestone-based escrow releases."
      description="Find and post project-based work. Submit proposals, collaborate with multi-freelancer teams, and track progress with AI-powered matching."
      icon={FileText}
      color="text-[hsl(var(--gigvora-purple))]"
      bgColor="bg-[hsl(var(--gigvora-purple)/0.08)]"
      screenshot={productShot}
      screenshotAlt="Gigvora Projects — Marketplace with AI matching, proposals, and project management"
      stats={[
        { value: '7', label: 'Open projects' },
        { value: '95%', label: 'Match accuracy' },
        { value: '$18K', label: 'Avg budget' },
        { value: '78%', label: 'Remote' },
      ]}
      highlights={[
        'AI-powered project matching', 'Proposal submission', 'Milestone escrow',
        'Kanban & timeline views', 'Multi-freelancer teams', 'In-project chat',
        'Skill assessment', 'Project comparison',
      ]}
      features={[
        { title: 'AI Matching', desc: 'Get matched to projects based on skills, experience, and availability.', icon: Target },
        { title: 'Proposal System', desc: 'Submit detailed proposals with portfolios, timelines, and pricing.', icon: FileText },
        { title: 'Milestone Escrow', desc: 'Payments released at each milestone for security and accountability.', icon: Shield },
        { title: 'Kanban Management', desc: 'Visual task boards with drag-and-drop for agile project management.', icon: Layers },
        { title: 'Team Collaboration', desc: 'Multi-freelancer teams with role assignment and task delegation.', icon: Users },
        { title: 'Market Insights', desc: 'Avg budget, top skills, and demand trends to price competitively.', icon: BarChart3 },
      ]}
      ctaText="Find Projects"
      ctaHref="/projects"
      relatedProducts={[
        { label: 'Gigs', href: '/showcase/gigs', icon: Layers },
        { label: 'Jobs', href: '/showcase/jobs', icon: Briefcase },
        { label: 'Services', href: '/showcase/services', icon: Briefcase },
      ]}
    />
  );
}
