/**
 * AdminAuth — session-scoped admin identity for the /admin terminal.
 *
 * NOT real auth (no backend in this project context). It's a typed in-memory
 * provider backed by sessionStorage so:
 *   - tabs auto-expire on close (vs localStorage which leaks across sessions)
 *   - the role can only be switched by a Super Admin
 *   - AdminGuard can synchronously check `isAuthenticated` before render
 *     (no flash of protected content)
 *
 * Swap `login()` to call your real /me endpoint when the platform backend lands.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AdminRole =
  | 'super-admin'
  | 'cs-admin'
  | 'finance-admin'
  | 'moderator'
  | 'trust-safety'
  | 'dispute-mgr'
  | 'ads-ops'
  | 'compliance'
  | 'marketing-admin';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  /** True only for super-admin — gates role switching, kill-switches, role assignment. */
  isSuperAdmin: boolean;
  env: 'production' | 'staging' | 'sandbox';
  loggedInAt: string;
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  /** Role being viewed. Equals user.role unless super-admin has impersonated another role. */
  activeRole: AdminRole;
  login: (input: { email: string; password: string; role: AdminRole; env: AdminUser['env'] }) => Promise<AdminUser>;
  logout: () => void;
  /** Throws if not super-admin. Used by the role switcher. */
  switchRole: (role: AdminRole) => void;
}

const STORAGE_KEY = 'gigvora.admin.session.v1';

const AdminAuthContext = createContext<AdminAuthState | null>(null);

function readSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    if (!parsed?.id || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(user: AdminUser | null) {
  if (typeof window === 'undefined') return;
  if (user) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.sessionStorage.removeItem(STORAGE_KEY);
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => readSession());
  const [activeRole, setActiveRoleState] = useState<AdminRole>(() => readSession()?.role ?? 'super-admin');

  // Re-sync if another tab logs out.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = readSession();
        setUser(next);
        if (next) setActiveRoleState(next.role);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback<AdminAuthState['login']>(async ({ email, password, role, env }) => {
    if (!email || !password) throw new Error('Email and password required.');
    // Mock auth — would call backend in production.
    const next: AdminUser = {
      id: `op_${Math.random().toString(36).slice(2, 10)}`,
      email,
      displayName: email.split('@')[0],
      role,
      isSuperAdmin: role === 'super-admin',
      env,
      loggedInAt: new Date().toISOString(),
    };
    writeSession(next);
    setUser(next);
    setActiveRoleState(role);
    return next;
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setUser(null);
  }, []);

  const switchRole = useCallback<AdminAuthState['switchRole']>(
    (role) => {
      if (!user) throw new Error('Not authenticated.');
      if (!user.isSuperAdmin) {
        throw new Error('Only Super Admins can switch role context.');
      }
      setActiveRoleState(role);
    },
    [user],
  );

  const value = useMemo<AdminAuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      activeRole,
      login,
      logout,
      switchRole,
    }),
    [user, activeRole, login, logout, switchRole],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within <AdminAuthProvider>.');
  return ctx;
}
