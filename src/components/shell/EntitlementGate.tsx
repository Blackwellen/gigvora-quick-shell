import React, { useState } from 'react';
import { Lock, Zap, ArrowRight, Shield, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { ENTITLEMENT_LABELS, PLAN_CONFIGS, type FeatureEntitlement, type PlanTier } from '@/types/role';
import { cn } from '@/lib/utils';
import { PlanUpgradeDrawer } from './PlanUpgradeDrawer';

interface EntitlementGateProps {
  feature: FeatureEntitlement;
  children: React.ReactNode;
  inline?: boolean;
  compact?: boolean;
}

export const EntitlementGate: React.FC<EntitlementGateProps> = ({
  feature, children, inline = false, compact = false,
}) => {
  const { hasEntitlement, upgradeNeeded } = useRole();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (hasEntitlement(feature)) {
    return <>{children}</>;
  }

  const minPlan = upgradeNeeded(feature);
  const meta = ENTITLEMENT_LABELS[feature];

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        {children}
        <Badge
          className="text-[8px] h-3.5 bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-0 cursor-pointer hover:bg-[hsl(var(--state-premium)/0.2)] transition-colors rounded-lg"
          onClick={() => setShowUpgrade(true)}
        >
          <Lock className="h-2 w-2 mr-0.5" />
          {minPlan ? PLAN_CONFIGS[minPlan].label : 'Upgrade'}
        </Badge>
        <PlanUpgradeDrawer open={showUpgrade} onOpenChange={setShowUpgrade} highlightFeature={feature} />
      </span>
    );
  }

  if (inline) {
    return (
      <>
        <div className="relative rounded-2xl overflow-hidden">
          <div className="opacity-30 pointer-events-none select-none blur-[2px]">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-card/30 to-card/60">
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] h-8 gap-2 bg-card/95 backdrop-blur-sm shadow-md rounded-xl hover:-translate-y-px transition-all duration-200"
              onClick={() => setShowUpgrade(true)}
            >
              <Lock className="h-3 w-3" /> Unlock {meta.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <PlanUpgradeDrawer open={showUpgrade} onOpenChange={setShowUpgrade} highlightFeature={feature} />
      </>
    );
  }

  // Full blocked card
  return (
    <>
      <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--state-premium)/0.3)] bg-[hsl(var(--state-premium)/0.02)] p-7 text-center transition-all hover:border-[hsl(var(--state-premium)/0.5)]">
        <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-premium)/0.1)] flex items-center justify-center mx-auto mb-4">
          <Crown className="h-6 w-6 text-[hsl(var(--state-premium))]" />
        </div>
        <h3 className="text-sm font-bold mb-1">{meta.label}</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">{meta.description}</p>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mb-4">
          <Shield className="h-3 w-3" />
          Available on <span className="font-semibold text-foreground">{minPlan ? PLAN_CONFIGS[minPlan].label : 'Pro'}</span> plan and above
        </div>
        <Button size="sm" className="text-xs h-9 gap-2 font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200" onClick={() => setShowUpgrade(true)}>
          <Zap className="h-3.5 w-3.5" /> Upgrade to Unlock <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <PlanUpgradeDrawer open={showUpgrade} onOpenChange={setShowUpgrade} highlightFeature={feature} />
    </>
  );
};
