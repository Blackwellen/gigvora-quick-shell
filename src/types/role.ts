export type UserRole =
  | 'user'
  | 'professional'
  | 'enterprise'
  | 'admin';

/** @deprecated use 'admin' role directly */
export type AdminRole = 'admin';
export type AppRole = UserRole;

/* ── Plans & Entitlements ── */
export type PlanTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
export type FeatureEntitlement =
  | 'recruiter-pro'
  | 'sales-navigator'
  | 'ads-manager'
  | 'creation-studio-pro'
  | 'enterprise-connect'
  | 'advanced-analytics'
  | 'priority-support'
  | 'custom-branding'
  | 'api-access'
  | 'sso'
  | 'team-management'
  | 'document-studio'
  | 'bulk-messaging';

export interface PlanConfig {
  id: PlanTier;
  label: string;
  description: string;
  price: { monthly: number; annual: number };
  entitlements: FeatureEntitlement[];
  limits: {
    proposals: number;
    projects: number;
    gigSlots: number;
    teamMembers: number;
    storage: string;
  };
  badge?: string;
  highlight?: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    description: 'Get started with basic features',
    price: { monthly: 0, annual: 0 },
    entitlements: [],
    limits: { proposals: 5, projects: 2, gigSlots: 3, teamMembers: 1, storage: '500 MB' },
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    description: 'For growing professionals',
    price: { monthly: 19, annual: 190 },
    entitlements: ['creation-studio-pro', 'document-studio'],
    limits: { proposals: 20, projects: 10, gigSlots: 10, teamMembers: 3, storage: '5 GB' },
    badge: 'Popular',
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    description: 'Unlock advanced tools and priority support',
    price: { monthly: 49, annual: 490 },
    entitlements: ['creation-studio-pro', 'document-studio', 'advanced-analytics', 'priority-support', 'recruiter-pro', 'ads-manager'],
    limits: { proposals: 100, projects: 50, gigSlots: 50, teamMembers: 10, storage: '50 GB' },
    highlight: true,
  },
  business: {
    id: 'business',
    label: 'Business',
    description: 'For teams and agencies',
    price: { monthly: 99, annual: 990 },
    entitlements: ['recruiter-pro', 'sales-navigator', 'ads-manager', 'creation-studio-pro', 'advanced-analytics', 'priority-support', 'custom-branding', 'api-access', 'team-management', 'document-studio', 'bulk-messaging'],
    limits: { proposals: 500, projects: 200, gigSlots: 200, teamMembers: 50, storage: '200 GB' },
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Custom solutions at scale',
    price: { monthly: 0, annual: 0 },
    entitlements: ['recruiter-pro', 'sales-navigator', 'ads-manager', 'creation-studio-pro', 'enterprise-connect', 'advanced-analytics', 'priority-support', 'custom-branding', 'api-access', 'sso', 'team-management', 'document-studio', 'bulk-messaging'],
    limits: { proposals: -1, projects: -1, gigSlots: -1, teamMembers: -1, storage: 'Unlimited' },
  },
};

