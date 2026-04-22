import React from 'react';
import { cn } from '@/lib/utils';

/* ── KPI Card ── */
interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, change, trend, className }) => (
  <div className={cn('rounded-2xl border bg-card p-3 shadow-card transition-shadow duration-200', className)}>
    <div className="dense-label mb-1">{label}</div>
    <div className="text-xl font-bold tracking-tight">{value}</div>
    {change && (
      <div className={cn(
        'text-[11px] mt-0.5 font-medium',
        trend === 'up' && 'state-healthy',
        trend === 'down' && 'state-blocked',
        trend === 'neutral' && 'text-muted-foreground',
      )}>
        {trend === 'up' && '↑ '}{trend === 'down' && '↓ '}{change}
      </div>
    )}
  </div>
);

/* ── KPI Band (horizontal strip) ── */
interface KPIBandProps {
  children: React.ReactNode;
  className?: string;
}

export const KPIBand: React.FC<KPIBandProps> = ({ children, className }) => (
  <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-2', className)}>
    {children}
  </div>
);

/* ── Status Badge ── */
type StatusType = 'healthy' | 'caution' | 'blocked' | 'degraded' | 'review' | 'live' | 'premium' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const STATUS_LABELS: Record<StatusType, string> = {
  healthy: 'Active',
  caution: 'Caution',
  blocked: 'Blocked',
  degraded: 'Degraded',
  review: 'In Review',
  live: 'Live',
  premium: 'Premium',
  pending: 'Pending',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors duration-150',
    `bg-state-${status} state-${status}`,
    className,
  )}>
    <span className={cn('h-1.5 w-1.5 rounded-full', `bg-current`)} />
    {label || STATUS_LABELS[status]}
  </span>
);

/* ── Section Card ── */
export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  /** Alias for `subtitle` — accepted for ergonomic call sites. */
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, description, icon, action, children, className }) => (
  <div className={cn('rounded-2xl border bg-card shadow-card transition-shadow duration-200', className)}>
    {title && (
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="text-xs font-semibold">{title}</h3>
            {(subtitle || description) && <p className="text-[10px] text-muted-foreground">{subtitle || description}</p>}
          </div>
        </div>
        {action}
      </div>
    )}
    <div className="p-3">
      {children}
    </div>
  </div>
);
