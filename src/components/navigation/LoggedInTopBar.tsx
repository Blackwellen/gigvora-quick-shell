import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Calendar, Palette, Megaphone, UserCheck,
  Target, Building2, Menu, X, Wifi, PanelRight, Play,
} from 'lucide-react';
import { ConnectionsPopover } from './ConnectionsPopover';
import { Button } from '@/components/ui/button';
import { MegaMenu } from './MegaMenu';
import { AvatarDropdown } from './AvatarDropdown';
import { LOGGED_IN_MEGA_MENUS } from '@/data/navigation';
import { GigvoraLogo } from '@/components/GigvoraLogo';
import { RoleSwitcher } from '@/components/shell/RoleSwitcher';
import { OrgSwitcher } from '@/components/shell/OrgSwitcher';
import { QuickCreateMenu } from '@/components/shell/QuickCreateMenu';
import { NotificationTray } from '@/components/shell/NotificationTray';
import { InboxCounter } from '@/components/shell/InboxCounter';
import { TaskTray } from '@/components/shell/TaskTray';
import { CommandSearch } from '@/components/CommandSearch';
import { ShortcutsOverlay } from '@/components/ShortcutsOverlay';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const LoggedInTopBar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const { rightRailOpen, setRightRailOpen, sidebarCollapsed, setSidebarCollapsed } = useWorkspace();
  const navigate = useNavigate();

  React.useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout>;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen(prev => !prev);
        return;
      }

      if (e.key === '?' && e.shiftKey && !isInput) {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
        return;
      }

      if (isInput) return;

      if (e.key === '.' && !e.metaKey && !e.ctrlKey) { setRightRailOpen(!rightRailOpen); return; }
      if (e.key === '[' && !e.metaKey && !e.ctrlKey) { setSidebarCollapsed(!sidebarCollapsed); return; }

      if (e.key === 'g' || e.key === 'G') {
        if (!gPressed) {
          gPressed = true;
          gTimeout = setTimeout(() => { gPressed = false; }, 800);
          return;
        }
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimeout);
        const navMap: Record<string, string> = {
          h: '/feed', d: '/dashboard', i: '/inbox', n: '/notifications',
          p: '/profile', s: '/settings', c: '/calendar',
          j: '/jobs', g: '/gigs', r: '/projects', e: '/explore',
        };
        const path = navMap[e.key.toLowerCase()];
        if (path) { e.preventDefault(); navigate(path); }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(gTimeout); };
  }, [rightRailOpen, setRightRailOpen, sidebarCollapsed, setSidebarCollapsed, navigate]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        {/* Top row */}
        <div className="flex h-11 items-center gap-2 px-[var(--shell-gutter)] max-w-[1920px] mx-auto">
          <Link to="/feed" className="flex items-center gap-2 shrink-0 group">
            <GigvoraLogo size="sm" />
          </Link>

          <div className="h-4 w-px bg-border mx-0.5 hidden sm:block" />

          <div className="hidden sm:block">
            <OrgSwitcher />
          </div>

          <div className="h-4 w-px bg-border mx-0.5 hidden sm:block" />

          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-sm hidden sm:block ml-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="w-full h-7 rounded-xl border bg-muted/40 px-3 text-[10px] text-muted-foreground flex items-center gap-2 hover:bg-muted/60 hover:border-accent/30 transition-all duration-200"
            >
              <Search className="h-3 w-3" />
              <span className="flex-1 text-left">Search everything...</span>
              <kbd className="hidden lg:inline text-[9px] bg-background border rounded-md px-1 py-0.5 font-mono">⌘K</kbd>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-0.5 ml-auto">
            <QuickCreateMenu />

            <div className="h-3.5 w-px bg-border mx-0.5 hidden sm:block" />

            {/* Secondary icons — hidden on mobile to prevent overflow */}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-accent/10 transition-colors hidden sm:flex" asChild>
              <Link to="/calendar">
                <Calendar className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <div className="hidden md:block">
              <ConnectionsPopover />
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-accent/10 transition-colors hidden md:flex" asChild>
              <Link to="/networking">
                <Wifi className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-accent/10 transition-colors hidden lg:flex" asChild>
              <Link to="/media">
                <Play className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <div className="hidden sm:block">
              <TaskTray />
            </div>
            <InboxCounter />
            <NotificationTray />

            <div className="h-3.5 w-px bg-border mx-0.5 hidden lg:block" />

            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7 rounded-xl hidden xl:flex transition-all duration-200', rightRailOpen && 'text-accent bg-accent/10')}
              onClick={() => setRightRailOpen(!rightRailOpen)}
            >
              <PanelRight className="h-3.5 w-3.5" />
            </Button>

            <AvatarDropdown />

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 ml-0.5 rounded-xl hover:bg-muted/50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mega menu row */}
        <div className="hidden md:block border-t bg-background">
          <div className="max-w-[1920px] mx-auto px-[var(--shell-gutter)]">
            <MegaMenu menus={LOGGED_IN_MEGA_MENUS} />
          </div>
        </div>
      </header>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-sm flex items-center gap-2">
              <GigvoraLogo size="sm" /> Navigation
            </SheetTitle>
          </SheetHeader>

          {/* Mobile search */}
          <div className="px-3 pb-2">
            <button
              onClick={() => { setCmdOpen(true); setMobileOpen(false); }}
              className="w-full h-8 rounded-xl border bg-muted/40 px-3 text-[10px] text-muted-foreground flex items-center gap-2"
            >
              <Search className="h-3 w-3" />
              <span>Search...</span>
            </button>
          </div>

          <Separator />

          <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
            <div className="p-3 space-y-1">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold px-2 pt-1 pb-1">Main</div>
              {LOGGED_IN_MEGA_MENUS.map((m) => (
                <Link
                  key={m.label}
                  to={m.href || (m.columns[0]?.items[0]?.href) || '#'}
                  className="flex items-center gap-2.5 py-2 px-3 text-[11px] font-medium rounded-xl hover:bg-accent/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {m.icon && <m.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  {m.label}
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <CommandSearch open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
};