export const ENTITLEMENT_LABELS: Record<FeatureEntitlement, { label: string; description: string; minPlan: PlanTier }> = {
  'recruiter-pro': { label: 'Recruiter Pro', description: 'Full ATS, talent search, and interview pipeline', minPlan: 'pro' },
  'sales-navigator': { label: 'Sales Navigator', description: 'Lead discovery, CRM integration, and outreach', minPlan: 'business' },
  'ads-manager': { label: 'Ads Manager', description: 'Create and manage advertising campaigns', minPlan: 'pro' },
  'creation-studio-pro': { label: 'Creation Studio Pro', description: 'Advanced content creation and media tools', minPlan: 'starter' },
  'enterprise-connect': { label: 'Enterprise Connect', description: 'Enterprise team management and SSO', minPlan: 'enterprise' },
  'advanced-analytics': { label: 'Advanced Analytics', description: 'Deep insights, reports, and custom dashboards', minPlan: 'pro' },
  'priority-support': { label: 'Priority Support', description: '24/7 support with dedicated account manager', minPlan: 'pro' },
  'custom-branding': { label: 'Custom Branding', description: 'White-label your workspace and profiles', minPlan: 'business' },
  'api-access': { label: 'API Access', description: 'Programmatic access to Gigvora platform', minPlan: 'business' },
  'sso': { label: 'Single Sign-On', description: 'SAML/OIDC SSO for your organization', minPlan: 'enterprise' },
  'team-management': { label: 'Team Management', description: 'Manage team members, roles, and permissions', minPlan: 'business' },
  'document-studio': { label: 'Document Studio', description: 'Contract templates, e-signatures, and storage', minPlan: 'starter' },
  'bulk-messaging': { label: 'Bulk Messaging', description: 'Send messages to multiple recipients at once', minPlan: 'business' },
};

/* ── Role Config ── */
export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  icon: string;
  shellFocus: string;
  dashboardTabs: DashboardTab[];
}

export interface DashboardTab {
  id: string;
  label: string;
  path: string;
  icon?: string;
  entitlement?: FeatureEntitlement;
}

const ADMIN_DASHBOARD_TABS_INTERNAL: DashboardTab[] = [
  { id: 'overview', label: 'Overview', path: '/admin' },
  { id: 'users', label: 'Users', path: '/admin/users' },
  { id: 'moderation', label: 'Moderation', path: '/admin/moderation' },
  { id: 'trust-safety', label: 'Trust & Safety', path: '/admin/trust-safety' },
  { id: 'finance', label: 'Finance Ops', path: '/admin/finance' },
  { id: 'support', label: 'Support Ops', path: '/admin/support' },
  { id: 'verification', label: 'Verification', path: '/admin/verification' },
  { id: 'ads-ops', label: 'Ads Ops', path: '/admin/ads-ops' },
  { id: 'platform', label: 'Platform Ops', path: '/admin/platform' },
  { id: 'feature-flags', label: 'Feature Flags', path: '/admin/feature-flags' },
  { id: 'audit-logs', label: 'Audit Logs', path: '/admin/audit-logs' },
  { id: 'settings', label: 'Settings', path: '/admin/settings' },
];

