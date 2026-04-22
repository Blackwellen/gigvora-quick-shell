import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LoggedInTopBar } from '@/components/navigation/LoggedInTopBar';
import { MobileBottomNav } from '@/components/shell/MobileBottomNav';
import MessagingBubble from '@/components/messaging/MessagingBubble';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot, PenLine, Image, Video, FileText, Briefcase, ClipboardList, Mail,
  UserSearch, Headphones, BarChart3, BookOpen, History, CreditCard, Settings,
  Key, Sparkles, ChevronLeft, ChevronRight, Zap, Menu, X,
  LayoutDashboard
} from 'lucide-react';

const AI_NAV = [
  { section: 'Overview' },
  { label: 'AI Hub', icon: LayoutDashboard, href: '/ai', exact: true },
  { section: 'Creative Tools' },
  { label: 'AI Chat', icon: Bot, href: '/ai/chat' },
  { label: 'AI Writer', icon: PenLine, href: '/ai/writer' },
  { label: 'Image Studio', icon: Image, href: '/ai/image' },
  { label: 'Video Studio', icon: Video, href: '/ai/video' },
  { section: 'Business Tools' },
  { label: 'Proposal Helper', icon: FileText, href: '/ai/proposal' },
  { label: 'JD Helper', icon: Briefcase, href: '/ai/jd' },
  { label: 'Brief Helper', icon: ClipboardList, href: '/ai/brief' },
  { label: 'Outreach', icon: Mail, href: '/ai/outreach' },
  { label: 'Recruiter', icon: UserSearch, href: '/ai/recruiter' },
  { label: 'Support AI', icon: Headphones, href: '/ai/support' },
  { label: 'Analytics AI', icon: BarChart3, href: '/ai/analytics' },
  { section: 'Library' },
  { label: 'Prompt Library', icon: BookOpen, href: '/ai/prompts' },
  { label: 'History & Saved', icon: History, href: '/ai/history' },
  { section: 'Account' },
  { label: 'Usage & Billing', icon: CreditCard, href: '/ai/billing' },
  { label: 'BYOK & Keys', icon: Key, href: '/ai/byok' },
  { label: 'Settings', icon: Settings, href: '/ai/settings' },
] as const;

type NavItem = typeof AI_NAV[number];

export const AIShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item: NavItem) => {
    if (!('href' in item)) return false;
    if ('exact' in item && item.exact) return location.pathname === item.href;
    return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className={cn('flex items-center gap-2 px-3 py-4 border-b border-border/40', collapsed && 'justify-center px-2')}>
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-tight">Gigvora AI</div>
            <div className="text-[8px] text-muted-foreground">Workspace Suite</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {AI_NAV.map((item, i) => {
          if ('section' in item) {
            if (collapsed) return <div key={i} className="h-px bg-border/30 my-2" />;
            return <div key={i} className="text-[8px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2 pt-3 pb-1">{item.section}</div>;
          }
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => { navigate(item.href); setMobileOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[11px] font-medium transition-all duration-200',
                'hover:bg-muted/60',
                active
                  ? 'bg-accent/10 text-accent shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active && 'text-accent')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Credit summary */}
      {!collapsed && (
        <div className="border-t border-border/40 p-3">
          <div className="rounded-xl bg-muted/40 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-semibold text-muted-foreground">Credits</span>
              <span className="text-[10px] font-bold">1,850</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-accent to-accent/60" />
            </div>
            <div className="text-[7px] text-muted-foreground mt-1">1,150 / 3,000 used this cycle</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <LoggedInTopBar />

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className={cn(
          'hidden md:flex flex-col border-r bg-card/80 backdrop-blur-sm transition-all duration-300 shrink-0',
          collapsed ? 'w-[56px]' : 'w-[220px]'
        )}
          style={{ height: 'calc(100vh - var(--topbar-height))' }}
        >
          {sidebarContent}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-8 border-t border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-card shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-xs font-bold">AI Navigation</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-0"
          style={{ height: 'calc(100vh - var(--topbar-height))' }}
        >
          {/* AI top bar */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
            <div className="max-w-[1400px] mx-auto px-3 md:px-5 lg:px-8 py-2 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-8 w-8 p-0 rounded-xl"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="text-[11px] font-semibold truncate">AI Workspace</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] rounded-lg gap-1 hidden sm:inline-flex">
                  <Zap className="h-2.5 w-2.5 text-accent" />1,850 credits
                </Badge>
                <Badge variant="outline" className="text-[8px] rounded-lg gap-1 hidden sm:inline-flex">
                  <Key className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />BYOK Active
                </Badge>
                <Badge variant="outline" className="text-[8px] rounded-lg hidden md:inline-flex">
                  Pro Plan
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-[1400px] mx-auto w-full px-3 md:px-5 lg:px-8 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <MessagingBubble />
    </div>
  );
};
