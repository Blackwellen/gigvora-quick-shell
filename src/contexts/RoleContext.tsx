import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  UserRole, ROLE_CONFIGS, DashboardTab,
  PlanTier, FeatureEntitlement, PLAN_CONFIGS, ENTITLEMENT_LABELS,
} from '@/types/role';

interface RoleContextValue {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  dashboardTabs: DashboardTab[];
  // Plan & entitlements
  currentPlan: PlanTier;
  setPlan: (plan: PlanTier) => void;
  entitlements: Set<FeatureEntitlement>;
  hasEntitlement: (feature: FeatureEntitlement) => boolean;
  isSubscribed: (feature: 'recruiter-pro' | 'sales-navigator') => boolean;
  /** Returns the minimum plan needed for a feature, or null if already entitled */
  upgradeNeeded: (feature: FeatureEntitlement) => PlanTier | null;
  /** Role switch history for audit */
  roleSwitchHistory: Array<{ from: UserRole; to: UserRole; at: Date }>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleRaw] = useState<UserRole>('user');
  const [currentPlan, setPlan] = useState<PlanTier>('free');
  const [roleSwitchHistory, setHistory] = useState<Array<{ from: UserRole; to: UserRole; at: Date }>>([]);

  const entitlements = useMemo(
    () => new Set(PLAN_CONFIGS[currentPlan].entitlements),
    [currentPlan],
  );

  const setActiveRole = useCallback((role: UserRole) => {
    setActiveRoleRaw((prev) => {
      if (prev !== role) {
        setHistory((h) => [...h.slice(-19), { from: prev, to: role, at: new Date() }]);
      }
      return role;
    });
  }, []);

  const dashboardTabs = ROLE_CONFIGS[activeRole].dashboardTabs;

  const hasEntitlement = useCallback(
    (feature: FeatureEntitlement) => entitlements.has(feature),
    [entitlements],
  );

  const isSubscribed = useCallback(
    (feature: 'recruiter-pro' | 'sales-navigator') => entitlements.has(feature),
    [entitlements],
  );

  const upgradeNeeded = useCallback(
    (feature: FeatureEntitlement): PlanTier | null => {
      if (entitlements.has(feature)) return null;
      return ENTITLEMENT_LABELS[feature]?.minPlan ?? 'pro';
    },
    [entitlements],
  );

  return (
    <RoleContext.Provider
      value={{
        activeRole, setActiveRole, dashboardTabs,
        currentPlan, setPlan, entitlements,
        hasEntitlement, isSubscribed, upgradeNeeded,
        roleSwitchHistory,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};
