'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';
import { ProfileProvider } from './ProfileContext';

interface ProvidersProps {
  children: ReactNode;
}

// Combined providers component for easy app setup
export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider>
      <AuthProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </AuthProvider>
    </AppProvider>
  );
}

// Re-export contexts and hooks
export { useAuth } from './AuthContext';
export { useApp } from './AppContext';
export { useProfileContext } from './ProfileContext';

// Re-export context types
export type { User } from './AuthContext';