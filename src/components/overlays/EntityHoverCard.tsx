import React from 'react';
import { Link } from 'react-router-dom';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { MapPin, Star, Shield, ExternalLink, MessageSquare, UserPlus, Bookmark, Clock, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EntityType = 'person' | 'company' | 'gig' | 'job' | 'project' | 'event' | 'group' | 'service';

export interface EntityHoverData {
  type: EntityType;
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  verified?: boolean;
  rating?: number;
  location?: string;
  status?: 'healthy' | 'caution' | 'blocked' | 'premium' | 'live' | 'pending';
  statusLabel?: string;
  tags?: string[];
  stats?: Array<{ label: string; value: string }>;
  detailPath: string;
  description?: string;
}

interface EntityHoverCardProps {
  data: EntityHoverData;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

const TYPE_ICONS: Partial<Record<EntityType, React.ElementType>> = {
  person: undefined,
  company: undefined,
  gig: Briefcase,
  job: Briefcase,
};

const TYPE_ACCENT: Record<EntityType, string> = {
  person: 'bg-accent/10 text-accent',
  company: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  gig: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  job: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  project: 'bg-accent/10 text-accent',
  event: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  group: 'bg-muted text-muted-foreground',
  service: 'bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]',
};

export const EntityHoverCard: React.FC<EntityHoverCardProps> = ({
  data, children, side = 'bottom', align = 'start',
}) => {
  const initials = data.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side={side} align={align} className="w-80 p-0">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 rounded-2xl ring-1 ring-border">
              <AvatarImage src={data.avatar} alt={data.title} className="rounded-2xl" />
              <AvatarFallback className={cn('rounded-2xl text-xs font-bold', TYPE_ACCENT[data.type])}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link to={data.detailPath} className="text-xs font-bold hover:text-accent transition-colors truncate">
                  {data.title}
                </Link>
                {data.verified && (
                  <Shield className="h-3 w-3 text-accent shrink-0" />
                )}
              </div>
              {data.subtitle && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{data.subtitle}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-[7px] h-3.5 border-0 capitalize rounded-lg px-1.5', TYPE_ACCENT[data.type])}>
                  {data.type}
                </Badge>
                {data.status && <StatusBadge status={data.status} label={data.statusLabel} />}
              </div>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-4 pb-3 flex items-center gap-3 text-[9px] text-muted-foreground">
          {data.location && (
            <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{data.location}</span>
          )}
          {data.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" />
              <span className="font-medium text-foreground">{data.rating}</span>
            </span>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{data.description}</p>
          </div>
        )}

        {/* Stats */}
        {data.stats && data.stats.length > 0 && (
          <div className="px-4 pb-3 flex items-center gap-3">
            {data.stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-[10px] font-bold">{s.value}</div>
                <div className="text-[8px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1">
            {data.tags.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] h-4 rounded-lg">{tag}</Badge>
            ))}
            {data.tags.length > 4 && (
              <span className="text-[8px] text-muted-foreground self-center">+{data.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="border-t px-3 py-2.5 flex items-center gap-1.5">
          <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" asChild>
            <Link to={data.detailPath}>
              <ExternalLink className="h-3 w-3" /> View
            </Link>
          </Button>
          {data.type === 'person' && (
            <>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl">
                <UserPlus className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl">
                <MessageSquare className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl">
            <Bookmark className="h-3 w-3" />
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
