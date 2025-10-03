import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'candidate' | 'employer';
  companyName?: string;
  profileComplete?: boolean;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'candidate' | 'employer';
  companyName?: string;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const token = api.getToken();
      if (!token) {
        setState(prev => ({ ...prev, loading: false, isAuthenticated: false, user: null }));
        return;
      }

      // Verify token and get user data
      const response = await api.get('/auth/me');
      if (response.success) {
        setState(prev => ({
          ...prev,
          user: response.data,
          isAuthenticated: true,
          loading: false
        }));
      } else {
        // Token is invalid, clear it
        api.clearToken();
        setState(prev => ({ 
          ...prev, 
          user: null, 
          isAuthenticated: false, 
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      api.clearToken();
      setState(prev => ({ 
        ...prev, 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: 'Authentication check failed'
      }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.post('/auth/login', { email, password });
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token
        api.setToken(token);
        
        // Update state
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          loading: false
        }));
        
        return { success: true, user };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.post('/auth/register', userData);
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token
        api.setToken(token);
        
        // Update state
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          loading: false
        }));
        
        return { success: true, user };
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Call logout endpoint (optional)
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Ignore logout endpoint errors
        console.warn('Logout endpoint failed:', error);
      }
      
      // Clear token and state
      api.clearToken();
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
      
      // Redirect to home
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      api.clearToken();
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.put('/auth/profile', profileData);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...response.data } : null,
          loading: false
        }));
        
        return response.data;
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.success) {
        setState(prev => ({ ...prev, loading: false }));
        return response.data;
      } else {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.success) {
        setState(prev => ({ ...prev, loading: false }));
        return response.data;
      } else {
        throw new Error(response.error || 'Password reset request failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      
      if (response.success) {
        setState(prev => ({ ...prev, loading: false }));
        return response.data;
      } else {
        throw new Error(response.error || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Helper functions
  const isCandidate = state.user?.userType === 'candidate';
  const isEmployer = state.user?.userType === 'employer';
  const userFullName = state.user ? `${state.user.firstName} ${state.user.lastName}` : '';

  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    checkAuthStatus,
    clearError,

    // Helpers
    isCandidate,
    isEmployer,
    userFullName
  };
};

// Context for auth state (optional, for sharing across components)
export const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};