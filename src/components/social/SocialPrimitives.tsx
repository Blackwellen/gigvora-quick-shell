import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Crown, Shield, Zap, Wifi, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/* ═══════════════════════════════════════════════════════════
   Rich Avatar — status ring, verified badge, live indicator
   ═══════════════════════════════════════════════════════════ */
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline' | 'live' | 'recording';

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: 'bg-[hsl(var(--state-healthy))]',
  away: 'bg-[hsl(var(--state-caution))]',
  busy: 'bg-[hsl(var(--state-blocked))]',
  offline: 'bg-muted-foreground/40',
  live: 'bg-[hsl(var(--state-blocked))]',
  recording: 'bg-[hsl(var(--state-blocked))]',
};

interface RichAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: AvatarStatus;
  verified?: boolean;
  premium?: boolean;
  admin?: boolean;
  className?: string;
}

const AVATAR_SIZES = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const STATUS_SIZES = {
  xs: 'h-2 w-2 ring-1',
  sm: 'h-2.5 w-2.5 ring-[1.5px]',
  md: 'h-3 w-3 ring-2',
  lg: 'h-3.5 w-3.5 ring-2',
  xl: 'h-4 w-4 ring-2',
};

const BADGE_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4.5 w-4.5',
  xl: 'h-5 w-5',
};

