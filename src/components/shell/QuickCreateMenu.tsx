import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Briefcase, FileText, Layers, Pen, Users,
  Megaphone, Building2, Store, Wifi,
  ClipboardList, Search, Video, Podcast, Target,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRole } from '@/contexts/RoleContext';
import type { UserRole } from '@/types/role';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
}

const QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  user: [
    { label: 'Search Talent', icon: Search, path: '/explore' },
    { label: 'Browse Services', icon: Store, path: '/services' },
    { label: 'Find Jobs', icon: Briefcase, path: '/jobs' },
    { label: 'Post a Project', icon: FileText, path: '/projects/create' },
    { label: 'Post a Job', icon: Briefcase, path: '/jobs/create' },
    { label: 'Start Networking Room', icon: Wifi, path: '/networking/create' },
  ],
  professional: [
    { label: 'Create a Gig', icon: Layers, path: '/gigs/create' },
    { label: 'List a Service', icon: Store, path: '/services/create' },
    { label: 'New Proposal', icon: FileText, path: '/projects' },
    { label: 'Create Content', icon: Pen, path: '/creation-studio' },
    { label: 'Create Post', icon: Pen, path: '/post/compose' },
    { label: 'Host Webinar', icon: Video, path: '/webinars/create' },
    { label: 'Start Podcast', icon: Podcast, path: '/podcasts/create' },
    { label: 'Post a Job', icon: Briefcase, path: '/jobs/create' },
    { label: 'Create Campaign', icon: Megaphone, path: '/ads/create' },
    { label: 'Start Networking Room', icon: Wifi, path: '/networking/create' },
  ],
  enterprise: [
    { label: 'Post a Job', icon: Briefcase, path: '/jobs/create' },
    { label: 'Create Campaign', icon: Megaphone, path: '/ads/create' },
    { label: 'New Project', icon: FileText, path: '/projects/create' },
    { label: 'Manage Services', icon: Store, path: '/services' },
    { label: 'Add Team Member', icon: Users, path: '/org/members' },
    { label: 'Enterprise Deal', icon: Building2, path: '/enterprise-connect' },
    { label: 'Candidate Search', icon: Search, path: '/recruiter-pro/talent' },
    { label: 'Create Content', icon: Pen, path: '/creation-studio' },
    { label: 'Start Networking Room', icon: Wifi, path: '/networking/create' },
  ],
  admin: [
    { label: 'View Queues', icon: ClipboardList, path: '/admin' },
    { label: 'Escalations', icon: Target, path: '/admin/trust-safety' },
    { label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs' },
  ],
};

export const QuickCreateMenu: React.FC = () => {
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const actions = QUICK_ACTIONS[activeRole] || QUICK_ACTIONS.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="h-7 w-7 p-0 rounded-md"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Quick Create
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-2 text-xs cursor-pointer py-1.5"
          >
            <action.icon className="h-3.5 w-3.5 text-muted-foreground" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
