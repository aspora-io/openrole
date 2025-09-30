import { useState, useCallback } from 'react';

export interface LoadingState {
  loading: boolean;
  error: string | null;
  data: any;
}

export function useLoadingState<T = any>(initialData?: T) {
  const [state, setState] = useState<LoadingState>({
    loading: false,
    error: null,
    data: initialData || null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState({ loading: false, error: null, data });
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: initialData || null });
  }, [initialData]);

  const execute = useCallback(async <R = T>(
    asyncFunction: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      resetOnStart?: boolean;
    }
  ): Promise<R | null> => {
    const { onSuccess, onError, resetOnStart = false } = options || {};

    if (resetOnStart) {
      setState({ loading: true, error: null, data: null });
    } else {
      setLoading(true);
    }

    try {
      const result = await asyncFunction();
      setData(result as any);
      onSuccess?.(result);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      setError(errorMessage);
      onError?.(error);
      return null;
    }
  }, [setLoading, setError, setData]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
    execute,
    isLoading: state.loading,
    hasError: !!state.error,
    hasData: !!state.data,
    isEmpty: !state.loading && !state.error && !state.data,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearAll,
    loadingStates,
  };
}

// Hook for managing async operations with loading states
export function useAsyncOperation() {
  const [operations, setOperations] = useState<Record<string, LoadingState>>({});

  const execute = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    const { onSuccess, onError } = options || {};

    setOperations(prev => ({
      ...prev,
      [key]: { loading: true, error: null, data: null }
    }));

    try {
      const result = await asyncFunction();
      setOperations(prev => ({
        ...prev,
        [key]: { loading: false, error: null, data: result }
      }));
      onSuccess?.(result);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      setOperations(prev => ({
        ...prev,
        [key]: { loading: false, error: errorMessage, data: null }
      }));
      onError?.(error);
      return null;
    }
  }, []);

  const getOperationState = useCallback((key: string): LoadingState => {
    return operations[key] || { loading: false, error: null, data: null };
  }, [operations]);

  const clearOperation = useCallback((key: string) => {
    setOperations(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAll = useCallback(() => {
    setOperations({});
  }, []);

  return {
    execute,
    getOperationState,
    clearOperation,
    clearAll,
    operations,
  };
}

// Hook for debounced loading states (useful for search, etc.)
export function useDebouncedLoadingState<T = any>(delay: number = 300) {
  const [state, setState] = useState<LoadingState>({
    loading: false,
    error: null,
    data: null,
  });
  
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      immediate?: boolean;
    }
  ): Promise<T | null> => {
    const { onSuccess, onError, immediate = false } = options || {};

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (immediate) {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const result = await asyncFunction();
        setState({ loading: false, error: null, data: result });
        onSuccess?.(result);
        return result;
      } catch (error: any) {
        const errorMessage = error.message || 'An error occurred';
        setState({ loading: false, error: errorMessage, data: null });
        onError?.(error);
        return null;
      }
    } else {
      // Set loading state immediately for UX
      setState(prev => ({ ...prev, loading: true, error: null }));

      const newTimeoutId = setTimeout(async () => {
        try {
          const result = await asyncFunction();
          setState({ loading: false, error: null, data: result });
          onSuccess?.(result);
        } catch (error: any) {
          const errorMessage = error.message || 'An error occurred';
          setState({ loading: false, error: errorMessage, data: null });
          onError?.(error);
        }
      }, delay);

      setTimeoutId(newTimeoutId);
      return null;
    }
  }, [delay, timeoutId]);

  const cancel = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [timeoutId]);

  return {
    ...state,
    execute,
    cancel,
    isLoading: state.loading,
    hasError: !!state.error,
    hasData: !!state.data,
  };
}

// Hook for managing pagination with loading states
export function usePaginatedLoadingState<T = any>() {
  const [state, setState] = useState<{
    items: T[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
    total: number;
  }>({
    items: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: true,
    page: 0,
    total: 0,
  });

  const loadPage = useCallback(async (
    asyncFunction: (page: number) => Promise<{
      items: T[];
      hasMore: boolean;
      total: number;
    }>,
    page: number = 0,
    append: boolean = false
  ) => {
    setState(prev => ({
      ...prev,
      loading: !append,
      loadingMore: append,
      error: null,
    }));

    try {
      const result = await asyncFunction(page);
      setState(prev => ({
        ...prev,
        items: append ? [...prev.items, ...result.items] : result.items,
        loading: false,
        loadingMore: false,
        hasMore: result.hasMore,
        page,
        total: result.total,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: error.message || 'An error occurred',
      }));
    }
  }, []);

  const loadMore = useCallback((
    asyncFunction: (page: number) => Promise<{
      items: T[];
      hasMore: boolean;
      total: number;
    }>
  ) => {
    if (state.hasMore && !state.loadingMore) {
      loadPage(asyncFunction, state.page + 1, true);
    }
  }, [state.hasMore, state.loadingMore, state.page, loadPage]);

  const reset = useCallback(() => {
    setState({
      items: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      page: 0,
      total: 0,
    });
  }, []);

  return {
    ...state,
    loadPage,
    loadMore,
    reset,
    isEmpty: state.items.length === 0,
    canLoadMore: state.hasMore && !state.loadingMore && !state.loading,
  };
}