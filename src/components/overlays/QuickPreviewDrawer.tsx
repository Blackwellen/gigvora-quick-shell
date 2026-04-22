import React from 'react';
import { X, ExternalLink, Bookmark, MoreHorizontal, Share2, Flag, Clock, Shield, MapPin, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface QuickPreviewData {
  id: string;
  type: 'job' | 'gig' | 'project' | 'profile' | 'company' | 'event' | 'group';
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: 'healthy' | 'caution' | 'blocked' | 'premium';
  description?: string;
  meta?: Array<{ label: string; value: string }>;
  tags?: string[];
  actions?: Array<{ label: string; onClick: () => void; variant?: 'default' | 'outline' | 'ghost' }>;
  detailPath?: string;
  avatar?: string;
  timestamp?: string;
  verified?: boolean;
  location?: string;
}

interface QuickPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: QuickPreviewData | null;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  caution: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  blocked: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
  premium: 'bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))]',
};

const TYPE_LABELS: Record<string, string> = {
  job: 'Job', gig: 'Gig', project: 'Project', profile: 'Profile',
  company: 'Company', event: 'Event', group: 'Group',
};

const TYPE_COLORS: Record<string, string> = {
  job: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  gig: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  project: 'bg-accent/10 text-accent',
  profile: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
  company: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  event: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  group: 'bg-muted text-muted-foreground',
};

export const QuickPreviewDrawer: React.FC<QuickPreviewDrawerProps> = ({ open, onOpenChange, data }) => {
  const navigate = useNavigate();

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md bg-card shadow-2xl border-l sm:rounded-l-3xl flex flex-col animate-in slide-in-from-right-8 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-[8px] h-5 capitalize rounded-lg border-0', TYPE_COLORS[data.type] || 'bg-muted')}>
              {TYPE_LABELS[data.type]}
            </Badge>
            {data.status && (
              <Badge className={cn('text-[8px] h-5 border-0 rounded-lg', STATUS_COLORS[data.statusColor || 'healthy'])}>
                {data.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {data.detailPath && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => { navigate(data.detailPath!); onOpenChange(false); }}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5">
                <DropdownMenuItem className="text-xs gap-2 rounded-xl"><Bookmark className="h-3 w-3" /> Save to Collection</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2 rounded-xl"><Share2 className="h-3 w-3" /> Share Link</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2 rounded-xl"><Eye className="h-3 w-3" /> Open in New Tab</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2 text-destructive rounded-xl"><Flag className="h-3 w-3" /> Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Avatar + Title */}
          <div className="flex items-start gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-muted/70 flex items-center justify-center shrink-0 text-lg font-bold text-muted-foreground relative">
              {data.title.charAt(0)}
              {data.verified && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[hsl(var(--gigvora-blue))] flex items-center justify-center ring-2 ring-card">
                  <Shield className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold leading-snug">{data.title}</h2>
              {data.subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{data.subtitle}</p>}
              <div className="flex items-center gap-3 mt-1.5">
                {data.timestamp && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {data.timestamp}
                  </span>
                )}
                {data.location && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {data.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {data.description && (
            <div className="rounded-2xl bg-muted/30 p-3.5 border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">{data.description}</p>
            </div>
          )}

          {/* Meta fields */}
          {data.meta && data.meta.length > 0 && (
            <div className="rounded-2xl bg-muted/20 border overflow-hidden">
              {data.meta.map((m, i) => (
                <div key={i} className={cn('flex items-center justify-between px-4 py-2.5', i > 0 && 'border-t')}>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
                  <span className="text-[11px] font-semibold">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[9px] h-5 rounded-lg hover:bg-muted/50 transition-colors cursor-default">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t px-5 py-4 space-y-2">
          {data.detailPath && (
            <Button className="w-full text-[11px] h-10 gap-2 rounded-2xl" onClick={() => { navigate(data.detailPath!); onOpenChange(false); }}>
              <ExternalLink className="h-3.5 w-3.5" /> View Full Details
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
          )}
          {data.actions && data.actions.length > 0 && (
            <div className="flex items-center gap-2">
              {data.actions.map((action, i) => (
                <Button key={i} variant={action.variant || 'outline'} size="sm" className="flex-1 text-[10px] h-8 rounded-xl" onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
