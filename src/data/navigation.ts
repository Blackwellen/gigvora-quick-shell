import {
  Briefcase, Search, Users, Megaphone, Shield, HelpCircle,
  Home, Globe, FileText, BarChart3, Palette,
  Building2, Handshake, Target, Lightbulb, GraduationCap, Pen,
  Rocket, TrendingUp, Lock, CreditCard, Store,
  Calendar, Video, BookOpen, MessageSquare, Layers,
  UserCheck, Headphones, Settings,
  Activity, ScrollText, Database, Wallet,
  DollarSign, Wifi, Plus, Heart, Package,
  Sparkles, Zap, Star, Clock, Image,
} from 'lucide-react';

export interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
  icon: any;
  badge?: string;
}

export interface MegaMenuColumn {
  title: string;
  items: MegaMenuItem[];
}

export interface FeaturedItem {
  label: string;
  description: string;
  href: string;
  icon?: any;
}

export interface MegaMenuData {
  label: string;
  href?: string;
  icon?: any;
  badge?: string;
  searchable?: boolean;
  columns: MegaMenuColumn[];
  featured?: {
    title: string;
    items: FeaturedItem[];
  };
  quickActions?: { label: string; href: string }[];
  recentItems?: { label: string; href: string }[];
}

// ── Public top bar mega menus (conversion-focused) ──
export const PUBLIC_MEGA_MENUS: MegaMenuData[] = [
  {
    label: 'Product',
    searchable: true,
    columns: [
      {
        title: 'Marketplace',
        items: [
          { label: 'Jobs', description: 'Find and post job opportunities', href: '/showcase/jobs', icon: Briefcase },
          { label: 'Gigs', description: 'Browse and offer freelance services', href: '/showcase/gigs', icon: Layers },
          { label: 'Projects', description: 'Collaborate on project-based work', href: '/showcase/projects', icon: FileText },
          { label: 'Services', description: 'Professional service marketplace', href: '/showcase/services', icon: Store },
        ],
      },
      {
        title: 'Professional Tools',
        items: [
          { label: 'Recruiter Pro', description: 'Full ATS and talent sourcing', href: '/showcase/recruiter-pro', icon: UserCheck, badge: 'Pro' },
          { label: 'Sales Navigator', description: 'Lead discovery and CRM', href: '/showcase/sales-navigator', icon: Target, badge: 'Pro' },
          { label: 'Gigvora Ads', description: 'Promote and grow your reach', href: '/showcase/ads', icon: Megaphone },
          { label: 'Enterprise Connect', description: 'Startup and enterprise ecosystem', href: '/showcase/enterprise-connect', icon: Building2 },
        ],
      },
      {
        title: 'Community & Media',
        items: [
          { label: 'Networking', description: 'Rooms, speed networking, and connections', href: '/showcase/networking', icon: Users },
          { label: 'Events & Webinars', description: 'Attend or host professional events', href: '/showcase/events', icon: Calendar },
          { label: 'Podcasts', description: 'Listen and learn from experts', href: '/showcase/podcasts', icon: Headphones },
          { label: 'Mentorship', description: 'Find expert advisors and mentors', href: '/showcase/mentorship', icon: GraduationCap },
        ],
      },
    ],
    featured: {
      title: 'Featured',
      items: [
        { label: 'Enterprise Connect', description: 'Startup showcases, advisor marketplace & more — now live.', href: '/showcase/enterprise-connect', icon: Sparkles },
        { label: 'Creator Studio', description: 'Publish content, grow audience, monetize your expertise.', href: '/showcase/creator-studio', icon: Palette },
        { label: 'Experience Launchpad', description: 'Guided pathways for graduates, career changers & school leavers.', href: '/showcase/launchpad', icon: Rocket },
      ],
    },
  },
  {
    label: 'Solutions',
    columns: [
      {
        title: 'For Individuals',
        items: [
          { label: 'For Clients', description: 'Hire talent and manage projects', href: '/solutions/clients', icon: Users },
          { label: 'For Professionals', description: 'Build your career and deliver work', href: '/solutions/professionals', icon: Briefcase },
          { label: 'For Creators', description: 'Create content and grow audience', href: '/solutions/creators', icon: Pen },
        ],
      },
      {
        title: 'For Organizations',
        items: [
          { label: 'For Enterprise', description: 'Scale teams and operations', href: '/solutions/enterprise', icon: Building2 },
          { label: 'For Recruiters', description: 'Source and hire top talent', href: '/solutions/recruiters', icon: UserCheck },
          { label: 'For Agencies', description: 'Manage clients and deliver services', href: '/solutions/agencies', icon: Handshake },
          { label: 'For Advertisers', description: 'Reach your target audience', href: '/solutions/advertisers', icon: Megaphone },
        ],
      },
    ],
    featured: {
      title: 'Use Cases',
      items: [
        { label: 'Remote Team Building', description: 'Hire, manage, and pay distributed teams — all in one place.', href: '/solutions/enterprise', icon: Globe },
      ],
    },
  },
  {
    label: 'Resources',
    columns: [
      {
        title: 'Learn',
        items: [
          { label: 'Help Center', description: 'Guides, tutorials, and how-tos', href: '/help', icon: HelpCircle },
          { label: 'FAQ', description: 'Frequently asked questions', href: '/faq', icon: MessageSquare },
          { label: 'Blog', description: 'Insights and updates', href: '/blog', icon: BookOpen },
        ],
      },
      {
        title: 'Trust',
        items: [
          { label: 'Trust & Safety', description: 'How we protect you', href: '/trust-safety', icon: Shield },
          { label: 'Pricing', description: 'Plans and pricing', href: '/pricing', icon: CreditCard },
          { label: 'Status', description: 'Platform uptime and incidents', href: '/status', icon: Activity },
        ],
      },
    ],
  },
];