/** @deprecated — use ROLE_CONFIGS['admin'].dashboardTabs */
export const ADMIN_DASHBOARD_TABS: DashboardTab[] = ADMIN_DASHBOARD_TABS_INTERNAL;

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  user: {
    id: 'user',
    label: 'User',
    description: 'Browse, hire, book, manage orders, and personal activity',
    icon: 'User',
    shellFocus: 'Personal control center — discover, hire, and manage',
    dashboardTabs: [
      { id: 'overview', label: 'Overview', path: '/dashboard/overview' },
      { id: 'activity', label: 'Activity', path: '/dashboard/activity' },
      { id: 'saved', label: 'Saved', path: '/dashboard/saved' },
      { id: 'bookings', label: 'Bookings', path: '/dashboard/bookings' },
      { id: 'hiring', label: 'Hiring', path: '/dashboard/hiring' },
      { id: 'proposals', label: 'Proposals', path: '/dashboard/proposals' },
      { id: 'active-work', label: 'Active Work', path: '/dashboard/active-work' },
      { id: 'orders', label: 'Orders', path: '/dashboard/orders' },
      { id: 'shortlist', label: 'Shortlist', path: '/dashboard/shortlist' },
      { id: 'network', label: 'Network', path: '/dashboard/network' },
      { id: 'spend', label: 'Spend', path: '/dashboard/spend' },
      { id: 'contracts', label: 'Contracts', path: '/dashboard/contracts' },
      { id: 'finance', label: 'Finance', path: '/dashboard/finance' },
      { id: 'settings', label: 'Settings', path: '/dashboard/settings' },
    ],
  },
  professional: {
    id: 'professional',
    label: 'Professional',
    description: 'Sell, create, recruit, advertise, earn, and grow',
    icon: 'Briefcase',
    shellFocus: 'Pipeline, earnings, content, recruiting, and ads',
    dashboardTabs: [
      { id: 'overview', label: 'Overview', path: '/dashboard/overview' },
      { id: 'pipeline', label: 'Pipeline', path: '/dashboard/pipeline' },
      { id: 'gigs', label: 'Gigs', path: '/dashboard/gigs' },
      { id: 'services', label: 'Services', path: '/dashboard/services' },
      { id: 'projects', label: 'Projects', path: '/dashboard/projects' },
      { id: 'orders', label: 'Orders', path: '/dashboard/orders' },
      { id: 'earnings', label: 'Earnings', path: '/dashboard/earnings' },
      { id: 'availability', label: 'Availability', path: '/dashboard/availability' },
      { id: 'content', label: 'Content', path: '/dashboard/content' },
      { id: 'creation-studio', label: 'Creation Studio', path: '/creation-studio', entitlement: 'creation-studio-pro' },
      { id: 'documents', label: 'Documents', path: '/documents', entitlement: 'document-studio' },
      { id: 'recruiting', label: 'Recruiting', path: '/recruiter-pro', entitlement: 'recruiter-pro' },
      { id: 'ads', label: 'Ads', path: '/ads', entitlement: 'ads-manager' },
      { id: 'media', label: 'Media', path: '/dashboard/media' },
      { id: 'monetization', label: 'Monetization', path: '/dashboard/monetization' },
      { id: 'network', label: 'Network', path: '/dashboard/network' },
      { id: 'analytics', label: 'Analytics', path: '/dashboard/analytics', entitlement: 'advanced-analytics' },
      { id: 'settings', label: 'Settings', path: '/dashboard/settings' },
    ],
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Org management, hiring, sales, procurement, and team ops',
    icon: 'Building2',
    shellFocus: 'Enterprise command center',
    dashboardTabs: [
      { id: 'overview', label: 'Overview', path: '/dashboard/overview' },
      { id: 'team', label: 'Team', path: '/org', entitlement: 'team-management' },
      { id: 'hiring-ats', label: 'Hiring / ATS', path: '/recruiter-pro', entitlement: 'recruiter-pro' },
      { id: 'sales', label: 'Sales', path: '/navigator', entitlement: 'sales-navigator' },
      { id: 'enterprise-connect', label: 'Enterprise Connect', path: '/enterprise-connect', entitlement: 'enterprise-connect' },
      { id: 'projects', label: 'Projects', path: '/projects' },
      { id: 'services', label: 'Services', path: '/services' },
      { id: 'gigs', label: 'Gigs', path: '/gigs' },
      { id: 'ads', label: 'Ads', path: '/ads', entitlement: 'ads-manager' },
      { id: 'clients', label: 'Clients', path: '/dashboard/clients' },
      { id: 'proposals', label: 'Proposals', path: '/dashboard/proposals' },
      { id: 'utilization', label: 'Utilization', path: '/dashboard/utilization' },
      { id: 'creation-studio', label: 'Creation Studio', path: '/creation-studio', entitlement: 'creation-studio-pro' },
      { id: 'network-events', label: 'Network & Events', path: '/networking' },
      { id: 'finance', label: 'Finance', path: '/finance' },
      { id: 'analytics', label: 'Analytics', path: '/dashboard/analytics', entitlement: 'advanced-analytics' },
      { id: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
  admin: {
    id: 'admin',
    label: 'Internal Admin',
    description: 'Ops queues, governance, risk, finance, support',
    icon: 'ShieldCheck',
    shellFocus: 'Role-specific internal dashboard',
    dashboardTabs: ADMIN_DASHBOARD_TABS_INTERNAL,
  },
};
