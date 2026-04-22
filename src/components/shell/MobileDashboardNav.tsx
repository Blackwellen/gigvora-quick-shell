import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Activity, Bookmark, ShoppingBag, FolderKanban, FileText,
  Calendar, Film, CreditCard, HelpCircle, Briefcase, DollarSign,
  Layers, Zap, Award, BarChart3, Users, Shield, Building2, UserCheck,
  Megaphone, Link2, AlertTriangle, Settings,
} from 'lucide-react';

interface NavItem { label: string; icon: React.ElementType; path: string; badge?: number }

const USER_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Activity', icon: Activity, path: '/dashboard/activity' },
  { label: 'Saved', icon: Bookmark, path: '/dashboard/saved' },
  { label: 'Orders', icon: ShoppingBag, path: '/dashboard/orders' },
  { label: 'Projects', icon: FolderKanban, path: '/dashboard/projects' },
  { label: 'Applications', icon: FileText, path: '/dashboard/applications' },
  { label: 'Bookings', icon: Calendar, path: '/dashboard/bookings' },
  { label: 'Billing', icon: CreditCard, path: '/dashboard/billing' },
];

const PRO_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Queue', icon: Zap, path: '/dashboard/work-queue', badge: 3 },
  { label: 'Listings', icon: Layers, path: '/dashboard/gigs' },
  { label: 'Orders', icon: ShoppingBag, path: '/dashboard/orders' },
  { label: 'Projects', icon: FolderKanban, path: '/dashboard/projects' },
  { label: 'Earnings', icon: DollarSign, path: '/dashboard/earnings' },
  { label: 'Performance', icon: Award, path: '/dashboard/profile' },
  { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
];

const ENT_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Hiring', icon: UserCheck, path: '/dashboard/hiring' },
  { label: 'Projects', icon: FolderKanban, path: '/dashboard/procurement' },
  { label: 'Vendors', icon: Building2, path: '/dashboard/vendors' },
  { label: 'Campaigns', icon: Megaphone, path: '/dashboard/campaigns' },
  { label: 'Spend', icon: DollarSign, path: '/dashboard/spend', badge: 5 },
  { label: 'Team', icon: Users, path: '/dashboard/team' },
  { label: 'Risk', icon: AlertTriangle, path: '/dashboard/risk' },
];

const ROLE_NAV: Record<string, NavItem[]> = { user: USER_NAV, professional: PRO_NAV, enterprise: ENT_NAV };

export const MobileDashboardNav: React.FC = () => {
  const { activeRole } = useRole();
  const { pathname } = useLocation();
  const items = ROLE_NAV[activeRole] || USER_NAV;

  const isActive = (path: string) => path === '/dashboard'
    ? (pathname === '/dashboard' || pathname === '/dashboard/overview')
    : pathname.startsWith(path);

  return (
    <div className="md:hidden border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
      <ScrollArea className="w-full">
        <div className="flex gap-1 px-3 py-2">
          {items.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap shrink-0 transition-colors',
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:bg-muted/40'
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                {item.badge && (
                  <span className="h-4 min-w-4 px-1 rounded-full bg-accent text-accent-foreground text-[8px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
