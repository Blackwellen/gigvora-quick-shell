/**
 * AdminShell — single shell for the /admin terminal.
 *
 * Enterprise restyle (post-AD-016 audit):
 *   - softer chrome (bg-muted/30 instead of harsh borders, rounded-lg)
 *   - readable type scale (12–13px base instead of 7–9px)
 *   - role-aware sidebar (each role sees only its allowed sections)
 *   - role switcher gated to Super Admin only
 *   - real logout via useAdminAuth().logout()
 *   - removed cross-link to /admin/shell (was the visual recursion source)
 */

import React, { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAdminAuth, type AdminRole } from '@/lib/adminAuth';
import { toast } from 'sonner';
import { AdminNotificationTray } from '@/components/layout/AdminNotificationTray';
import { AdminTabBar } from '@/components/layout/AdminTabBar';
import { AdminIsolationGuard } from '@/components/layout/AdminIsolationGuard';
import { MessageUserDialog } from '@/components/admin/MessageUserDialog';
import {
  Shield, LayoutGrid, Search, HeadphonesIcon, Landmark,
  ShieldAlert, ShieldCheck, Gavel, Radio, FileText, Activity,
  Wifi, ChevronDown, PanelLeftClose, PanelLeft,
  List, UserCheck, LogOut, Flag, History, Megaphone,
  Lock, ExternalLink, Send,
} from 'lucide-react';

type EnvType = 'production' | 'staging' | 'sandbox';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  allowedRoles: AdminRole[];
}
interface NavSection { title: string; items: NavItem[]; }

const ALL_ROLES: AdminRole[] = [
  'super-admin', 'cs-admin', 'finance-admin', 'moderator',
  'trust-safety', 'dispute-mgr', 'ads-ops', 'compliance', 'marketing-admin',
];

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Portal Home', icon: LayoutGrid, path: '/admin', allowedRoles: ALL_ROLES },
      { label: 'Cross-team Triage', icon: Activity, path: '/admin/ops', badge: '9', allowedRoles: ALL_ROLES },
      { label: 'Entity Search', icon: Search, path: '/admin/search', allowedRoles: ALL_ROLES },
      { label: 'Audit Log', icon: History, path: '/admin/audit', allowedRoles: ['super-admin', 'compliance', 'trust-safety'] },
    ],
  },
  {
    title: 'Portals',
    items: [
      { label: 'Customer Service', icon: HeadphonesIcon, path: '/admin/cs', badge: '184', allowedRoles: ['super-admin', 'cs-admin'] },
      { label: 'Dispute Ops', icon: Gavel, path: '/admin/dispute-ops', badge: '12', allowedRoles: ['super-admin', 'dispute-mgr', 'cs-admin'] },
      { label: 'Finance', icon: Landmark, path: '/admin/finance', badge: '47', allowedRoles: ['super-admin', 'finance-admin', 'compliance'] },
      { label: 'Moderation', icon: ShieldAlert, path: '/admin/moderation', badge: '184', allowedRoles: ['super-admin', 'moderator', 'trust-safety'] },
      { label: 'Trust & Safety', icon: ShieldCheck, path: '/admin/trust-safety', badge: '6', allowedRoles: ['super-admin', 'trust-safety'] },
      { label: 'Verification', icon: UserCheck, path: '/admin/verification-compliance', badge: '14', allowedRoles: ['super-admin', 'trust-safety', 'compliance'] },
      { label: 'Marketing', icon: Megaphone, path: '/admin/marketing', badge: '18', allowedRoles: ['super-admin', 'marketing-admin', 'ads-ops'] },
      { label: 'Ads Ops', icon: Radio, path: '/admin/ads-ops', badge: '4', allowedRoles: ['super-admin', 'ads-ops', 'marketing-admin'] },
    ],
  },
  {
    title: 'Governance',
    items: [
      { label: 'Super Admin', icon: Shield, path: '/admin/super', allowedRoles: ['super-admin'] },
      { label: 'Feature Flags', icon: Flag, path: '/admin/super/flags', allowedRoles: ['super-admin'] },
      { label: 'Emergency Controls', icon: ShieldAlert, path: '/admin/super/emergency', allowedRoles: ['super-admin'] },
      { label: 'Compliance', icon: FileText, path: '/admin/verification-compliance', allowedRoles: ['super-admin', 'compliance'] },
    ],
  },
];

const ROLE_OPTIONS: { id: AdminRole; label: string; icon: React.ElementType }[] = [
  { id: 'super-admin', label: 'Super Admin', icon: Shield },
  { id: 'cs-admin', label: 'Customer Service', icon: HeadphonesIcon },
  { id: 'finance-admin', label: 'Finance Admin', icon: Landmark },
  { id: 'moderator', label: 'Moderator', icon: ShieldAlert },
  { id: 'trust-safety', label: 'Trust & Safety', icon: ShieldCheck },
  { id: 'dispute-mgr', label: 'Dispute Manager', icon: Gavel },
  { id: 'ads-ops', label: 'Ads Ops', icon: Radio },
  { id: 'marketing-admin', label: 'Marketing Admin', icon: Megaphone },
  { id: 'compliance', label: 'Compliance', icon: FileText },
];

