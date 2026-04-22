import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Bookmark, ShoppingBag, FolderKanban, FileText,
  Calendar, Film, CreditCard, HelpCircle, Settings, Briefcase, DollarSign,
  Layers, Zap, Award, BarChart3, Users, Shield, Building2, UserCheck,
  Megaphone, Link2, AlertTriangle, Clock,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  /** 'canvas' = in-dashboard, 'handoff' = opens canonical page */
  destination?: 'canvas' | 'handoff';
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

const USER_SECTIONS: SidebarSection[] = [
  { items: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Activity', icon: Activity, path: '/dashboard/activity' },
  ]},
  { title: 'Manage', items: [
    { label: 'Saved', icon: Bookmark, path: '/dashboard/saved' },
    { label: 'Orders & Purchases', icon: ShoppingBag, path: '/dashboard/orders' },
    { label: 'Projects', icon: FolderKanban, path: '/dashboard/projects' },
    { label: 'Applications', icon: FileText, path: '/dashboard/applications' },
    { label: 'Bookings', icon: Calendar, path: '/dashboard/bookings' },
  ]},
  { title: 'Library', items: [
    { label: 'Media Library', icon: Film, path: '/dashboard/media' },
  ]},
  { title: 'Account', items: [
    { label: 'Billing', icon: CreditCard, path: '/dashboard/billing' },
    { label: 'Support', icon: HelpCircle, path: '/dashboard/support' },
    { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ]},
];

const PROFESSIONAL_SECTIONS: SidebarSection[] = [
  { items: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Work Queue', icon: Zap, path: '/dashboard/work-queue', badge: 3 },
  ]},
  { title: 'Business', items: [
    { label: 'Gigs & Services', icon: Layers, path: '/dashboard/gigs' },
    { label: 'Orders', icon: ShoppingBag, path: '/dashboard/pro-orders' },
    { label: 'Projects & Proposals', icon: FolderKanban, path: '/dashboard/pro-projects' },
    { label: 'Bookings', icon: Calendar, path: '/dashboard/pro-bookings' },
  ]},
  { title: 'Growth', items: [
    { label: 'Earnings', icon: DollarSign, path: '/dashboard/earnings' },
    { label: 'Performance', icon: Award, path: '/dashboard/profile' },
    { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { label: 'Content & Media', icon: Film, path: '/dashboard/content' },
  ]},
  { title: 'Account', items: [
    { label: 'Credits & Billing', icon: CreditCard, path: '/dashboard/pro-billing' },
    { label: 'Settings', icon: Settings, path: '/dashboard/pro-settings' },
  ]},
];

const ENTERPRISE_SECTIONS: SidebarSection[] = [
  { items: [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  ]},
  { title: 'Operations', items: [
    { label: 'Hiring Ops', icon: UserCheck, path: '/dashboard/hiring' },
    { label: 'Projects & Procurement', icon: FolderKanban, path: '/dashboard/procurement' },
    { label: 'Vendors & Services', icon: Building2, path: '/dashboard/vendors' },
    { label: 'Campaigns & Growth', icon: Megaphone, path: '/dashboard/campaigns' },
  ]},
  { title: 'Finance & Team', items: [
    { label: 'Spend & Approvals', icon: DollarSign, path: '/dashboard/spend', badge: 5 },
    { label: 'Team Activity', icon: Users, path: '/dashboard/team' },
    { label: 'Enterprise Connect', icon: Link2, path: '/dashboard/connect' },
  ]},
  { title: 'Governance', items: [
    { label: 'Support & Risk', icon: AlertTriangle, path: '/dashboard/risk' },
    { label: 'Settings & Seats', icon: Settings, path: '/dashboard/ent-settings' },
  ]},
];

const ROLE_SECTIONS: Record<string, SidebarSection[]> = {
  user: USER_SECTIONS,
  professional: PROFESSIONAL_SECTIONS,
  enterprise: ENTERPRISE_SECTIONS,
};

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed = false, onToggle }) => {
  const { activeRole } = useRole();
  const { pathname } = useLocation();
  const sections = ROLE_SECTIONS[activeRole] || USER_SECTIONS;

  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path + '/'));
  const isExactDashboard = pathname === '/dashboard' || pathname === '/dashboard/overview';

  return (
    <aside className={cn(
      'hidden md:flex flex-col border-r bg-card/60 backdrop-blur-sm transition-all duration-300 shrink-0',
      collapsed ? 'w-[60px]' : 'w-[220px] lg:w-[240px]'
    )}>
      {/* Collapse toggle */}
      <div className="flex items-center justify-end px-2 py-2.5 border-b">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-xl hover:bg-muted/60 text-muted-foreground transition-colors"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="py-2 space-y-0.5">
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && !collapsed && (
                <div className="px-4 pt-4 pb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">{section.title}</span>
                </div>
              )}
              {section.title && collapsed && si > 0 && (
                <div className="mx-3 my-2 border-t border-muted/20" />
              )}
              {section.items.map((item) => {
                const active = item.path === '/dashboard' ? isExactDashboard : isActive(item.path);
                const isHandoff = item.destination === 'handoff';
                const content = (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 mx-2 px-3 py-2 rounded-2xl text-[11.5px] font-medium transition-all duration-150 group',
                      active
                        ? 'bg-[hsl(var(--gigvora-blue)/0.08)] text-[hsl(var(--gigvora-blue))] shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                      collapsed && 'justify-center px-0 mx-1'
                    )}
                  >
                    <item.icon className={cn('shrink-0 transition-colors', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4', active && 'text-[hsl(var(--gigvora-blue))]')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge className="h-[18px] min-w-[18px] px-1 text-[8px] rounded-full bg-accent text-accent-foreground font-bold">
                            {item.badge}
                          </Badge>
                        )}
                        {isHandoff && (
                          <span className="text-[8px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs font-medium">
                        {item.label}
                        {item.badge ? ` (${item.badge})` : ''}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return <React.Fragment key={item.path}>{content}</React.Fragment>;
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Sidebar footer — role indicator */}
      {!collapsed && (
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" />
            <span className="text-[9px] text-muted-foreground font-medium capitalize">{activeRole} Dashboard</span>
          </div>
        </div>
      )}
    </aside>
  );
};
