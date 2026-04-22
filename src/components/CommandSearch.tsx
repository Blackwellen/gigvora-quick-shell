import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Briefcase, Users, MessageSquare, FileText,
  Settings, Target, Megaphone, Building2, Wallet,
  Calendar, User, Video, ArrowRight,
  Layers, Star, Clock, X, Hash, Bookmark,
  BookmarkPlus, Trash2, Lock, Zap, Crown,
  Palette, Store, GraduationCap, Headphones,
  UserCheck, BarChart3, Home, Radio, Pen,
  Shield, Globe, ExternalLink, Eye, Send,
  TrendingUp, Sparkles, MapPin, DollarSign, ChevronRight,
  Filter, Command, Mic, Play, Wifi, Heart,
  Package, ScrollText, Activity, Flag, BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { Badge } from '@/components/ui/badge';
import { ENTITLEMENT_LABELS, type FeatureEntitlement } from '@/types/role';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  path: string;
  icon: React.ElementType;
  keywords?: string[];
  entitlement?: FeatureEntitlement;
  type?: 'page' | 'action' | 'entity' | 'shortcut';
}

type EntityType = 'person' | 'company' | 'agency' | 'job' | 'gig' | 'project' | 'service' | 'event' | 'group' | 'webinar' | 'podcast' | 'page';

interface EntityResult {
  id: string;
  type: EntityType;
  label: string;
  meta: string;
  avatar?: string;
  location?: string;
  verified?: boolean;
}

type SearchTab = 'all' | 'people' | 'companies' | 'jobs' | 'gigs' | 'services' | 'projects' | 'events' | 'media' | 'actions';

/* ═══════════════════════════════════════════════════════════
   Command registry
   ═══════════════════════════════════════════════════════════ */
