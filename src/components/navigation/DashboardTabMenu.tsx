import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { PlanUpgradeDrawer } from '@/components/shell/PlanUpgradeDrawer';
import type { DashboardTab, FeatureEntitlement } from '@/types/role';

interface DashboardTabMenuProps {
  tabs: DashboardTab[];
}

export const DashboardTabMenu: React.FC<DashboardTabMenuProps> = ({ tabs }) => {
  const { pathname } = useLocation();
  const { hasEntitlement } = useRole();
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureEntitlement | null>(null);

  return (
    <>
      <div className="border-b bg-background">
        <div className="max-w-[1600px] mx-auto px-3 lg:px-6">
          <ScrollArea className="w-full">
            <nav className="flex items-center gap-0.5 h-10">
              {tabs.map((tab) => {
                const active = pathname === tab.path || pathname.startsWith(tab.path + '/');
                const locked = tab.entitlement && !hasEntitlement(tab.entitlement);

                if (locked) {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setUpgradeFeature(tab.entitlement!)}
                      className="px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap rounded-md transition-colors text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1"
                    >
                      {tab.label}
                      <Lock className="h-2.5 w-2.5" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={cn(
                      'px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap rounded-md transition-colors',
                      active
                        ? 'text-accent bg-accent/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <PlanUpgradeDrawer
        open={upgradeFeature !== null}
        onOpenChange={(open) => !open && setUpgradeFeature(null)}
        highlightFeature={upgradeFeature ?? undefined}
      />
    </>
  );
};
