import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Breadcrumb {
  label: string;
  to?: string;
}

interface SectionBackNavProps {
  /** Route for the module home (e.g. /navigator, /recruiter-pro) */
  homeRoute: string;
  /** Module name shown in breadcrumb */
  homeLabel: string;
  /** Current page name */
  currentLabel: string;
  /** Optional icon next to home label */
  icon?: React.ReactNode;
  /** Extra breadcrumbs between home and current */
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

export const SectionBackNav: React.FC<SectionBackNavProps> = ({
  homeRoute, homeLabel, currentLabel, icon, breadcrumbs = [], className,
}) => {
  return (
    <div className={cn('flex items-center gap-1.5 mb-4', className)}>
      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-xl px-2 text-muted-foreground hover:text-foreground" asChild>
        <Link to={homeRoute}>
          <ChevronLeft className="h-3 w-3" />
          Back
        </Link>
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Link to={homeRoute} className="flex items-center gap-1 hover:text-foreground transition-colors">
          {icon || <Home className="h-3 w-3" />}
          <span>{homeLabel}</span>
        </Link>
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            <span className="text-[8px]">/</span>
            {b.to ? (
              <Link to={b.to} className="hover:text-foreground transition-colors">{b.label}</Link>
            ) : (
              <span>{b.label}</span>
            )}
          </React.Fragment>
        ))}
        <span className="text-[8px]">/</span>
        <span className="text-foreground font-medium">{currentLabel}</span>
      </div>
    </div>
  );
};
