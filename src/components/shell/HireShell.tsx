import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Briefcase, Search, Users, Layers, Calendar, FileText,
  BarChart3, CreditCard, Settings, Target, Mail, Star,
  Shield, ChevronRight, Home, UserCheck,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Core',
    items: [
      { label: 'Command Center', href: '/hire', icon: Home },
      { label: 'Jobs', href: '/hire/jobs', icon: Briefcase, count: 12 },
      { label: 'Talent Search', href: '/hire/search', icon: Search },
      { label: 'Pipeline', href: '/hire/pipeline', icon: Layers, count: 47 },
    ],
  },
  {
    title: 'Process',
    items: [
      { label: 'Interviews', href: '/hire/interviews', icon: Calendar, count: 6, private: true },
      { label: 'Scorecards', href: '/hire/scorecards', icon: FileText, private: true },
      { label: 'Offers', href: '/hire/offers', icon: Target, count: 3 },
      { label: 'Outreach', href: '/hire/outreach', icon: Mail },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Talent Pools', href: '/hire/pools', icon: Star },
      { label: 'Match Center', href: '/hire/match', icon: UserCheck },
      { label: 'Hiring Team', href: '/hire/team', icon: Users, private: true },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Analytics', href: '/hire/analytics', icon: BarChart3 },
      { label: 'Billing & Seats', href: '/hire/billing', icon: CreditCard },
      { label: 'Settings', href: '/hire/settings', icon: Settings },
    ],
  },
];

interface HireShellProps {
  children: React.ReactNode;
  rightInspector?: React.ReactNode;
}

export const HireShell: React.FC<HireShellProps> = ({ children, rightInspector }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (href: string) => {
    if (href === '/hire') return currentPath === '/hire';
    return currentPath.startsWith(href);
  };

  return (
    <div className="flex gap-0 min-h-[calc(100vh-4rem)]">
      {/* Left Operations Rail */}
      <nav className="w-52 shrink-0 border-r border-border/40 bg-card/50 py-4 px-2 overflow-y-auto hidden lg:block">
        <div className="flex items-center gap-2 px-3 mb-4">
          <Shield className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
          <span className="text-xs font-bold tracking-tight">Recruitment</span>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            <div className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              {section.title}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all group',
                  isActive(item.href)
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className={cn('h-3 w-3 shrink-0', isActive(item.href) ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="flex-1">{item.label}</span>
                {item.private && (
                  <Shield className="h-2 w-2 text-muted-foreground/40" />
                )}
                {item.count != null && (
                  <span className={cn(
                    'text-[8px] font-semibold min-w-[16px] text-center rounded-full px-1',
                    isActive(item.href) ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  )}>
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Central Work Area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {children}
        </div>
      </div>

      {/* Right Inspector (optional) */}
      {rightInspector && (
        <aside className="w-72 shrink-0 border-l border-border/40 bg-card/30 p-3 overflow-y-auto hidden xl:block">
          {rightInspector}
        </aside>
      )}
    </div>
  );
};