const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'feed', label: 'Home Feed', description: 'Your activity feed', category: 'Navigation', path: '/feed', icon: Home, keywords: ['home', 'feed', 'timeline'] },
  { id: 'dashboard', label: 'Dashboard', description: 'Overview & analytics', category: 'Navigation', path: '/dashboard', icon: BarChart3, keywords: ['dashboard', 'overview'] },
  { id: 'inbox', label: 'Inbox', description: 'Messages & conversations', category: 'Navigation', path: '/inbox', icon: MessageSquare, keywords: ['messages', 'chat', 'inbox'] },
  { id: 'profile', label: 'My Profile', description: 'View and edit your profile', category: 'Navigation', path: '/profile', icon: User, keywords: ['profile', 'me'] },
  { id: 'calendar', label: 'Calendar', description: 'Schedule & events', category: 'Navigation', path: '/calendar', icon: Calendar, keywords: ['calendar', 'schedule'] },
  { id: 'notifications', label: 'Notifications', description: 'Alerts and updates', category: 'Navigation', path: '/notifications', icon: Settings, keywords: ['notifications', 'alerts'] },
  { id: 'saved', label: 'Saved Items', description: 'Bookmarked items', category: 'Navigation', path: '/saved', icon: Bookmark, keywords: ['saved', 'bookmarks'] },
  { id: 'settings', label: 'Settings', description: 'Account & preferences', category: 'Navigation', path: '/settings', icon: Settings, keywords: ['settings', 'preferences'] },

  // Work
  { id: 'jobs', label: 'Browse Jobs', description: 'Find job opportunities', category: 'Work', path: '/jobs', icon: Briefcase, keywords: ['jobs', 'hiring', 'work', 'career'] },
  { id: 'gigs', label: 'Browse Gigs', description: 'Freelance gig packages', category: 'Work', path: '/gigs', icon: Layers, keywords: ['gigs', 'freelance'] },
  { id: 'projects', label: 'Browse Projects', description: 'Collaborative projects', category: 'Work', path: '/projects', icon: FileText, keywords: ['projects', 'collaborate'] },
  { id: 'services', label: 'Services Marketplace', description: 'Professional services', category: 'Work', path: '/services', icon: Store, keywords: ['services', 'marketplace', 'consulting'] },
  { id: 'my-projects', label: 'My Projects', description: 'Active project workspaces', category: 'Work', path: '/projects/mine', icon: Layers, keywords: ['my projects', 'workspace'] },
  { id: 'orders', label: 'Orders Dashboard', description: 'Track all orders', category: 'Work', path: '/orders', icon: Package, keywords: ['orders', 'deliveries'] },
  { id: 'contracts', label: 'Contracts', description: 'Manage agreements', category: 'Work', path: '/contracts', icon: ScrollText, keywords: ['contracts', 'agreements'] },

  // Network
  { id: 'network', label: 'My Network', description: 'Connections & contacts', category: 'Network', path: '/networking', icon: Users, keywords: ['network', 'connections'] },
  { id: 'groups', label: 'Groups', description: 'Community groups', category: 'Network', path: '/groups', icon: Users, keywords: ['groups', 'communities'] },
  { id: 'events', label: 'Events', description: 'Upcoming events', category: 'Network', path: '/events', icon: Calendar, keywords: ['events', 'conferences', 'meetups'] },
  { id: 'networking-rooms', label: 'Networking Rooms', description: 'Live rooms & speed networking', category: 'Network', path: '/networking/rooms', icon: Wifi, keywords: ['rooms', 'networking', 'live'] },
  { id: 'mentorship', label: 'Mentor Marketplace', description: 'Find mentors', category: 'Network', path: '/mentorship', icon: GraduationCap, keywords: ['mentors', 'coaching'] },

  // Media
  { id: 'podcasts', label: 'Podcasts', description: 'Listen and discover', category: 'Media', path: '/podcasts', icon: Headphones, keywords: ['podcasts', 'audio', 'listen'] },
  { id: 'webinars', label: 'Webinars', description: 'Live and recorded webinars', category: 'Media', path: '/webinars', icon: Video, keywords: ['webinars', 'video', 'live'] },
  { id: 'creation-studio', label: 'Creation Studio', description: 'Content creation tools', category: 'Media', path: '/creation-studio', icon: Palette, keywords: ['studio', 'content', 'create'] },

  // Modules
  { id: 'recruiter', label: 'Recruiter Pro', description: 'ATS & talent search', category: 'Modules', path: '/recruiter-pro', icon: UserCheck, keywords: ['recruiter', 'ats', 'hiring'], entitlement: 'recruiter-pro' },
  { id: 'sales', label: 'Sales Navigator', description: 'Lead discovery & CRM', category: 'Modules', path: '/sales-navigator', icon: Target, keywords: ['sales', 'leads', 'crm'], entitlement: 'sales-navigator' },
  { id: 'ads', label: 'Ads Manager', description: 'Campaigns & analytics', category: 'Modules', path: '/ads', icon: Megaphone, keywords: ['ads', 'campaigns', 'promote'], entitlement: 'ads-manager' },
  { id: 'enterprise', label: 'Enterprise Connect', description: 'Enterprise ecosystem', category: 'Modules', path: '/enterprise-connect', icon: Building2, keywords: ['enterprise'], entitlement: 'enterprise-connect' },
  { id: 'documents', label: 'Document Studio', description: 'CVs, contracts, forms', category: 'Modules', path: '/documents', icon: FileText, keywords: ['documents', 'cv', 'resume'] },

  // Finance
  { id: 'finance', label: 'Finance Hub', description: 'Payments & billing', category: 'Finance', path: '/finance', icon: Wallet, keywords: ['finance', 'payments', 'billing'] },
  { id: 'explore', label: 'Explorer', description: 'Search everything', category: 'Navigation', path: '/explore', icon: Globe, keywords: ['explore', 'search', 'discover'] },

  // Actions
  { id: 'post-job', label: 'Post a Job', description: 'Create job listing', category: 'Quick Actions', path: '/jobs/create', icon: Briefcase, type: 'action', keywords: ['post', 'create', 'job'] },
  { id: 'create-gig', label: 'Create a Gig', description: 'List a new gig', category: 'Quick Actions', path: '/gigs/create', icon: Layers, type: 'action', keywords: ['create', 'gig'] },
  { id: 'new-project', label: 'Post a Project', description: 'Start a project brief', category: 'Quick Actions', path: '/projects/create', icon: FileText, type: 'action', keywords: ['new', 'project', 'post'] },
  { id: 'list-service', label: 'List a Service', description: 'Offer a professional service', category: 'Quick Actions', path: '/services/create', icon: Store, type: 'action', keywords: ['service', 'list', 'offer'] },
  { id: 'create-post', label: 'Create a Post', description: 'Share an update', category: 'Quick Actions', path: '/create/post', icon: Pen, type: 'action', keywords: ['post', 'share', 'update'] },
  { id: 'create-event', label: 'Create an Event', description: 'Host a meetup or conference', category: 'Quick Actions', path: '/events/create', icon: Calendar, type: 'action', keywords: ['event', 'create', 'host'] },
  { id: 'create-webinar', label: 'Create a Webinar', description: 'Schedule a live webinar', category: 'Quick Actions', path: '/webinars/create', icon: Video, type: 'action', keywords: ['webinar', 'create', 'live'] },
  { id: 'start-room', label: 'Start a Room', description: 'Launch a networking room', category: 'Quick Actions', path: '/networking/create', icon: Wifi, type: 'action', keywords: ['room', 'networking', 'start'] },
  { id: 'compose-message', label: 'New Message', description: 'Start a conversation', category: 'Quick Actions', path: '/inbox?compose=true', icon: Send, type: 'action', keywords: ['message', 'chat', 'dm'] },

  // Support
  { id: 'help', label: 'Help & Support', description: 'Get help', category: 'Support', path: '/help', icon: Headphones, keywords: ['help', 'support', 'faq'] },
  { id: 'trust', label: 'Trust & Safety', description: 'Security and policies', category: 'Support', path: '/trust-safety', icon: Shield, keywords: ['trust', 'safety', 'report'] },
];

