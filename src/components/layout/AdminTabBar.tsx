/**
 * AdminTabBar — browser-style multi-tab system for the /admin terminal.
 *
 * Behaviour:
 *  - Each visited /admin/* route opens (or focuses) a tab.
 *  - The /admin home tab is pinned and cannot be closed.
 *  - Closing the active tab navigates to the previous tab.
 *  - cmd/ctrl+W closes active tab, cmd/ctrl+T returns to /admin home.
 *  - Tabs persist in sessionStorage so refreshes don't lose context.
 *
 * Designed to feel like Chrome / Linear / Notion — slim 32px strip,
 * subtle hover, only the active tab raised to the panel surface.
 */
import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { X, Home, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminTab {
  path: string;
  label: string;
  pinned?: boolean;
}

const STORAGE_KEY = 'gv.admin.tabs.v1';
const HOME_TAB: AdminTab = { path: '/admin', label: 'Portal Home', pinned: true };

/** Best-effort label derived from the route path. */
function labelFor(path: string): string {
  if (path === '/admin') return 'Portal Home';
  const seg = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  if (seg.length === 0) return 'Portal Home';
  const map: Record<string, string> = {
    cs: 'Customer Service',
    'dispute-ops': 'Dispute Ops',
    finance: 'Finance',
    moderation: 'Moderation',
    'trust-safety': 'Trust & Safety',
    'verification-compliance': 'Verification',
    marketing: 'Marketing',
    'ads-ops': 'Ads Ops',
    super: 'Super Admin',
    ops: 'Cross-team Triage',
    search: 'Entity Search',
    audit: 'Audit Log',
    flags: 'Feature Flags',
    emergency: 'Emergency',
    shell: 'Shell',
    login: 'Login',
  };
  const head = map[seg[0]] ?? seg[0].replace(/-/g, ' ');
  const tail = seg.slice(1).join(' / ');
  const titled = head.replace(/\b\w/g, (c) => c.toUpperCase());
  return tail ? `${titled} · ${tail}` : titled;
}

function load(): AdminTab[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [HOME_TAB];
    const parsed = JSON.parse(raw) as AdminTab[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [HOME_TAB];
    if (!parsed.some((t) => t.path === '/admin')) parsed.unshift(HOME_TAB);
    return parsed;
  } catch {
    return [HOME_TAB];
  }
}

function save(tabs: AdminTab[]) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs)); } catch { /* no-op */ }
}

export const AdminTabBar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = React.useState<AdminTab[]>(() => load());

  // Open or focus a tab whenever the route changes.
  useEffect(() => {
    if (!pathname.startsWith('/admin')) return;
    setTabs((prev) => {
      const exists = prev.find((t) => t.path === pathname);
      if (exists) return prev;
      const next = [...prev, { path: pathname, label: labelFor(pathname) }];
      save(next);
      return next;
    });
  }, [pathname]);

  // Persist on every change.
  useEffect(() => { save(tabs); }, [tabs]);

  // Keyboard shortcuts: cmd/ctrl+W close, cmd/ctrl+T home.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'w' && pathname.startsWith('/admin')) {
        e.preventDefault();
        closeTab(pathname);
      } else if (e.key.toLowerCase() === 't' && pathname.startsWith('/admin')) {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, tabs]);

  const closeTab = (path: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.path === path);
      if (!tab || tab.pinned) return prev;
      const idx = prev.findIndex((t) => t.path === path);
      const next = prev.filter((t) => t.path !== path);
      save(next);
      if (path === pathname) {
        const fallback = next[idx - 1] ?? next[idx] ?? HOME_TAB;
        navigate(fallback.path);
      }
      return next;
    });
  };

  const orderedTabs = useMemo(() => {
    // pinned first, preserve insertion order otherwise
    return [...tabs].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [tabs]);

  return (
    <div className="flex items-end h-9 bg-muted/30 border-b border-border/60 px-2 gap-0.5 overflow-x-auto scrollbar-none select-none">
      {orderedTabs.map((tab) => {
        const active = pathname === tab.path || (tab.path !== '/admin' && pathname.startsWith(tab.path + '/'));
        return (
          <div
            key={tab.path}
            className={cn(
              'group relative flex items-center h-7 max-w-[200px] pl-2.5 pr-1 rounded-t-md text-[11.5px] font-medium transition-colors cursor-pointer shrink-0',
              active
                ? 'bg-background text-foreground border border-border border-b-0 -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
            )}
            onClick={() => navigate(tab.path)}
            title={tab.path}
          >
            {tab.pinned && <Home className="h-3 w-3 mr-1.5 shrink-0 text-primary/70" />}
            <span className="truncate">{tab.label}</span>
            {!tab.pinned && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                className="ml-1.5 p-0.5 rounded hover:bg-muted-foreground/20 opacity-60 group-hover:opacity-100 transition-opacity"
                aria-label={`Close ${tab.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <Link
        to="/admin"
        className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors shrink-0"
        title="New tab (⌘T)"
      >
        <Plus className="h-3.5 w-3.5" />
      </Link>
      <div className="flex-1" />
      <div className="hidden lg:flex items-center gap-2 pr-2 pb-1 text-[10px] text-muted-foreground/70 font-mono">
        <kbd className="px-1 py-0.5 rounded bg-background border border-border/60">⌘T</kbd> new
        <kbd className="px-1 py-0.5 rounded bg-background border border-border/60">⌘W</kbd> close
      </div>
    </div>
  );
};
