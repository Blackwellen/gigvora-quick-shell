import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Route label map — maps route segments to human-readable labels.
 * Falls back to title-casing the segment.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  feed: 'Feed',
  jobs: 'Jobs',
  gigs: 'Gigs',
  services: 'Services',
  projects: 'Projects',
  events: 'Events',
  webinars: 'Webinars',
  podcasts: 'Podcasts',
  groups: 'Groups',
  inbox: 'Inbox',
  messages: 'Messages',
  settings: 'Settings',
  profile: 'Profile',
  admin: 'Admin',
  finance: 'Finance',
  billing: 'Billing',
  invoices: 'Invoices',
  ads: 'Ads Manager',
  ai: 'AI Tools',
  recruiter: 'Recruiter Pro',
  sales: 'Sales Navigator',
  enterprise: 'Enterprise',
  hire: 'Hiring',
  explore: 'Explore',
  analytics: 'Analytics',
  contracts: 'Contracts',
  disputes: 'Disputes',
  support: 'Support',
  learn: 'Learning',
  community: 'Community',
  launchpad: 'Launchpad',
  calendar: 'Calendar',
  work: 'Work Hub',
  media: 'Media',
  interactive: 'Interactive',
  escrow: 'Escrow',
  notifications: 'Notifications',
  saved: 'Saved',
  purchases: 'Purchases',
  donations: 'Donations',
  pages: 'Pages',
  calls: 'Calls',
  documents: 'Documents',
  volunteering: 'Volunteering',
  trust: 'Trust & Safety',
  agency: 'Agency',
  geo: 'Geo Intel',
  'creation-studio': 'Creation Studio',
  create: 'Create',
  company: 'Company',
  auth: 'Auth',
  legal: 'Legal',
  mentorship: 'Mentorship',
};

/** Top-level routes that should NOT show a back button (they are root sections) */
const ROOT_ROUTES = new Set([
  '/', '/dashboard', '/feed', '/landing', '/signin', '/signup',
  '/onboarding', '/about', '/pricing', '/contact', '/faq',
  '/terms', '/privacy', '/support', '/solutions', '/product',
]);

function titleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getSegmentLabel(segment: string): string {
  return SEGMENT_LABELS[segment] || titleCase(segment);
}

function getParentPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return '/dashboard';
  return '/' + segments.slice(0, -1).join('/');
}

function getBreadcrumbs(pathname: string): Array<{ label: string; path: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; path: string }> = [];
  
  for (let i = 0; i < segments.length; i++) {
    const path = '/' + segments.slice(0, i + 1).join('/');
    crumbs.push({ label: getSegmentLabel(segments[i]), path });
  }
  
  return crumbs;
}

export const AutoBackNav: React.FC<{ className?: string }> = ({ className }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Don't show on root routes
  if (ROOT_ROUTES.has(pathname)) return null;

  const segments = pathname.split('/').filter(Boolean);
  // Don't show on single-segment routes (they ARE the section home)
  if (segments.length <= 1) return null;

  const parentPath = getParentPath(pathname);
  const crumbs = getBreadcrumbs(pathname);
  const currentLabel = crumbs[crumbs.length - 1]?.label || '';
  const parentCrumbs = crumbs.slice(0, -1);

  return (
    <div className={cn('flex items-center gap-1.5 mb-3 animate-in fade-in slide-in-from-left-1 duration-200', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] gap-1 rounded-xl px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="h-3 w-3" />
        Back
      </Button>

      <div className="h-4 w-px bg-border/50 mx-1" />

      <nav className="flex items-center gap-1 text-[10px] text-muted-foreground overflow-x-auto">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
        >
          <Home className="h-3 w-3" />
        </Link>

        {parentCrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            <span className="text-[8px] text-muted-foreground/40 shrink-0">/</span>
            <Link
              to={crumb.path}
              className="hover:text-foreground transition-colors shrink-0 truncate max-w-[120px]"
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}

        <span className="text-[8px] text-muted-foreground/40 shrink-0">/</span>
        <span className="text-foreground font-medium shrink-0 truncate max-w-[180px]">
          {currentLabel}
        </span>
      </nav>
    </div>
  );
};
