/**
 * AdminGuard — gates every /admin/* route.
 * Redirects unauthenticated visitors to /admin/login with the original path
 * preserved as ?redirect=, so post-login navigation lands back where they tried.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/lib/adminAuth';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};