export const RichAvatar: React.FC<RichAvatarProps> = ({
  src, name, size = 'md', status, verified, premium, admin, className,
}) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const ringColor = premium ? 'ring-[hsl(var(--state-premium))]' : admin ? 'ring-destructive' : 'ring-border';

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={cn(
        AVATAR_SIZES[size],
        'ring-2 transition-transform duration-200',
        ringColor,
        status === 'live' && 'ring-[hsl(var(--state-blocked))] animate-pulse',
      )}>
        <AvatarImage src={src} alt={name} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Status dot */}
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full ring-card',
          STATUS_COLORS[status],
          STATUS_SIZES[size],
          status === 'live' && 'animate-pulse',
          status === 'recording' && 'animate-pulse',
        )} />
      )}

      {/* Verified / premium / admin badge */}
      {verified && (
        <span className="absolute -top-0.5 -right-0.5">
          <CheckCircle2 className={cn('text-accent fill-accent', size === 'xs' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
        </span>
      )}
      {premium && !verified && (
        <span className="absolute -top-0.5 -right-0.5">
          <Crown className={cn('text-[hsl(var(--state-premium))]', size === 'xs' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
        </span>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Stacked Avatar Cluster — overlapping identity group
   ═══════════════════════════════════════════════════════════ */
interface StackedAvatarsProps {
  users: { name: string; src?: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StackedAvatars: React.FC<StackedAvatarsProps> = ({
  users, max = 4, size = 'sm', className,
}) => {
  const shown = users.slice(0, max);
  const overflow = users.length - max;
  const sizeClass = size === 'xs' ? 'h-5 w-5' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const overlap = size === 'xs' ? '-ml-1.5' : size === 'sm' ? '-ml-2' : '-ml-2.5';
  const textSize = size === 'xs' ? 'text-[7px]' : size === 'sm' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((u, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <Avatar className={cn(sizeClass, 'ring-2 ring-card', i > 0 && overlap, 'transition-transform hover:scale-110 hover:z-10 cursor-pointer')}>
              <AvatarImage src={u.src} alt={u.name} />
              <AvatarFallback className={cn('bg-primary/10 text-primary font-bold', textSize)}>
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent className="text-[10px]">{u.name}</TooltipContent>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <div className={cn(sizeClass, overlap, 'rounded-full bg-muted border-2 border-card flex items-center justify-center cursor-pointer hover:scale-110 transition-transform')}>
          <span className={cn('font-bold text-muted-foreground', textSize)}>+{overflow}</span>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Live Badge — pulsing indicator for streaming/live events
   ═══════════════════════════════════════════════════════════ */
interface LiveBadgeProps {
  label?: string;
  variant?: 'live' | 'recording' | 'upcoming' | 'ended';
  className?: string;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ label, variant = 'live', className }) => {
  const styles = {
    live: 'bg-destructive/10 text-destructive border-destructive/20',
    recording: 'bg-destructive/10 text-destructive border-destructive/20',
    upcoming: 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))] border-[hsl(var(--state-caution))]/20',
    ended: 'bg-muted text-muted-foreground border-border',
  };
  const icons = { live: Wifi, recording: Wifi, upcoming: Clock, ended: Clock };
  const Icon = icons[variant];
  const defaultLabel = { live: 'LIVE', recording: 'REC', upcoming: 'SOON', ended: 'ENDED' };

  return (
    <Badge variant="outline" className={cn(
      'gap-1 text-[8px] font-bold uppercase tracking-wider rounded-lg px-1.5 py-0.5',
      styles[variant],
      (variant === 'live' || variant === 'recording') && 'animate-pulse',
      className,
    )}>
      <Icon className="h-2 w-2" />
      {label || defaultLabel[variant]}
    </Badge>
  );
};

/* ═══════════════════════════════════════════════════════════
   Activity Trace — recent-action micro-label
   ═══════════════════════════════════════════════════════════ */
interface ActivityTraceProps {
  action: string;
  timestamp: string;
  className?: string;
}

export const ActivityTrace: React.FC<ActivityTraceProps> = ({ action, timestamp, className }) => (
  <div className={cn('flex items-center gap-1 text-[9px] text-muted-foreground', className)}>
    <Zap className="h-2.5 w-2.5 text-accent" />
    <span>{action}</span>
    <span className="text-muted-foreground/50">·</span>
    <span>{timestamp}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Reaction Bar — emoji reactions with counts
   ═══════════════════════════════════════════════════════════ */
interface ReactionBarProps {
  reactions: { emoji: string; count: number; reacted?: boolean }[];
  onReact?: (emoji: string) => void;
  className?: string;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ reactions, onReact, className }) => (
  <div className={cn('flex items-center gap-1 flex-wrap', className)}>
    {reactions.filter(r => r.count > 0).map(r => (
      <button
        key={r.emoji}
        onClick={() => onReact?.(r.emoji)}
        className={cn(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border transition-all duration-200',
          'hover:scale-105 hover:shadow-sm active:scale-95',
          r.reacted
            ? 'bg-accent/10 border-accent/30 text-accent'
            : 'bg-card border-border text-muted-foreground hover:border-accent/20',
        )}
      >
        <span>{r.emoji}</span>
        <span className="font-medium">{r.count}</span>
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Event Countdown — live countdown timer
   ═══════════════════════════════════════════════════════════ */
interface EventCountdownProps {
  label: string;
  date: string;
  attendees?: number;
  avatars?: { name: string; src?: string }[];
  className?: string;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({
  label, date, attendees, avatars, className,
}) => (
  <div className={cn(
    'rounded-2xl border bg-card p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer',
    className,
  )}>
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold group-hover:text-accent transition-colors truncate">{label}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5">{date}</div>
      </div>
      <LiveBadge variant="upcoming" />
    </div>
    {(attendees || avatars) && (
      <div className="flex items-center justify-between mt-1.5">
        {avatars && <StackedAvatars users={avatars} max={3} size="xs" />}
        {attendees && (
          <span className="text-[9px] text-muted-foreground">{attendees} attending</span>
        )}
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Shimmer Loader — skeleton with animated shimmer
   ═══════════════════════════════════════════════════════════ */
interface ShimmerProps {
  className?: string;
  variant?: 'line' | 'circle' | 'card' | 'avatar';
}

export const Shimmer: React.FC<ShimmerProps> = ({ className, variant = 'line' }) => {
  const baseClass = 'animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/5 to-muted bg-[length:200%_100%] rounded-xl';
  
  if (variant === 'circle') return <div className={cn(baseClass, 'h-10 w-10 rounded-full', className)} />;
  if (variant === 'avatar') return <div className={cn(baseClass, 'h-8 w-8 rounded-full', className)} />;
  if (variant === 'card') return (
    <div className={cn('rounded-2xl border bg-card p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <div className={cn(baseClass, 'h-10 w-10 rounded-full shrink-0')} />
        <div className="flex-1 space-y-1.5">
          <div className={cn(baseClass, 'h-3 w-2/3')} />
          <div className={cn(baseClass, 'h-2.5 w-1/3')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className={cn(baseClass, 'h-2.5 w-full')} />
        <div className={cn(baseClass, 'h-2.5 w-4/5')} />
        <div className={cn(baseClass, 'h-2.5 w-3/5')} />
      </div>
      <div className={cn(baseClass, 'h-32 w-full rounded-xl')} />
    </div>
  );
  return <div className={cn(baseClass, 'h-3 w-full', className)} />;
};

/* ═══════════════════════════════════════════════════════════
   Empty State — illustrated empty state with CTA
   ═══════════════════════════════════════════════════════════ */
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon, title, description, action, className,
}) => (
  <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
    <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mb-4 animate-float">
      <Icon className="h-7 w-7 text-accent" />
    </div>
    <h3 className="text-sm font-semibold mb-1">{title}</h3>
    <p className="text-[11px] text-muted-foreground max-w-[280px] mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-medium hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
      >
        {action.label}
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   RSVP Chip — event attendance state
   ═══════════════════════════════════════════════════════════ */
interface RSVPChipProps {
  status: 'going' | 'maybe' | 'not-going' | 'invited';
  onChange?: (status: string) => void;
  className?: string;
}

export const RSVPChip: React.FC<RSVPChipProps> = ({ status, onChange, className }) => {
  const styles = {
    going: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-[hsl(var(--state-healthy))]/20',
    maybe: 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))] border-[hsl(var(--state-caution))]/20',
    'not-going': 'bg-muted text-muted-foreground border-border',
    invited: 'bg-accent/10 text-accent border-accent/20',
  };
  const labels = { going: '✓ Going', maybe: '? Maybe', 'not-going': '✗ Not Going', invited: '✉ Invited' };

  return (
    <button
      onClick={() => onChange?.(status)}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold border transition-all duration-200 hover:scale-105 active:scale-95',
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════
   Mini Waveform — audio visualization placeholder
   ═══════════════════════════════════════════════════════════ */
interface WaveformProps {
  bars?: number;
  active?: boolean;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ bars = 12, active = false, className }) => (
  <div className={cn('flex items-end gap-px h-6', className)}>
    {Array.from({ length: bars }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'w-0.5 rounded-full transition-all duration-300',
          active ? 'bg-accent animate-waveform' : 'bg-muted-foreground/20',
        )}
        style={{
          height: `${20 + Math.sin(i * 0.8) * 60 + Math.random() * 20}%`,
          animationDelay: active ? `${i * 80}ms` : undefined,
        }}
      />
    ))}
  </div>
);
