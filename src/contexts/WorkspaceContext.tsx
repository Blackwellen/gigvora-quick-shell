import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import type { SavedView as SdkSavedView, RecentItem as SdkRecentItem } from '@gigvora/sdk';

export interface SavedView {
  id: string;
  label: string;
  route: string;
  icon?: string;
  pinned?: boolean;
}

export interface RecentItem {
  id: string;
  label: string;
  route: string;
  type: 'page' | 'profile' | 'project' | 'job' | 'gig' | 'message';
  timestamp: string;
}

export interface OrgContext {
  id: string;
  name: string;
  logo?: string;
  role: string;
}

interface WorkspaceContextValue {
  savedViews: SavedView[];
  addSavedView: (view: Omit<SavedView, 'id'>) => void;
  removeSavedView: (id: string) => void;
  togglePinView: (id: string) => void;

  recentItems: RecentItem[];
  addRecentItem: (item: Omit<RecentItem, 'id' | 'timestamp'>) => void;

  activeOrg: OrgContext | null;
  setActiveOrg: (org: OrgContext | null) => void;
  availableOrgs: OrgContext[];

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  rightRailOpen: boolean;
  setRightRailOpen: (v: boolean) => void;

  /** True when shell data is hydrated from the live API (vs local mocks). */
  liveBacked: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};

// ----- Local fallback fixtures (used until the API is reachable) -----
const MOCK_SAVED_VIEWS: SavedView[] = [
  { id: 'sv1', label: 'Active Hiring Pipeline', route: '/recruiter-pro', pinned: true },
  { id: 'sv2', label: 'My Open Projects', route: '/projects', pinned: true },
  { id: 'sv3', label: 'Finance Overview', route: '/finance', pinned: false },
  { id: 'sv4', label: 'Team Workspace', route: '/org', pinned: false },
];

const MOCK_RECENT: RecentItem[] = [
  { id: 'r1', label: 'Senior React Developer', route: '/jobs/sr-react', type: 'job', timestamp: '2m ago' },
  { id: 'r2', label: 'Project Alpha Workspace', route: '/projects/alpha/workspace', type: 'project', timestamp: '8m ago' },
  { id: 'r3', label: 'Sarah K. — Profile', route: '/profile/sarah-k', type: 'profile', timestamp: '15m ago' },
  { id: 'r4', label: 'Logo Design Gig', route: '/gigs/logo-design', type: 'gig', timestamp: '1h ago' },
  { id: 'r5', label: 'Thread with Marcus T.', route: '/inbox/marcus-t', type: 'message', timestamp: '2h ago' },
];

const MOCK_ORGS: OrgContext[] = [
  { id: 'personal', name: 'Personal', role: 'Owner' },
  { id: 'acme', name: 'Acme Corp', logo: '', role: 'Admin' },
  { id: 'startup', name: 'TechStartup Inc', logo: '', role: 'Member' },
];

const fmtAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const adaptRecent = (r: SdkRecentItem): RecentItem => ({
  id: r.id, label: r.label, route: r.route,
  type: (['page','profile','project','job','gig','message'].includes(r.kind) ? r.kind : 'page') as RecentItem['type'],
  timestamp: fmtAgo(r.visitedAt),
});

const adaptSaved = (v: SdkSavedView): SavedView => ({
  id: v.id, label: v.label, route: v.route,
  icon: v.icon ?? undefined, pinned: v.pinned,
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedViews, setSavedViews] = useState<SavedView[]>(MOCK_SAVED_VIEWS);
  const [recentItems, setRecentItems] = useState<RecentItem[]>(MOCK_RECENT);
  const [availableOrgs, setAvailableOrgs] = useState<OrgContext[]>(MOCK_ORGS);
  const [activeOrg, setActiveOrgState] = useState<OrgContext | null>(MOCK_ORGS[0]);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [rightRailOpen, setRightRailOpenState] = useState(true);
  const [liveBacked, setLiveBacked] = useState(false);
  const hydrated = useRef(false);

  // ---- Hydrate from API when ready ----
  useEffect(() => {
    if (hydrated.current || !sdkReady()) return;
    hydrated.current = true;
    sdk.shell.bootstrap()
      .then((boot) => {
        const orgs = boot.orgs.map((o) => ({
          id: o.id, name: o.name, logo: o.logoUrl ?? undefined, role: o.role,
        }));
        if (orgs.length) setAvailableOrgs(orgs);
        if (boot.prefs?.activeOrgId) {
          setActiveOrgState(orgs.find((o) => o.id === boot.prefs.activeOrgId) ?? orgs[0] ?? null);
        }
        setSidebarCollapsedState(boot.prefs?.sidebarCollapsed ?? false);
        setRightRailOpenState(boot.prefs?.rightRailOpen ?? true);
        setSavedViews(boot.savedViews.map(adaptSaved));
        setRecentItems(boot.recents.map(adaptRecent));
        setLiveBacked(true);
      })
      .catch(() => { /* keep mocks; preview/offline mode */ });
  }, []);

  const persistPrefs = useCallback((patch: Partial<{ sidebarCollapsed: boolean; rightRailOpen: boolean; activeOrgId: string }>) => {
    if (!sdkReady()) return;
    sdk.shell.updatePrefs(patch as any).catch(() => {});
  }, []);

  const setSidebarCollapsed = useCallback((v: boolean) => {
    setSidebarCollapsedState(v); persistPrefs({ sidebarCollapsed: v });
  }, [persistPrefs]);

  const setRightRailOpen = useCallback((v: boolean) => {
    setRightRailOpenState(v); persistPrefs({ rightRailOpen: v });
  }, [persistPrefs]);

  const setActiveOrg = useCallback((org: OrgContext | null) => {
    setActiveOrgState(org);
    if (org) persistPrefs({ activeOrgId: org.id });
  }, [persistPrefs]);

  const addSavedView = useCallback((view: Omit<SavedView, 'id'>) => {
    const optimistic: SavedView = { ...view, id: `sv-${Date.now()}` };
    setSavedViews((prev) => [...prev, optimistic]);
    if (sdkReady()) {
      sdk.savedViews.create({ label: view.label, route: view.route, icon: view.icon, pinned: !!view.pinned, position: 0 } as any)
        .then((created) => setSavedViews((prev) => prev.map((v) => v.id === optimistic.id ? adaptSaved(created) : v)))
        .catch(() => {});
    }
  }, []);

  const removeSavedView = useCallback((id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
    if (sdkReady()) sdk.savedViews.remove(id).catch(() => {});
  }, []);

  const togglePinView = useCallback((id: string) => {
    setSavedViews((prev) => {
      const next = prev.map((v) => v.id === id ? { ...v, pinned: !v.pinned } : v);
      const target = next.find((v) => v.id === id);
      if (target && sdkReady()) sdk.savedViews.update(id, { pinned: target.pinned }).catch(() => {});
      return next;
    });
  }, []);

  const addRecentItem = useCallback((item: Omit<RecentItem, 'id' | 'timestamp'>) => {
    setRecentItems((prev) => [
      { ...item, id: `r-${Date.now()}`, timestamp: 'Just now' },
      ...prev.slice(0, 9),
    ]);
    if (sdkReady()) {
      sdk.recents.track({ kind: item.type as any, label: item.label, route: item.route }).catch(() => {});
    }
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      savedViews, addSavedView, removeSavedView, togglePinView,
      recentItems, addRecentItem,
      activeOrg, setActiveOrg, availableOrgs,
      sidebarCollapsed, setSidebarCollapsed,
      rightRailOpen, setRightRailOpen,
      liveBacked,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
