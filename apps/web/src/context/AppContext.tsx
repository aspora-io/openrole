'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AppState {
  notifications: Notification[];
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  cache: {
    [key: string]: {
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
  preferences: {
    profileCompletionHintDismissed: boolean;
    cvBuilderIntroSeen: boolean;
    searchFiltersCollapsed: boolean;
    portfolioViewMode: 'grid' | 'list';
    experienceTimelineExpanded: boolean;
  };
}

type AppAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: { key: string; loading: boolean } }
  | { type: 'SET_CACHE'; payload: { key: string; data: any; ttl?: number } }
  | { type: 'CLEAR_CACHE'; payload?: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AppState['preferences']> }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  notifications: [],
  sidebarOpen: false,
  theme: 'system',
  language: 'en',
  loading: {
    global: false,
  },
  cache: {},
  preferences: {
    profileCompletionHintDismissed: false,
    cvBuilderIntroSeen: false,
    searchFiltersCollapsed: false,
    portfolioViewMode: 'grid',
    experienceTimelineExpanded: true,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        loading: { ...state.loading, global: action.payload },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };
    
    case 'SET_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            ttl: action.payload.ttl || 5 * 60 * 1000, // 5 minutes default
          },
        },
      };
    
    case 'CLEAR_CACHE':
      if (action.payload) {
        const { [action.payload]: removed, ...rest } = state.cache;
        return { ...state, cache: rest };
      }
      return { ...state, cache: {} };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  getLoading: (key: string) => boolean;
  setCache: (key: string, data: any, ttl?: number) => void;
  getCache: (key: string) => any | null;
  clearCache: (key?: string) => void;
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem('app_preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }

    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
    }

    const savedLanguage = localStorage.getItem('app_language');
    if (savedLanguage) {
      dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage });
    }
  }, []);

  // Save preferences to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem('app_preferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  React.useEffect(() => {
    localStorage.setItem('app_theme', state.theme);
  }, [state.theme]);

  React.useEffect(() => {
    localStorage.setItem('app_language', state.language);
  }, [state.language]);

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const fullNotification = { ...notification, id };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
    
    // Auto-remove notification after duration
    const duration = notification.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const setSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setLanguage = (language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const setGlobalLoading = (loading: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  };

  const setLoading = (key: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading } });
  };

  const getLoading = (key: string): boolean => {
    return state.loading[key] || false;
  };

  const setCache = (key: string, data: any, ttl?: number) => {
    dispatch({ type: 'SET_CACHE', payload: { key, data, ttl } });
  };

  const getCache = (key: string): any | null => {
    const cached = state.cache[key];
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      dispatch({ type: 'CLEAR_CACHE', payload: key });
      return null;
    }
    
    return cached.data;
  };

  const clearCache = (key?: string) => {
    dispatch({ type: 'CLEAR_CACHE', payload: key });
  };

  const updatePreferences = (preferences: Partial<AppState['preferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: AppContextType = {
    state,
    addNotification,
    removeNotification,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    setLanguage,
    setGlobalLoading,
    setLoading,
    getLoading,
    setCache,
    getCache,
    clearCache,
    updatePreferences,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}