/* ═══════════════════════════════════════════════════════════
   Mock entity results — expanded categories
   ═══════════════════════════════════════════════════════════ */
const MOCK_ENTITIES: EntityResult[] = [
  // People
  { id: 'p1', type: 'person', label: 'Sarah Chen', meta: 'Full-Stack Developer · San Francisco', location: 'San Francisco, CA', verified: true },
  { id: 'p2', type: 'person', label: 'James Rodriguez', meta: 'Product Designer · New York', location: 'New York, NY' },
  { id: 'p3', type: 'person', label: 'Aisha Patel', meta: 'Data Scientist · London', location: 'London, UK', verified: true },
  { id: 'p4', type: 'person', label: 'Marcus Johnson', meta: 'DevOps Engineer · Austin', location: 'Austin, TX' },
  // Companies
  { id: 'c1', type: 'company', label: 'TechFlow Inc.', meta: 'Software Development · 120 employees', verified: true },
  { id: 'c2', type: 'company', label: 'DesignCraft Studio', meta: 'Creative Agency · 45 employees' },
  { id: 'c3', type: 'company', label: 'DataPulse AI', meta: 'Machine Learning · 80 employees', verified: true },
  // Agencies
  { id: 'a1', type: 'agency', label: 'Pixel Perfect Agency', meta: 'Web & Mobile Design · 32 members', verified: true },
  { id: 'a2', type: 'agency', label: 'CloudScale Partners', meta: 'DevOps & Infrastructure · 18 members' },
  // Jobs
  { id: 'j1', type: 'job', label: 'Senior React Developer', meta: 'TechFlow Inc. · Remote · $120k-$160k' },
  { id: 'j2', type: 'job', label: 'UX Lead', meta: 'DesignCraft · Hybrid · $95k-$130k' },
  { id: 'j3', type: 'job', label: 'ML Engineer', meta: 'DataPulse AI · On-site · $140k-$180k' },
  // Gigs
  { id: 'g1', type: 'gig', label: 'Logo Design Package', meta: 'Starting at $150 · 4.9★ · 230 orders' },
  { id: 'g2', type: 'gig', label: 'WordPress Full Setup', meta: 'Starting at $500 · 4.8★ · 145 orders' },
  // Projects
  { id: 'pr1', type: 'project', label: 'E-commerce Platform Rebuild', meta: 'Budget $15k · 12 proposals · Open' },
  { id: 'pr2', type: 'project', label: 'Mobile App MVP', meta: 'Budget $8k · 7 proposals · Open' },
  // Services
  { id: 's1', type: 'service', label: 'Technical Architecture Review', meta: 'From $200/hr · Sarah Chen · 5.0★' },
  { id: 's2', type: 'service', label: 'Brand Identity Design', meta: 'From $2,500 · DesignCraft · 4.9★' },
  // Events
  { id: 'e1', type: 'event', label: 'AI & Future of Work Summit', meta: 'Jun 15 · Virtual · 342 attending' },
  { id: 'e2', type: 'event', label: 'React London Meetup', meta: 'Jun 22 · London · 89 attending', location: 'London, UK' },
  // Groups
  { id: 'gr1', type: 'group', label: 'React Developers', meta: '12.4k members · Active daily' },
  { id: 'gr2', type: 'group', label: 'UX Design Collective', meta: '8.2k members · Active daily' },
  // Webinars
  { id: 'w1', type: 'webinar', label: 'Building Scalable APIs', meta: 'Jun 18 · Live · Marcus Johnson' },
  { id: 'w2', type: 'webinar', label: 'Design Systems at Scale', meta: 'Jun 25 · Live · Aisha Patel' },
  // Podcasts
  { id: 'pod1', type: 'podcast', label: 'The Freelance Blueprint', meta: '142 episodes · Weekly · 8.5k followers' },
  { id: 'pod2', type: 'podcast', label: 'Tech Lead Journal', meta: '89 episodes · Bi-weekly · 12k followers' },
  // Pages
  { id: 'pg1', type: 'page', label: 'TechFlow Engineering Blog', meta: 'Company page · 5.2k followers' },
  { id: 'pg2', type: 'page', label: 'Gigvora Design Hub', meta: 'Community page · 3.1k followers' },
];