// ── Logged-in mega menus — intent-routed with deeper product families ──
export const LOGGED_IN_MEGA_MENUS: MegaMenuData[] = [
  {
    label: 'Home',
    href: '/feed',
    columns: [
      {
        title: 'Feed',
        items: [
          { label: 'Home Feed', description: 'Your personalized activity feed', href: '/feed', icon: Home },
          { label: 'Following', description: 'Posts from people you follow', href: '/feed?tab=following', icon: Users },
          { label: 'Trending', description: 'Popular posts and discussions', href: '/feed?tab=trending', icon: TrendingUp },
          { label: 'Recommended', description: 'Activity tailored to your interests', href: '/feed?tab=recommended', icon: Lightbulb },
        ],
      },
      {
        title: 'Personal',
        items: [
          { label: 'Dashboard', description: 'Your overview and analytics', href: '/dashboard', icon: BarChart3 },
          { label: 'Saved Items', description: 'Bookmarked content and items', href: '/saved', icon: Heart },
          { label: 'Calendar', description: 'Schedule and bookings', href: '/calendar', icon: Calendar },
          { label: 'Notifications', description: 'Alerts and updates', href: '/notifications', icon: Settings },
        ],
      },
    ],
    recentItems: [
      { label: 'E-commerce Project', href: '/projects/mine' },
      { label: 'Sarah Chen', href: '/inbox/sarah' },
    ],
  },
  {
    label: 'Network',
    searchable: true,
    columns: [
      {
        title: 'People',
        items: [
          { label: 'Networking Hub', description: 'Your network command center', href: '/networking', icon: Users },
          { label: 'Connections', description: 'Manage your connections', href: '/networking/connections', icon: Handshake },
          { label: 'Followers', description: 'People following you', href: '/networking/followers', icon: Star },
          { label: 'Suggestions', description: 'AI-powered recommendations', href: '/networking/suggestions', icon: UserCheck },
          { label: 'Digital Cards', description: 'Share and manage identity cards', href: '/networking/cards', icon: CreditCard },
        ],
      },
      {
        title: 'Engage',
        items: [
          { label: 'Follow-Up Center', description: 'Track relationship actions', href: '/networking/follow-ups', icon: Clock },
          { label: 'Introductions', description: 'Request and manage warm intros', href: '/networking/introductions', icon: Handshake },
          { label: 'Collaboration', description: 'Find project collaborators', href: '/networking/collaboration', icon: Globe },
          { label: 'Invitations', description: 'Pending connection requests', href: '/networking/invitations', icon: UserCheck },
        ],
      },
      {
        title: 'Live & Community',
        items: [
          { label: 'Networking Rooms', description: 'Live rooms and lobbies', href: '/networking/rooms', icon: Wifi },
          { label: 'Speed Networking', description: 'Timed 1:1 intro sessions', href: '/networking/speed', icon: Zap },
          { label: 'Events', description: 'Upcoming events and meetups', href: '/events', icon: Calendar },
          { label: 'Groups', description: 'Professional communities', href: '/groups', icon: Users },
        ],
      },
      {
        title: 'Enterprise Connect',
        items: [
          { label: 'Enterprise Rooms', description: 'Private executive rooms', href: '/enterprise-connect/rooms', icon: Video },
          { label: 'Startup Showcase', description: 'Featured startups + ranker', href: '/enterprise-connect/startups', icon: Rocket },
        ],
      },
    ],
    featured: {
      title: 'Grow Your Network',
      items: [
        { label: 'Speed Networking', description: 'Join live 1:1 networking sessions with professionals in your field.', href: '/networking/speed', icon: Zap },
        { label: 'Enterprise Connect', description: 'Premium · Executive B2B rooms, warm intros, and partner discovery.', href: '/enterprise-connect', icon: Rocket },
      ],
    },
    quickActions: [
      { label: 'Create Event', href: '/events/create' },
      { label: 'Start a Room', href: '/networking/create' },
      { label: 'Create Group', href: '/groups/create' },
    ],
  },
  {
    label: 'Work',
    searchable: true,
    href: '/work',
    columns: [
      {
        title: 'Projects',
        items: [
          { label: 'Browse Projects', description: 'Find project opportunities', href: '/projects', icon: FileText },
          { label: 'My Projects', description: 'Active project workspaces', href: '/projects/mine', icon: Layers },
        ],
      },
      {
        title: 'Global Tracking',
        items: [
          { label: 'Work Hub', description: 'Tasks, milestones, and approvals across all work', href: '/work', icon: Activity },
          { label: 'Orders Dashboard', description: 'Track all active orders', href: '/orders', icon: Package },
          { label: 'Contracts', description: 'Manage agreements and SOWs', href: '/contracts', icon: ScrollText },
          { label: 'Disputes', description: 'Resolution center', href: '/disputes', icon: Shield },
        ],
      },
      {
        title: 'Collaborate',
        items: [
          { label: 'Documents', description: 'Files, contracts, and deliverables', href: '/documents', icon: FileText },
          { label: 'Escrow & Funding', description: 'Milestone funding and releases', href: '/escrow', icon: Lock },
          { label: 'Calls & Video', description: 'Schedule or start a call', href: '/calls', icon: Video },
        ],
      },
    ],
    quickActions: [
      { label: 'Post a Project', href: '/projects/create' },
      { label: 'Create Contract', href: '/contracts/create' },
    ],
  },
  {
    label: 'Sell',
    columns: [
      {
        title: 'Offerings',
        items: [
          { label: 'My Services', description: 'Professional service listings', href: '/services/mine', icon: Store },
          { label: 'My Gigs', description: 'Productized freelance packages', href: '/gigs/mine', icon: Layers },
          { label: 'Browse Services', description: 'Service marketplace', href: '/services', icon: Globe },
          { label: 'Browse Gigs', description: 'Gig marketplace', href: '/gigs', icon: Search },
        ],
      },
      {
        title: 'Revenue',
        items: [
          { label: 'All Orders', description: 'Track all service and gig orders', href: '/orders', icon: Package },
          { label: 'Custom Offers', description: 'Tailored quotes and proposals', href: '/offers', icon: ScrollText },
          { label: 'Earnings & Payouts', description: 'Revenue and withdrawal', href: '/finance/payouts', icon: DollarSign },
        ],
      },
    ],
    featured: {
      title: 'Boost Sales',
      items: [
        { label: 'Sales Navigator', description: 'Pro · Lead, talent & account intelligence', href: '/sales-navigator', icon: Target },
        { label: 'Promote Your Services', description: 'Use Gigvora Ads to reach more clients and grow your revenue.', href: '/ads/promote', icon: Megaphone },
      ],
    },
    quickActions: [
      { label: 'Create Gig', href: '/gigs/create' },
      { label: 'List Service', href: '/services/create' },
      { label: 'Send Custom Offer', href: '/offers/create' },
    ],
  },
  {
    label: 'Hire',
    columns: [
      {
        title: 'Talent',
        items: [
          { label: 'Browse Jobs', description: 'Search all job listings', href: '/jobs', icon: Briefcase },
          { label: 'Post a Job', description: 'Create a new job listing', href: '/hire/jobs/create', icon: Plus },
          { label: 'Browse Talent', description: 'Search professionals by skill', href: '/explore/people', icon: Users },
          { label: 'Talent Pools', description: 'Curated candidate collections', href: '/hire/pools', icon: Database },
        ],
      },
      {
        title: 'Recruitment',
        items: [
          { label: 'Command Center', description: 'Recruiter home & ops dashboard', href: '/hire', icon: UserCheck },
          { label: 'Jobs Management', description: 'Manage all active job posts', href: '/hire/jobs', icon: Briefcase },
          { label: 'Pipeline', description: 'Candidate pipeline board', href: '/hire/pipeline', icon: Activity },
          { label: 'Candidate Search', description: 'Search and filter candidates', href: '/hire/search', icon: Users },
          { label: 'Interviews', description: 'Schedule and manage interviews', href: '/hire/interviews', icon: Video },
        ],
      },
      {
        title: 'Intelligence & Growth',
        items: [
          { label: 'Lead Search', description: 'Discover decision-makers by ICP filters', href: '/sales-navigator/leads', icon: Users },
          { label: 'Talent Search', description: 'Find passive candidates with intent signals', href: '/sales-navigator/talent', icon: UserCheck },
          { label: 'Account Search', description: 'Target accounts by firmographics', href: '/sales-navigator/accounts', icon: Building2 },
          { label: 'Experience Launchpad', description: 'Pathways for graduates, career changers & early talent', href: '/launchpad', icon: Rocket },
        ],
      },
    ],
    quickActions: [
      { label: 'Post a Job', href: '/hire/jobs/create' },
      { label: 'Search Candidates', href: '/hire/search' },
    ],
  },
  {
    label: 'Media',
    href: '/media',
    columns: [
      {
        title: 'Watch & Discover',
        items: [
          { label: 'Media Home', description: 'Browse all media content', href: '/media', icon: Video },
          { label: 'Reels', description: 'Short-form video entertainment', href: '/media/reels', icon: Zap },
          { label: 'Video Center', description: 'Long-form videos and tutorials', href: '/media/videos', icon: Video },
          { label: 'Podcasts', description: 'Listen and discover podcasts', href: '/podcasts', icon: Headphones },
          { label: 'Webinars', description: 'Live and recorded webinars', href: '/webinars', icon: Video },
        ],
      },
      {
        title: 'Library & Studio',
        items: [
          { label: 'My Library', description: 'Saved media, playlists, and history', href: '/media/library', icon: BookOpen },
          { label: 'Creation Studio', description: 'Content creation and publishing', href: '/creation-studio', icon: Palette },
          { label: 'Drafts', description: 'Work in progress and pending review', href: '/creation-studio/drafts', icon: FileText },
          { label: 'Scheduled', description: 'Queued and upcoming publishes', href: '/creation-studio/scheduled', icon: Calendar },
          { label: 'Asset Library', description: 'Manage media assets and files', href: '/creation-studio/assets', icon: Image },
          { label: 'Studio Analytics', description: 'Creator performance and revenue', href: '/creation-studio/analytics', icon: BarChart3 },
        ],
      },
    ],
    quickActions: [
      { label: 'Open Reels', href: '/media/reels' },
      { label: 'Create Webinar', href: '/webinars/create' },
      { label: 'Start Podcast', href: '/podcasts/create' },
    ],
  },
  {
    label: 'Grow',
    columns: [
      {
        title: 'Promote',
        items: [
          { label: 'My Pages', description: 'Manage your public pages', href: '/pages', icon: Globe },
          { label: 'Boost & Promote', description: 'Boost posts and offerings', href: '/ads/promote', icon: Rocket },
          { label: 'Audience Builder', description: 'Build target audiences', href: '/ads/audiences', icon: Target },
        ],
      },
      {
        title: 'Insights',
        items: [
          { label: 'Analytics', description: 'Global platform analytics', href: '/analytics', icon: BarChart3 },
          { label: 'AI Tools', description: 'AI assistants and generators', href: '/ai', icon: Sparkles },
          { label: 'Groups', description: 'Build and grow communities', href: '/groups/manage', icon: Users },
          { label: 'Integrations', description: 'Connect storage & AI providers', href: '/settings/integrations', icon: Settings },
        ],
      },
    ],
  },
];