export const AdminShell: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, switchRole, logout } = useAdminAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [env, setEnv] = useState<EnvType>(user?.env ?? 'production');
  const [mobileNav, setMobileNav] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const roleInfo = ROLE_OPTIONS.find((r) => r.id === activeRole) ?? ROLE_OPTIONS[0];
  const RoleIcon = roleInfo.icon;
  const isSuper = !!user?.isSuperAdmin;

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname === path || pathname.startsWith(path + '/');

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter((i) => i.allowedRoles.includes(activeRole)),
      })).filter((s) => s.items.length > 0),
    [activeRole],
  );

  const envChrome: Record<EnvType, string> = {
    production: 'bg-rose-500/5 text-rose-700 dark:text-rose-300 border-rose-500/20',
    staging: 'bg-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/20',
    sandbox: 'bg-sky-500/5 text-sky-700 dark:text-sky-300 border-sky-500/20',
  };

  const handleRoleSwitch = (next: AdminRole) => {
    try {
      switchRole(next);
      setRoleMenuOpen(false);
      toast.success(`Now viewing as ${ROLE_OPTIONS.find((r) => r.id === next)?.label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Role switch denied.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out of admin terminal.');
    navigate('/admin/login', { replace: true });
  };

  const NavContent = () => (
    <div className={cn('py-3', collapsed ? 'px-1' : 'px-2')}>
      {visibleSections.map((section) => (
        <div key={section.title} className="mb-4">
          {!collapsed && (
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
              {section.title}
            </div>
          )}
          {section.items.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setMobileNav(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg transition-all duration-150',
                  collapsed ? 'justify-center h-10 w-10 mx-auto my-1' : 'px-3 py-2 mx-1 my-0.5',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted/50',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-[13px] truncate flex-1">{item.label}</span>}
                {!collapsed && item.badge && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-[22px] justify-center px-1.5 text-[10px] font-medium tabular-nums"
                  >
                    {item.badge}
                  </Badge>
                )}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminIsolationGuard />
      {/* ─── Environment ribbon ─── */}
      <div className={cn('flex items-center gap-3 px-5 py-1.5 text-[11px] border-b', envChrome[env])}>
        <span className="flex items-center gap-1.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
          </span>
          <span className="font-semibold uppercase tracking-wider">{env}</span>
        </span>
        <span className="text-foreground/40">·</span>
        <span className="text-foreground/60">Internal Admin Terminal</span>
        <div className="flex-1" />
        {isSuper && (
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value as EnvType)}
            className="bg-transparent border-none text-[11px] font-medium cursor-pointer focus:outline-none"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="sandbox">Sandbox</option>
          </select>
        )}
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-foreground/60">
          <Wifi className="h-3 w-3" /> Connected
        </span>
      </div>

      {/* ─── Header ─── */}
      <header className="bg-background border-b px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors hidden md:block"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => setMobileNav(true)}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors md:hidden"
          aria-label="Open nav"
        >
          <List className="h-5 w-5 text-muted-foreground" />
        </button>

        <Link to="/admin" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Gigvora</div>
            <div className="text-[10px] text-muted-foreground hidden sm:block">Admin Terminal</div>
          </div>
        </Link>

        <button
          onClick={() => navigate('/admin/search')}
          className="flex-1 max-w-xl mx-2 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground flex-1 text-left">
            Search cases, users, payouts, campaigns…
          </span>
          <kbd className="text-[10px] bg-background rounded border px-1.5 py-0.5 font-mono text-muted-foreground">⌘K</kbd>
        </button>

        {/* Role switcher (super-admin only) */}
        <div className="relative">
          {isSuper ? (
            <>
              <button
                onClick={() => setRoleMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-muted/40 transition-colors"
                aria-haspopup="menu"
                aria-expanded={roleMenuOpen}
              >
                <RoleIcon className="h-3.5 w-3.5 text-foreground" />
                <span className="text-[12px] font-medium hidden md:inline">{roleInfo.label}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {roleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border bg-popover shadow-lg z-50 py-1.5">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b mb-1">
                      View as
                    </div>
                    {ROLE_OPTIONS.map((r) => {
                      const ItemIcon = r.icon;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleRoleSwitch(r.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-muted/60 transition-colors',
                            activeRole === r.id && 'bg-primary/10 text-primary font-medium',
                          )}
                        >
                          <ItemIcon className="h-3.5 w-3.5" />
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/20"
              title="Role switching is restricted to Super Admins"
            >
              <RoleIcon className="h-3.5 w-3.5 text-foreground" />
              <span className="text-[12px] font-medium hidden md:inline">{roleInfo.label}</span>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMessageDialogOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-[11.5px] font-medium text-foreground/80 hover:text-foreground"
            title="Message any user on the platform (audit-logged)"
          >
            <Send className="h-3 w-3" />
            Message user
          </button>
          <button
            onClick={() => setMessageDialogOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            aria-label="Message any user"
            title="Message any user"
          >
            <Send className="h-4 w-4 text-muted-foreground" />
          </button>
          <AdminNotificationTray role={activeRole} />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-background hover:bg-muted/40 transition-colors text-[11px] font-medium text-muted-foreground hover:text-foreground"
            title="Open the public site in a new tab"
          >
            <ExternalLink className="h-3 w-3" />
            View public site
          </a>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <MessageUserDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        asRole={activeRole}
      />

      {/* ─── Browser-style tab strip ─── */}
      <AdminTabBar />

      {/* ─── Main layout ─── */}
      <div className="flex-1 flex overflow-hidden">
        <aside
          className={cn(
            'hidden md:flex flex-col border-r bg-muted/15 shrink-0 transition-all duration-200',
            collapsed ? 'w-12' : 'w-56',
          )}
        >
          <ScrollArea className="flex-1">
            <NavContent />
          </ScrollArea>
        </aside>

        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Admin Terminal
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <NavContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