const ENTITY_ICONS: Record<EntityType, React.ElementType> = {
  person: User,
  company: Building2,
  agency: Users,
  job: Briefcase,
  gig: Layers,
  project: FileText,
  service: Store,
  event: Calendar,
  group: Users,
  webinar: Video,
  podcast: Headphones,
  page: Globe,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  person: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
  company: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  agency: 'bg-[hsl(var(--state-review)/0.1)] text-[hsl(var(--state-review))]',
  job: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  gig: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  project: 'bg-accent/10 text-accent',
  service: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
  event: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  group: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  webinar: 'bg-[hsl(var(--state-live)/0.1)] text-[hsl(var(--state-live))]',
  podcast: 'bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))]',
  page: 'bg-muted text-muted-foreground',
};

const ENTITY_PATHS: Record<EntityType, string> = {
  person: '/profile',
  company: '/company',
  agency: '/agency',
  job: '/jobs',
  gig: '/gigs',
  project: '/projects',
  service: '/services',
  event: '/events',
  group: '/groups',
  webinar: '/webinars',
  podcast: '/podcasts',
  page: '/pages',
};

/* ═══════════════════════════════════════════════════════════
   Trending & filter data
   ═══════════════════════════════════════════════════════════ */
const TRENDING_QUERIES = [
  { label: 'React Developer', icon: TrendingUp, count: '2.4k searches' },
  { label: 'UI/UX Design', icon: TrendingUp, count: '1.8k searches' },
  { label: 'Data Engineering', icon: TrendingUp, count: '1.2k searches' },
  { label: 'Product Manager', icon: TrendingUp, count: '950 searches' },
  { label: 'AI/ML Engineer', icon: TrendingUp, count: '890 searches' },
  { label: 'Brand Strategy', icon: TrendingUp, count: '720 searches' },
];

const SUGGESTED_FILTERS = [
  { label: 'Remote Only', icon: Globe },
  { label: 'Full-time', icon: Briefcase },
  { label: '$100k+', icon: DollarSign },
  { label: 'Verified', icon: Shield },
  { label: 'Top Rated', icon: Star },
  { label: 'Near Me', icon: MapPin },
];

/* ═══════════════════════════════════════════════════════════
   Category tabs config
   ═══════════════════════════════════════════════════════════ */