// ── Avatar dropdown items — enriched user-control hub ──
export const AVATAR_DROPDOWN_ITEMS = [
  { label: 'User Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Pro Dashboard', href: '/dashboard/professional', icon: Briefcase },
  { label: 'Profile', href: '/profile', icon: Users },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  { label: 'My Projects', href: '/projects/mine', icon: Layers },
  { label: 'My Gigs', href: '/gigs/mine', icon: Store },
  { label: 'My Services', href: '/services/mine', icon: Package },
  { label: 'Saved Items', href: '/saved', icon: Heart },
  { label: 'Wallet & Credits', href: '/finance/wallet', icon: Wallet },
  { label: 'Billing & Invoices', href: '/finance/billing', icon: CreditCard },
  { label: 'Contracts', href: '/contracts', icon: FileText },
  { label: 'Calendar & Bookings', href: '/calendar', icon: Calendar },
  { label: 'Help & Support', href: '/help', icon: HelpCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
];

// ── Role-specific avatar menu items ──
export interface RoleMenuItem {
  label: string;
  icon: any;
  href: string;
  badge?: string;
}

export const ROLE_MENU_ITEMS: Record<string, { title: string; items: RoleMenuItem[] }> = {
  'user-client': {
    title: 'Client Actions',
    items: [
      { label: 'Client Dashboard', href: '/dashboard/client', icon: BarChart3 },
      { label: 'My Projects', href: '/projects/mine', icon: FileText },
      { label: 'Spending & Budget', href: '/finance/spending', icon: DollarSign },
      { label: 'Talent Search', href: '/explore/people', icon: Search },
      { label: 'Active Orders', href: '/orders', icon: Package },
      { label: 'Bookings', href: '/calendar', icon: Calendar },
    ],
  },
  professional: {
    title: 'Professional Actions',
    items: [
      { label: 'Pro Dashboard', href: '/dashboard/professional', icon: BarChart3 },
      { label: 'My Gigs', href: '/gigs/mine', icon: Layers },
      { label: 'My Services', href: '/services/mine', icon: Store },
      { label: 'Active Orders', href: '/orders', icon: Package },
      { label: 'Earnings & Payouts', href: '/finance/payouts', icon: DollarSign },
      { label: 'Creator Studio', href: '/creation-studio', icon: Palette },
      { label: 'Availability', href: '/settings/availability', icon: Calendar },
    ],
  },
  enterprise: {
    title: 'Enterprise Actions',
    items: [
      { label: 'Enterprise Dashboard', href: '/enterprise', icon: Building2 },
      { label: 'Team Management', href: '/enterprise/team', icon: Users },
      { label: 'Hiring & Recruitment', href: '/hire', icon: UserCheck },
      { label: 'Procurement', href: '/enterprise/procurement', icon: Package },
      { label: 'Billing & Invoices', href: '/finance/billing', icon: CreditCard },
      { label: 'Organization Settings', href: '/enterprise/settings', icon: Settings },
    ],
  },
};

// ── Footer data ──
export const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Gigs', href: '/gigs' },
      { label: 'Projects', href: '/projects' },
      { label: 'Services', href: '/services' },
      { label: 'Recruitment', href: '/hire' },
      { label: 'Sales Navigator', href: '/sales-navigator' },
      { label: 'Gigvora Ads', href: '/ads' },
      { label: 'Enterprise Connect', href: '/enterprise-connect' },
      { label: 'Networking', href: '/networking' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'For Clients', href: '/solutions/clients' },
      { label: 'For Professionals', href: '/solutions/professionals' },
      { label: 'For Enterprise', href: '/solutions/enterprise' },
      { label: 'For Recruiters', href: '/solutions/recruiters' },
      { label: 'For Agencies', href: '/solutions/agencies' },
      { label: 'For Advertisers', href: '/solutions/advertisers' },
      { label: 'For Creators', href: '/solutions/creators' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/support/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'User Agreements', href: '/user-agreements' },
      { label: 'Trust & Safety', href: '/trust-safety' },
      { label: 'Community Guidelines', href: '/legal/community-guidelines' },
      { label: 'Disputes Policy', href: '/legal/disputes-policy' },
      { label: 'Payments & Escrow', href: '/legal/payments-escrow' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact Us', href: '/support/contact' },
      { label: 'Status', href: '/status' },
      { label: 'Community', href: '/groups' },
    ],
  },
];
