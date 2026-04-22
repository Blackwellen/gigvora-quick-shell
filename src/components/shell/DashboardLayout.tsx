import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  /** Top strip: filters, context selectors, freshness indicators, primary actions */
  topStrip?: React.ReactNode;
  /** Main canvas area */
  children: React.ReactNode;
  /** Optional right rail: detail inspector, notes, compare, quick actions */
  rightRail?: React.ReactNode;
  /** Bottom section: history, timeline, audit, diagnostics */
  bottomSection?: React.ReactNode;
  /** Width of right rail */
  rightRailWidth?: string;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  topStrip,
  children,
  rightRail,
  bottomSection,
  rightRailWidth = 'w-[var(--right-rail-width)]',
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-4 md:gap-6 overflow-hidden', className)}>
      {/* Top strip */}
      {topStrip && (
        <div className="flex items-center gap-2 md:gap-3 flex-wrap rounded-[var(--card-radius-lg)] border bg-card px-3 md:px-6 py-2.5 md:py-3.5 shadow-card overflow-x-auto">
          {topStrip}
        </div>
      )}

      {/* Main content + right rail */}
      <div className="flex gap-[var(--right-rail-gap)] flex-1 min-h-0 overflow-hidden">
        {/* Main canvas */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {children}
        </div>

        {/* Right rail — hidden below lg */}
        {rightRail && (
          <aside className={cn('hidden lg:block shrink-0', rightRailWidth)}>
            <div className="sticky top-28 space-y-5">
              {rightRail}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom section */}
      {bottomSection && (
        <div className="rounded-[var(--card-radius-lg)] border bg-card shadow-card overflow-hidden">
          {bottomSection}
        </div>
      )}
    </div>
  );
};
