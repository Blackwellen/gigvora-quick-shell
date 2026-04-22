import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Shield, ChevronRight, User, Globe, BarChart3,
  Wallet, Calendar, CreditCard, Settings, Headphones,
  Bookmark, Terminal, Building2, Briefcase,
  Layers, Users, ExternalLink, Check,
  Store, Package, DollarSign, Search, UserCheck,
  Palette, Star, Sparkles, MessageSquare, Target,
  ShoppingCart, Activity,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ROLE_CONFIGS } from '@/types/role';
import { ROLE_MENU_ITEMS } from '@/data/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/role';

/* ─── Menu item definition ─── */
interface MenuItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  destructive?: boolean;
}

const COMMON_ITEMS: MenuItem[] = [
  { label: 'View Profile', icon: User, href: '/profile' },
  { label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
  { label: 'Inbox', icon: MessageSquare, href: '/inbox' },
  { label: 'Saved Items', icon: Bookmark, href: '/dashboard/saved' },
];

const FINANCE_ITEMS: MenuItem[] = [
  { label: 'Wallet & Credits', icon: Wallet, href: '/finance/wallet' },
  { label: 'Billing', icon: CreditCard, href: '/finance/billing' },
  { label: 'Bookings', icon: Calendar, href: '/calendar' },
];

const FOOTER_ITEMS: MenuItem[] = [
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help & Support', icon: Headphones, href: '/help' },
];

/* ─── Shared menu content ─── */
const MenuContent: React.FC<{
  user: any;
  initials: string;
  activeRole: UserRole;
  setActiveRole: (r: UserRole) => void;
  activeOrg: any;
  orgs: any[];
  setActiveOrg: (o: any) => void;
  recentItems: any[];
  onNavigate: (path: string) => void;
  onLogout: () => void;
  hasEntitlement: (e: string) => boolean;
  className?: string;
}> = ({
  user, initials, activeRole, setActiveRole,
  activeOrg, orgs, setActiveOrg, recentItems,
  onNavigate, onLogout, hasEntitlement, className,
}) => {
  const [showRoles, setShowRoles] = useState(false);
  const [showOrgs, setShowOrgs] = useState(false);

  const roleItems = ROLE_MENU_ITEMS[activeRole];

  return (
    <div className={cn('flex flex-col', className)}>
      {/* ── Profile preview ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-accent/20">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{user?.name || 'User'}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge className="text-[7px] h-4 bg-accent/10 text-accent border-0 rounded-lg px-1.5">
                {ROLE_CONFIGS[activeRole].label}
              </Badge>
              {activeOrg && (
                <Badge variant="outline" className="text-[7px] h-4 rounded-lg px-1.5">
                  {activeOrg.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-3" />

      {/* ── Switch Role ── */}
      <div className="px-2 pt-2 pb-0.5">
        <button
          onClick={() => { setShowRoles(!showRoles); setShowOrgs(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted/50 transition-all"
        >
          <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Users className="h-3 w-3 text-accent" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[10px] font-semibold">Switch Role</div>
            <div className="text-[8px] text-muted-foreground">{ROLE_CONFIGS[activeRole].label}</div>
          </div>
          <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', showRoles && 'rotate-90')} />
        </button>
        {showRoles && (
          <div className="ml-3 pl-3 border-l border-border space-y-0.5 py-1 animate-in slide-in-from-top-2 duration-200">
            {(Object.keys(ROLE_CONFIGS) as UserRole[]).map(role => {
              const cfg = ROLE_CONFIGS[role];
              const active = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => { setActiveRole(role); setShowRoles(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] transition-all',
                    active ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-muted/50 text-foreground/80'
                  )}
                >
                  <span className="flex-1 text-left">{cfg.label}</span>
                  {active && <Check className="h-3 w-3 text-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Switch Organization ── */}
      <div className="px-2 pb-1">
        <button
          onClick={() => { setShowOrgs(!showOrgs); setShowRoles(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted/50 transition-all"
        >
          <div className="h-6 w-6 rounded-lg bg-[hsl(var(--gigvora-purple)/0.1)] flex items-center justify-center shrink-0">
            <Building2 className="h-3 w-3 text-[hsl(var(--gigvora-purple))]" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[10px] font-semibold">Switch Workspace</div>
            <div className="text-[8px] text-muted-foreground">{activeOrg?.name || 'Personal'}</div>
          </div>
          <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', showOrgs && 'rotate-90')} />
        </button>
        {showOrgs && (
          <div className="ml-3 pl-3 border-l border-border space-y-0.5 py-1 animate-in slide-in-from-top-2 duration-200">
            {orgs.map(org => {
              const active = activeOrg?.id === org.id;
              return (
                <button
                  key={org.id}
                  onClick={() => { setActiveOrg(org); setShowOrgs(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] transition-all',
                    active ? 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))] font-semibold' : 'hover:bg-muted/50 text-foreground/80'
                  )}
                >
                  <span className="flex-1 text-left">{org.name}</span>
                  <span className="text-[7px] text-muted-foreground">{org.role}</span>
                  {active && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-px bg-border mx-3" />

      {/* ── Role-specific section ── */}
      {roleItems && (
        <>
          <div className="px-2 py-1.5">
            <div className="px-3 py-0.5 text-[7px] uppercase tracking-widest text-muted-foreground font-bold">{roleItems.title}</div>
            {roleItems.items.map(item => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.href)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] hover:bg-muted/50 transition-all group"
              >
                <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.badge && <Badge variant="outline" className="text-[6px] h-3.5 rounded-md">{item.badge}</Badge>}
              </button>
            ))}
          </div>
          <div className="h-px bg-border mx-3" />
        </>
      )}

      {/* ── Common items ── */}
      <div className="px-2 py-1.5">
        <div className="px-3 py-0.5 text-[7px] uppercase tracking-widest text-muted-foreground font-bold">Profile</div>
        {COMMON_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.href)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] hover:bg-muted/50 transition-all group"
          >
            <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-border mx-3" />

      {/* ── Finance ── */}
      <div className="px-2 py-1.5">
        <div className="px-3 py-0.5 text-[7px] uppercase tracking-widest text-muted-foreground font-bold">Finance & Bookings</div>
        {FINANCE_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.href)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] hover:bg-muted/50 transition-all group"
          >
            <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-border mx-3" />

      {/* Recent section removed to keep dropdown compact */}


      {/* ── Settings & Support ── */}
      <div className="px-2 py-1.5">
        {FOOTER_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.href)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] hover:bg-muted/50 transition-all group"
          >
            <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
          </button>
        ))}

        {/* Admin access removed — internal admin uses separate login portal at /admin/login */}
      </div>

      <div className="h-px bg-border mx-3" />

      {/* ── Sign Out ── */}
      <div className="px-2 py-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-medium text-destructive hover:bg-destructive/5 transition-all"
        >
          <LogOut className="h-3 w-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   AvatarDropdown — desktop popover / mobile sheet
   ═══════════════════════════════════════════════════════════ */
export const AvatarDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeRole, setActiveRole, hasEntitlement } = useRole();
  const { activeOrg, availableOrgs, setActiveOrg, recentItems } = useWorkspace();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const sharedProps = {
    user,
    initials,
    activeRole,
    setActiveRole,
    activeOrg,
    orgs: availableOrgs,
    setActiveOrg,
    recentItems,
    onNavigate: handleNavigate,
    onLogout: handleLogout,
    hasEntitlement,
  };

  const triggerButton = (
    <button
      className="relative h-8 w-8 rounded-full ring-2 ring-border hover:ring-accent transition-all focus:outline-none"
      onClick={isMobile ? () => setMobileOpen(true) : undefined}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar} alt={user?.name} />
        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
      </Avatar>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="w-[300px] p-0">
            <SheetHeader className="px-4 pt-4 pb-0">
              <SheetTitle className="text-sm">Account</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <MenuContent {...sharedProps} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] p-0">
        <MenuContent {...sharedProps} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
