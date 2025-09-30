'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  requireEmailVerification?: boolean;
  requireProfileComplete?: boolean;
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

const defaultLoadingComponent = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

export function ProtectedRoute({
  children,
  requiredRole,
  requireEmailVerification = false,
  requireProfileComplete = false,
  fallbackPath = '/login',
  loadingComponent = defaultLoadingComponent
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth initialization
    if (!state.initialized) {
      return;
    }

    // Not authenticated
    if (!state.user || !state.token) {
      // Store the intended destination
      sessionStorage.setItem('auth_redirect', pathname);
      router.push(fallbackPath);
      return;
    }

    // Check role requirement
    if (requiredRole && state.user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }

    // Check email verification requirement
    if (requireEmailVerification && !state.user.emailVerified) {
      router.push('/verify-email');
      return;
    }

    // Check profile completion requirement
    if (requireProfileComplete && !state.user.profileCompleted) {
      router.push('/complete-profile');
      return;
    }

    setIsChecking(false);
  }, [
    state.initialized,
    state.user,
    state.token,
    requiredRole,
    requireEmailVerification,
    requireProfileComplete,
    router,
    pathname,
    fallbackPath
  ]);

  // Show loading while checking
  if (!state.initialized || isChecking) {
    return <>{loadingComponent}</>;
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}