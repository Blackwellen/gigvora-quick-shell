import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Rocket, Compass, Search, Briefcase, Map, Users, Calendar,
  FolderOpen, Trophy, BarChart3, Bookmark, Settings, Building2,
  FileText, GraduationCap, Target, Sparkles, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: '',
    items: [
      { label: 'Home', href: '/launchpad', icon: Rocket },
      { label: 'Discover', href: '/launchpad/discover', icon: Compass },
    ],
  },
  {
    title: 'EXPLORE',
    items: [
      { label: 'Opportunities', href: '/launchpad/opportunities', icon: Search, badge: '24', badgeColor: 'bg-accent/10 text-accent' },
      { label: 'Pathways', href: '/launchpad/pathways', icon: Map },
      { label: 'Mentors', href: '/launchpad/mentors', icon: Users },
      { label: 'Events', href: '/launchpad/events', icon: Calendar, badge: '3', badgeColor: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' },
      { label: 'Projects', href: '/launchpad/projects', icon: Briefcase },
      { label: 'Challenges', href: '/launchpad/challenges', icon: Trophy },
      { label: 'Jobs', href: '/launchpad/jobs', icon: GraduationCap },
    ],
  },
  {
    title: 'MY LAUNCHPAD',
    items: [
      { label: 'Portfolio', href: '/launchpad/portfolio', icon: FolderOpen },
      { label: 'Applications', href: '/launchpad/applications', icon: FileText, badge: '2', badgeColor: 'bg-accent/10 text-accent' },
      { label: 'Progress', href: '/launchpad/progress', icon: BarChart3 },
      { label: 'Saved', href: '/launchpad/saved', icon: Bookmark },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { label: 'Host Workspace', href: '/launchpad/enterprise', icon: Building2 },
      { label: 'Settings', href: '/launchpad/settings', icon: Settings },
    ],
  },
];

export const LaunchpadShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (href: string) => {
    if (href === '/launchpad') return currentPath === '/launchpad';
    return currentPath.startsWith(href);
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] max-w-[1600px] mx-auto px-2 lg:px-4">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r pr-3 py-4 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto scrollbar-none">
        {/* Branding */}
        <div className="flex items-center gap-2.5 px-3 mb-4">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-accent to-[hsl(var(--gigvora-purple))] flex items-center justify-center">
            <Rocket className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <div className="text-[12px] font-bold">Experience Launchpad</div>
            <div className="text-[8px] text-muted-foreground">Your pathway to work</div>
          </div>
        </div>

        {/* Readiness Widget */}
        <div className="mx-2 mb-4 rounded-2xl bg-gradient-to-br from-accent/5 to-[hsl(var(--gigvora-purple))]/5 border border-accent/10 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-semibold text-muted-foreground">Career Readiness</span>
            <span className="text-[11px] font-bold text-accent">72%</span>
          </div>
          <Progress value={72} className="h-1.5 rounded-full mb-1.5" />
          <div className="text-[7px] text-muted-foreground">3 steps to reach 80%</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-4' : ''}>
              {section.title && (
                <div className="px-3 mb-1 text-[8px] font-semibold text-muted-foreground/60 tracking-wider">{section.title}</div>
              )}
              {section.items.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-all',
                    isActive(item.href)
                      ? 'bg-accent/10 text-accent shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('h-3.5 w-3.5 shrink-0', isActive(item.href) ? 'text-accent' : '')} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge className={cn('text-[7px] h-4 px-1.5 border-0 rounded-lg', item.badgeColor || 'bg-muted text-muted-foreground')}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div className="mx-2 mt-4 rounded-2xl bg-gradient-to-br from-accent/10 to-[hsl(var(--gigvora-purple))]/10 border border-accent/20 p-3 text-center">
          <Sparkles className="h-5 w-5 text-accent mx-auto mb-1" />
          <div className="text-[9px] font-semibold mb-0.5">Need Guidance?</div>
          <div className="text-[7px] text-muted-foreground mb-2">AI can recommend your next step</div>
          <Link to="/launchpad/discover" className="inline-flex items-center gap-1 text-[8px] font-semibold text-accent hover:underline">
            Get Recommendations <ChevronRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 py-4 lg:pl-4">
        {children}
      </main>
    </div>
  );
};