const SEARCH_TABS: { key: SearchTab; label: string; icon: React.ElementType; entityTypes: EntityType[] }[] = [
  { key: 'all', label: 'All', icon: Search, entityTypes: [] },
  { key: 'people', label: 'People', icon: User, entityTypes: ['person'] },
  { key: 'companies', label: 'Companies', icon: Building2, entityTypes: ['company', 'agency'] },
  { key: 'jobs', label: 'Jobs', icon: Briefcase, entityTypes: ['job'] },
  { key: 'gigs', label: 'Gigs', icon: Layers, entityTypes: ['gig'] },
  { key: 'services', label: 'Services', icon: Store, entityTypes: ['service'] },
  { key: 'projects', label: 'Projects', icon: FileText, entityTypes: ['project'] },
  { key: 'events', label: 'Events', icon: Calendar, entityTypes: ['event', 'group'] },
  { key: 'media', label: 'Media', icon: Play, entityTypes: ['webinar', 'podcast', 'page'] },
  { key: 'actions', label: 'Actions', icon: Zap, entityTypes: [] },
];

/* ═══════════════════════════════════════════════════════════
   Local storage helpers
   ═══════════════════════════════════════════════════════════ */
const RECENT_KEY = 'gigvora_recent_searches';
const SAVED_KEY = 'gigvora_saved_searches';

