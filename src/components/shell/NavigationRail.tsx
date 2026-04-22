import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Briefcase, FileText, Layers, Users, Search, MessageSquare,
  Calendar, BarChart3, Wallet, Building2, Target, UserCheck, Megaphone,
  Palette, Settings, Pin, Star,
  Store, GraduationCap, Headphones, Radio,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const CORE_NAV: NavItem[] = [
  { label: 'Home', icon: Home, path: '/feed' },
  { label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { label: 'Inbox', icon: MessageSquare, path: '/inbox', badge: 5 },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
];

const ROLE_SECTIONS: Record<string, NavSection[]> = {
  user: [
    { title: 'Discover', items: [
      { label: 'Explorer', icon: Search, path: '/explore' },
      { label: 'Services', icon: Store, path: '/services' },
      { label: 'Jobs', icon: Briefcase, path: '/jobs' },
      { label: 'Gigs', icon: Layers, path: '/gigs' },
    ]},
    { title: 'Hiring', items: [
      { label: 'Post Project', icon: FileText, path: '/projects/create' },
      { label: 'Post Job', icon: Briefcase, path: '/jobs/create' },
      { label: 'Proposals', icon: FileText, path: '/dashboard/proposals' },
      { label: 'Active Work', icon: Layers, path: '/projects' },
      { label: 'Shortlist', icon: Star, path: '/dashboard/shortlist' },
    ]},
    { title: 'Personal', items: [
      { label: 'Saved', icon: Star, path: '/saved' },
      { label: 'Networking', icon: Users, path: '/networking' },
      { label: 'Learn', icon: GraduationCap, path: '/learn' },
    ]},
    { title: 'Finance', items: [
      { label: 'Finance Hub', icon: Wallet, path: '/finance' },
      { label: 'Orders', icon: FileText, path: '/orders' },
      { label: 'Contracts', icon: FileText, path: '/contracts' },
    ]},
  ],
  professional: [
    { title: 'Work', items: [
      { label: 'Jobs', icon: Briefcase, path: '/jobs' },
      { label: 'Gigs', icon: Layers, path: '/gigs' },
      { label: 'Services', icon: Store, path: '/services' },
      { label: 'Projects', icon: FileText, path: '/projects' },
      { label: 'Orders', icon: FileText, path: '/orders' },
      { label: 'Availability', icon: Target, path: '/candidate/availability' },
    ]},
    { title: 'Create & Media', items: [
      { label: 'Creation Studio', icon: Palette, path: '/creation-studio' },
      { label: 'Documents', icon: FileText, path: '/documents' },
      { label: 'Post', icon: FileText, path: '/post/compose' },
      { label: 'Webinars', icon: Headphones, path: '/webinars' },
      { label: 'Podcasts', icon: Radio, path: '/podcasts' },
      { label: 'Media Library', icon: Palette, path: '/dashboard/media' },
      { label: 'Interactive', icon: Radio, path: '/interactive' },
    ]},
    { title: 'Grow', items: [
      { label: 'Recruiting', icon: UserCheck, path: '/recruiter-pro' },
      { label: 'Ads', icon: Megaphone, path: '/ads' },
      { label: 'Explorer', icon: Search, path: '/explore' },
    ]},
    { title: 'Network', items: [
      { label: 'Networking', icon: Users, path: '/networking' },
      { label: 'Groups', icon: Users, path: '/groups' },
      { label: 'Mentorship', icon: GraduationCap, path: '/mentorship' },
    ]},
    { title: 'Finance', items: [
      { label: 'Finance Hub', icon: Wallet, path: '/finance' },
      { label: 'Contracts', icon: FileText, path: '/contracts' },
    ]},
  ],
  enterprise: [
    { title: 'Talent & Sales', items: [
      { label: 'Recruiter Pro', icon: UserCheck, path: '/recruiter-pro' },
      { label: 'Sales Navigator', icon: Target, path: '/navigator' },
      { label: 'Enterprise Connect', icon: Building2, path: '/enterprise-connect' },
    ]},
    { title: 'Marketplace', items: [
      { label: 'Jobs', icon: Briefcase, path: '/jobs' },
      { label: 'Gigs', icon: Layers, path: '/gigs' },
      { label: 'Services', icon: Store, path: '/services' },
      { label: 'Projects', icon: FileText, path: '/projects' },
    ]},
    { title: 'Create & Promote', items: [
      { label: 'Gigvora Ads', icon: Megaphone, path: '/ads' },
      { label: 'Creation Studio', icon: Palette, path: '/creation-studio' },
    ]},
    { title: 'Organization', items: [
      { label: 'Team', icon: Users, path: '/org' },
      { label: 'Finance', icon: Wallet, path: '/finance' },
      { label: 'Networking', icon: Users, path: '/networking' },
    ]},
  ],
  admin: [
    { title: 'Operations', items: [
      { label: 'Admin Home', icon: BarChart3, path: '/admin' },
      { label: 'Users', icon: Users, path: '/admin/users' },
      { label: 'Moderation', icon: FileText, path: '/admin/moderation' },
      { label: 'Trust & Safety', icon: Target, path: '/admin/trust-safety' },
    ]},
    { title: 'Finance & Support', items: [
      { label: 'Finance Ops', icon: Wallet, path: '/admin/finance' },
      { label: 'Support Ops', icon: FileText, path: '/admin/support' },
      { label: 'Verification', icon: FileText, path: '/admin/verification' },
    ]},
  ],
};

const NavItemButton: React.FC<{
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}> = ({ item, collapsed, active }) => {
  const content = (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-2.5 rounded-xl transition-all duration-200 relative group',
        collapsed ? 'justify-center h-9 w-9 mx-auto' : 'px-2.5 py-1.5 mx-1',
        active
          ? 'bg-accent/10 text-accent font-medium shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:-translate-y-px'
      )}
    >
      <item.icon className={cn('shrink-0 transition-transform duration-200', collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5', active && 'scale-110')} />
      {!collapsed && <span className="text-[11px] truncate">{item.label}</span>}
      {item.badge && item.badge > 0 && (
        <span className={cn(
          'rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center animate-in fade-in-50',
          collapsed ? 'absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5' : 'ml-auto h-4 min-w-4 px-1 text-[9px]'
        )}>
          {item.badge}
        </span>
      )}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-accent transition-all duration-300" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs rounded-xl">
          {item.label}
          {item.badge ? ` (${item.badge})` : ''}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export const NavigationRail: React.FC = () => {
  const { pathname } = useLocation();
  const { activeRole } = useRole();
  const { sidebarCollapsed, setSidebarCollapsed, savedViews } = useWorkspace();
  const sections = ROLE_SECTIONS[activeRole] || ROLE_SECTIONS['user'];
  const pinnedViews = savedViews.filter(v => v.pinned);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-sidebar/80 backdrop-blur-sm shrink-0 transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[var(--nav-rail-collapsed)]' : 'w-[var(--nav-rail-width)]'
      )}
      style={{ height: 'calc(100vh - var(--topbar-height) - var(--megamenu-height))' }}
    >
      <ScrollArea className="flex-1">
        <div className={cn('py-2.5', sidebarCollapsed ? 'px-1' : 'px-1')}>
          {/* Core nav */}
          <div className="space-y-0.5">
            {CORE_NAV.map(item => (
              <NavItemButton key={item.path} item={item} collapsed={sidebarCollapsed} active={isActive(item.path)} />
            ))}
          </div>

          <Separator className="my-2.5 mx-2" />

          {/* Pinned views */}
          {pinnedViews.length > 0 && (
            <>
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </div>
              )}
              <div className="space-y-0.5">
                {pinnedViews.map(view => (
                  <NavItemButton
                    key={view.id}
                    item={{ label: view.label, icon: Star, path: view.route }}
                    collapsed={sidebarCollapsed}
                    active={isActive(view.route)}
                  />
                ))}
              </div>
              <Separator className="my-2.5 mx-2" />
            </>
          )}

          {/* Role-specific sections */}
          {sections.map(section => (
            <div key={section.title} className="mb-1.5">
              {!sidebarCollapsed && (
                <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {section.title}
                </div>
              )}
              {sidebarCollapsed && <Separator className="my-1.5 mx-2" />}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItemButton key={item.path} item={item} collapsed={sidebarCollapsed} active={isActive(item.path)} />
                ))}
              </div>
            </div>
          ))}

          <Separator className="my-2.5 mx-2" />

          {/* Bottom items */}
          <div className="space-y-0.5">
            <NavItemButton
              item={{ label: 'Support', icon: Headphones, path: '/help' }}
              collapsed={sidebarCollapsed}
              active={isActive('/help')}
            />
            <NavItemButton
              item={{ label: 'Settings', icon: Settings, path: '/settings' }}
              collapsed={sidebarCollapsed}
              active={isActive('/settings')}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t p-2 flex justify-center">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-xl hover:bg-muted/50 text-muted-foreground transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {sidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
};
