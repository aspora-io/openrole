'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  inverse?: boolean; // When true, show content only when NOT authenticated
}

const defaultFallback = (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
      <p className="text-gray-600 mb-6">
        You need to be logged in to access this page.
      </p>
      <button
        onClick={() => window.location.href = '/login'}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Sign In
      </button>
    </div>
  </div>
);

export function AuthGuard({
  children,
  fallback = defaultFallback,
  redirectTo,
  inverse = false
}: AuthGuardProps) {
  const { state } = useAuth();
  const router = useRouter();

  // Wait for auth initialization
  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAuthenticated = !!(state.user && state.token);
  const shouldShowContent = inverse ? !isAuthenticated : isAuthenticated;

  if (!shouldShowContent) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Specific guards for common use cases
export function GuestOnlyGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard
      inverse
      redirectTo="/dashboard"
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Signed In</h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      }
    >
      {children}
    </AuthGuard>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

export function RequireRole({
  children,
  role,
  fallback
}: {
  children: React.ReactNode;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  fallback?: React.ReactNode;
}) {
  const { state } = useAuth();

  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!state.user || state.user.role !== role) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">⛔</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access this page.
                Required role: {role}
              </p>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

export function RequireEmailVerification({ children }: { children: React.ReactNode }) {
  const { state, resendVerification } = useAuth();
  const [resending, setResending] = React.useState(false);

  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!state.user || !state.user.emailVerified) {
    const handleResend = async () => {
      setResending(true);
      try {
        await resendVerification();
        // Show success message
      } catch (error) {
        console.error('Failed to resend verification:', error);
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Please verify your email address to continue. Check your inbox for a verification link.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => window.location.href = '/logout'}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireProfileCompletion({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!state.user || !state.user.profileCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600 mb-6">
            Please complete your profile setup to access this feature.
          </p>
          <button
            onClick={() => window.location.href = '/profile/setup'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}