function getStoredList(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function setStoredList(key: string, items: string[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */
interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { hasEntitlement } = useRole();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setActiveTab('all');
      setRecentSearches(getStoredList(RECENT_KEY));
      setSavedSearches(getStoredList(SAVED_KEY));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const addRecent = useCallback((q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...getStoredList(RECENT_KEY).filter(s => s !== q)].slice(0, 10);
    setStoredList(RECENT_KEY, updated);
    setRecentSearches(updated);
  }, []);

  const toggleSaved = useCallback((q: string) => {
    const current = getStoredList(SAVED_KEY);
    const updated = current.includes(q) ? current.filter(s => s !== q) : [q, ...current].slice(0, 20);
    setStoredList(SAVED_KEY, updated);
    setSavedSearches(updated);
  }, []);

  const clearRecent = useCallback(() => {
    setStoredList(RECENT_KEY, []);
    setRecentSearches([]);
  }, []);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.keywords?.some(k => k.includes(q))
    ).filter(c => {
      if (activeTab === 'actions') return c.type === 'action';
      if (activeTab !== 'all') return c.type !== 'action'; // non-action tabs show pages
      return true;
    });
  }, [query, activeTab]);

  // Filter entities by active tab
  const filteredEntities = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const tabConfig = SEARCH_TABS.find(t => t.key === activeTab);
    return MOCK_ENTITIES.filter(e => {
      // Match query
      const matchesQuery = e.label.toLowerCase().includes(q) || e.meta.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      // Tab filter
      if (activeTab === 'all') return true;
      if (activeTab === 'actions') return false;
      return tabConfig?.entityTypes.includes(e.type) ?? false;
    });
  }, [query, activeTab]);

  // All items for keyboard nav
  const allItems = useMemo(() => {
    const items: Array<{ type: 'command'; data: CommandItem } | { type: 'entity'; data: EntityResult }> = [];
    filteredCommands.forEach(c => items.push({ type: 'command', data: c }));
    filteredEntities.forEach(e => items.push({ type: 'entity', data: e }));
    return items;
  }, [filteredCommands, filteredEntities]);

  // Group commands by category
  const grouped = useMemo(() => {
    return filteredCommands.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, CommandItem[]>);
  }, [filteredCommands]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!query || query.length < 2) return {} as Record<SearchTab, number>;
    const q = query.toLowerCase();
    const allEntities = MOCK_ENTITIES.filter(e =>
      e.label.toLowerCase().includes(q) || e.meta.toLowerCase().includes(q)
    );
    const allCommands = COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.keywords?.some(k => k.includes(q))
    );

    const counts: Record<SearchTab, number> = {
      all: allCommands.length + allEntities.length,
      people: allEntities.filter(e => e.type === 'person').length,
      companies: allEntities.filter(e => e.type === 'company' || e.type === 'agency').length,
      jobs: allEntities.filter(e => e.type === 'job').length,
      gigs: allEntities.filter(e => e.type === 'gig').length,
      services: allEntities.filter(e => e.type === 'service').length,
      projects: allEntities.filter(e => e.type === 'project').length,
      events: allEntities.filter(e => e.type === 'event' || e.type === 'group').length,
      media: allEntities.filter(e => ['webinar', 'podcast', 'page'].includes(e.type)).length,
      actions: allCommands.filter(c => c.type === 'action').length,
    };
    return counts;
  }, [query]);

  // Execute item
  const executeItem = useCallback((item: typeof allItems[number]) => {
    addRecent(query);
    if (item.type === 'command') {
      navigate(item.data.path);
    } else {
      navigate(`${ENTITY_PATHS[item.data.type] || '/explore'}/${item.data.id}`);
    }
    onClose();
  }, [query, navigate, onClose, addRecent]);

  // Keyboard handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allItems[selectedIdx]) { e.preventDefault(); executeItem(allItems[selectedIdx]); }
      // Tab cycling with Ctrl+Tab
      if (e.key === 'Tab' && !e.shiftKey && query) {
        e.preventDefault();
        const tabs = SEARCH_TABS.map(t => t.key);
        const currentIdx = tabs.indexOf(activeTab);
        setActiveTab(tabs[(currentIdx + 1) % tabs.length]);
        setSelectedIdx(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, allItems, selectedIdx, executeItem, activeTab, query]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  let runningIdx = 0;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div className="relative flex justify-center pt-[6vh] sm:pt-[10vh] px-3 sm:px-0">
        <div
          className="w-full max-w-[720px] bg-card rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Search input ── */}
          <div className="flex items-center gap-3 px-5 border-b">
            <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Search className="h-4 w-4 text-accent" />
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
              autoFocus
              placeholder="Search people, jobs, gigs, services, events, groups..."
              className="w-full h-14 bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted-foreground/60"
            />
            {hasQuery && (
              <button onClick={() => { setQuery(''); setSelectedIdx(0); }} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            {hasQuery && (
              <button
                onClick={() => toggleSaved(query)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                title={savedSearches.includes(query) ? 'Remove from saved' : 'Save search'}
              >
                {savedSearches.includes(query)
                  ? <Bookmark className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] fill-current" />
                  : <BookmarkPlus className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-muted text-[10px] text-muted-foreground font-mono shrink-0 border">ESC</kbd>
          </div>

          {/* ── Category tabs ── */}
          {hasQuery && (
            <div ref={tabsRef} className="flex items-center gap-0.5 px-3 py-2 border-b bg-muted/20 overflow-x-auto scrollbar-none">
              {SEARCH_TABS.map(tab => {
                const count = tabCounts[tab.key] || 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSelectedIdx(0); }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 flex items-center gap-1 whitespace-nowrap shrink-0',
                      activeTab === tab.key
                        ? 'bg-card shadow-sm text-foreground ring-1 ring-border'
                        : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
                    )}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                    {count > 0 && (
                      <span className={cn(
                        'text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-1',
                        activeTab === tab.key ? 'bg-accent/10 text-accent' : 'bg-muted'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Suggested filter chips ── */}
          {hasQuery && activeTab !== 'actions' && (
            <div className="flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto scrollbar-none">
              <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
              {SUGGESTED_FILTERS.map(f => (
                <button
                  key={f.label}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 whitespace-nowrap border border-transparent hover:border-border shrink-0"
                >
                  <f.icon className="h-2.5 w-2.5" />
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Results area ── */}
          <div ref={listRef} className="max-h-[50vh] sm:max-h-[440px] overflow-y-auto">
            {/* No query — show recent, saved, trending, quick nav */}
            {!hasQuery && (
              <div className="p-3">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-2.5 w-2.5" /> Recent Searches
                      </span>
                      <button onClick={clearRecent} className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-lg hover:bg-muted transition-colors">Clear</button>
                    </div>
                    {recentSearches.slice(0, 5).map(s => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); setSelectedIdx(0); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/50 transition-all duration-200 text-left hover:-translate-y-px group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="flex-1 text-xs font-medium">{s}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Saved searches */}
                {savedSearches.length > 0 && (
                  <div className="mb-3">
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Bookmark className="h-2.5 w-2.5" /> Saved Searches
                      </span>
                    </div>
                    {savedSearches.slice(0, 5).map(s => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); setSelectedIdx(0); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm hover:bg-muted/50 transition-all duration-200 text-left hover:-translate-y-px group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-[hsl(var(--gigvora-amber)/0.1)] flex items-center justify-center shrink-0">
                          <Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
                        </div>
                        <span className="flex-1 text-xs font-medium">{s}</span>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSaved(s); }}
                          className="p-1 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}

                {/* Trending queries */}
                <div className="mb-3">
                  <div className="px-2 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-2.5 w-2.5" /> Trending on Gigvora
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    {TRENDING_QUERIES.map(t => (
                      <button
                        key={t.label}
                        onClick={() => { setQuery(t.label); setSelectedIdx(0); }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200 text-left hover:-translate-y-px border border-transparent hover:border-border"
                      >
                        <div className="h-6 w-6 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0">
                          <t.icon className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium">{t.label}</div>
                          <div className="text-[8px] text-muted-foreground">{t.count}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keyboard hints */}
                <div className="px-3 py-2.5 rounded-xl bg-muted/30 text-[10px] text-muted-foreground mb-3">
                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[9px] font-mono border shadow-sm">↑↓</kbd> Navigate</span>
                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[9px] font-mono border shadow-sm">↵</kbd> Open</span>
                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[9px] font-mono border shadow-sm">Tab</kbd> Categories</span>
                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[9px] font-mono border shadow-sm">Esc</kbd> Close</span>
                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[9px] font-mono border shadow-sm">?</kbd> Shortcuts</span>
                  </div>
                </div>

                {/* Quick navigation */}
                <div>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Command className="h-2.5 w-2.5" /> Quick Navigation
                  </div>
                  {COMMANDS.filter(c => c.type !== 'action').slice(0, 8).map(item => {
                    const locked = item.entitlement && !hasEntitlement(item.entitlement);
                    return (
                      <button
                        key={item.id}
                        onClick={() => { if (!locked) { navigate(item.path); onClose(); } }}
                        className={cn(
                          'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left group',
                          locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 hover:-translate-y-px'
                        )}
                      >
                        <div className="h-8 w-8 rounded-xl bg-muted/70 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
                          <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{item.label}</div>
                          {item.description && <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>}
                        </div>
                        {locked && (
                          <Badge className="text-[7px] h-4 bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-0 rounded-lg">
                            <Lock className="h-2 w-2 mr-0.5" /> Pro
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Query results ── */}
            {hasQuery && (
              <div className="p-3">
                {/* Command results grouped */}
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="h-2.5 w-2.5" /> {category}
                    </div>
                    {items.map(item => {
                      const idx = runningIdx++;
                      const locked = item.entitlement && !hasEntitlement(item.entitlement);
                      return (
                        <button
                          key={item.id}
                          data-idx={idx}
                          onClick={() => { if (!locked) executeItem({ type: 'command', data: item }); }}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-all duration-200 text-left group',
                            selectedIdx === idx ? 'bg-accent/10 ring-1 ring-accent/20' : 'hover:bg-muted/50 hover:-translate-y-px',
                            locked && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          <div className={cn(
                            'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            item.type === 'action' ? 'bg-[hsl(var(--gigvora-blue)/0.1)]' : 'bg-muted/70'
                          )}>
                            <item.icon className={cn('h-4 w-4', item.type === 'action' ? 'text-[hsl(var(--gigvora-blue))]' : 'text-muted-foreground')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{item.label}</div>
                            {item.description && <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>}
                          </div>
                          {item.type === 'action' && (
                            <Badge className="text-[8px] h-4 bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))] border-0 rounded-lg">
                              Action
                            </Badge>
                          )}
                          {locked ? (
                            <Badge className="text-[7px] h-4 bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-0 rounded-lg">
                              <Lock className="h-2 w-2 mr-0.5" /> {ENTITLEMENT_LABELS[item.entitlement!]?.minPlan || 'Pro'}
                            </Badge>
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Entity results — grouped by type */}
                {filteredEntities.length > 0 && (
                  <>
                    {(() => {
                      const entityGroups = filteredEntities.reduce((acc, e) => {
                        const groupLabel = e.type === 'person' ? 'People'
                          : e.type === 'company' || e.type === 'agency' ? 'Companies & Agencies'
                          : e.type === 'job' ? 'Jobs'
                          : e.type === 'gig' ? 'Gigs'
                          : e.type === 'service' ? 'Services'
                          : e.type === 'project' ? 'Projects'
                          : e.type === 'event' || e.type === 'group' ? 'Events & Groups'
                          : 'Media & Pages';
                        (acc[groupLabel] = acc[groupLabel] || []).push(e);
                        return acc;
                      }, {} as Record<string, EntityResult[]>);

                      return Object.entries(entityGroups).map(([groupLabel, entities]) => (
                        <div key={groupLabel} className="mb-2">
                          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="h-2.5 w-2.5" /> {groupLabel}
                          </div>
                          {entities.map(entity => {
                            const idx = runningIdx++;
                            const EntityIcon = ENTITY_ICONS[entity.type] || Globe;
                            const entityColor = ENTITY_COLORS[entity.type] || 'bg-muted';
                            return (
                              <button
                                key={entity.id}
                                data-idx={idx}
                                onClick={() => executeItem({ type: 'entity', data: entity })}
                                className={cn(
                                  'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-all duration-200 text-left group',
                                  selectedIdx === idx ? 'bg-accent/10 ring-1 ring-accent/20' : 'hover:bg-muted/50 hover:-translate-y-px'
                                )}
                              >
                                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 relative', entityColor)}>
                                  <EntityIcon className="h-4 w-4" />
                                  {entity.verified && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[hsl(var(--gigvora-blue))] flex items-center justify-center ring-2 ring-card">
                                      <Shield className="h-2 w-2 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                    {entity.label}
                                    {entity.verified && <Sparkles className="h-3 w-3 text-[hsl(var(--gigvora-blue))]" />}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">{entity.meta}</div>
                                  {entity.location && (
                                    <div className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
                                      <MapPin className="h-2 w-2" /> {entity.location}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-[8px] h-5 capitalize rounded-lg shrink-0">{entity.type}</Badge>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </>
                )}

                {/* No results */}
                {allItems.length === 0 && (
                  <div className="py-10 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">No results for "{query}"</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 mb-5 max-w-xs mx-auto">Try a different search term, check your spelling, or browse trending topics below</p>
                    <div className="max-w-sm mx-auto space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                        <Sparkles className="h-2.5 w-2.5" /> Try these instead
                      </p>
                      {TRENDING_QUERIES.slice(0, 3).map(t => (
                        <button
                          key={t.label}
                          onClick={() => { setQuery(t.label); setSelectedIdx(0); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200 text-left border border-transparent hover:border-border"
                        >
                          <TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                          <span className="text-xs font-medium">{t.label}</span>
                          <span className="text-[9px] text-muted-foreground ml-auto">{t.count}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => { navigate('/explore'); onClose(); }}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--gigvora-blue))] hover:bg-[hsl(var(--gigvora-blue)/0.05)] transition-colors"
                    >
                      <Globe className="h-3.5 w-3.5" /> Open Full Explorer
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Full search CTA */}
                {allItems.length > 0 && (
                  <button
                    onClick={() => { addRecent(query); navigate(`/explore?q=${encodeURIComponent(query)}`); onClose(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-xs text-[hsl(var(--gigvora-blue))] hover:bg-[hsl(var(--gigvora-blue)/0.05)] transition-all duration-200 font-semibold mt-1 border border-dashed border-[hsl(var(--gigvora-blue)/0.2)]"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Search all of Gigvora for "{query}"
                    <ArrowRight className="h-3 w-3 ml-auto" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-5 py-2.5 border-t flex items-center justify-between text-[9px] text-muted-foreground bg-muted/20">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[8px] font-mono border shadow-sm">⌘K</kbd> Toggle
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[8px] font-mono border shadow-sm">Tab</kbd> Categories
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-card rounded-lg text-[8px] font-mono border shadow-sm">Shift+?</kbd> Shortcuts
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Powered by Gigvora Search
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
