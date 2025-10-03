import { useState, useEffect, useCallback } from 'react';
import { memoryCache, persistentCache, sessionCache, CacheManager, CACHE_TTL } from '../utils/cache';

// Hook for using cache with React state
export function useCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: {
    cache?: CacheManager;
    ttl?: number;
    enabled?: boolean;
    refreshOnMount?: boolean;
  } = {}
) {
  const {
    cache = persistentCache,
    ttl = CACHE_TTL.MEDIUM,
    enabled = true,
    refreshOnMount = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = cache.get<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Load fresh data
      const freshData = await loader();
      
      // Cache the result
      cache.set(key, freshData, ttl);
      setData(freshData);
      
      return freshData;
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      // If we have cached data and fresh load failed, use cached data
      const cached = cache.get<T>(key);
      if (cached !== null) {
        setData(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [key, loader, cache, ttl, enabled]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
    setError(null);
  }, [cache, key]);

  // Load data on mount or when dependencies change
  useEffect(() => {
    if (enabled) {
      loadData(refreshOnMount);
    }
  }, [loadData, refreshOnMount, enabled]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    hasData: data !== null,
    hasError: error !== null,
  };
}

// Hook for managing cached API requests
export function useCachedApi<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  options: {
    ttl?: number;
    cache?: CacheManager;
    dependencies?: any[];
    enabled?: boolean;
  } = {}
) {
  const {
    ttl = CACHE_TTL.MEDIUM,
    cache = persistentCache,
    dependencies = [],
    enabled = true,
  } = options;

  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
  }>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchData = useCallback(async (skipCache = false) => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check cache first
      if (!skipCache) {
        const cached = cache.get<T>(cacheKey);
        if (cached !== null) {
          setState({
            data: cached,
            loading: false,
            error: null,
            lastFetched: Date.now(),
          });
          return cached;
        }
      }

      // Fetch fresh data
      const result = await apiCall();
      
      // Cache the result
      cache.set(cacheKey, result, ttl);
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Request failed',
      }));
      throw error;
    }
  }, [apiCall, cacheKey, cache, ttl, enabled]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(cacheKey);
    setState(prev => ({ ...prev, data: null, error: null }));
  }, [cache, cacheKey]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled, ...dependencies]);

  return {
    ...state,
    refetch,
    invalidate,
    isStale: state.lastFetched ? Date.now() - state.lastFetched > ttl : true,
    hasData: state.data !== null,
    hasError: state.error !== null,
  };
}

// Hook for optimistic updates with cache
export function useOptimisticCache<T>(
  cacheKey: string,
  apiCall: (data: T) => Promise<T>,
  options: {
    cache?: CacheManager;
    onSuccess?: (data: T) => void;
    onError?: (error: Error, rollbackData: T | null) => void;
  } = {}
) {
  const { cache = persistentCache, onSuccess, onError } = options;

  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const update = useCallback(async (newData: T) => {
    setLoading(true);
    
    // Store current data for rollback
    const currentData = cache.get<T>(cacheKey);
    
    // Optimistically update cache and state
    cache.set(cacheKey, newData);
    setOptimisticData(newData);

    try {
      // Make API call
      const result = await apiCall(newData);
      
      // Update cache with server response
      cache.set(cacheKey, result);
      setOptimisticData(null); // Clear optimistic state
      
      onSuccess?.(result);
      return result;
    } catch (error: any) {
      // Rollback on error
      if (currentData !== null) {
        cache.set(cacheKey, currentData);
      } else {
        cache.delete(cacheKey);
      }
      setOptimisticData(null);
      
      onError?.(error, currentData);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, apiCall, cache, onSuccess, onError]);

  const getCurrentData = useCallback(() => {
    return optimisticData || cache.get<T>(cacheKey);
  }, [cacheKey, cache, optimisticData]);

  return {
    update,
    loading,
    getCurrentData,
    hasOptimisticUpdate: optimisticData !== null,
  };
}

// Hook for cache invalidation patterns
export function useCacheInvalidation() {
  const invalidatePattern = useCallback((
    pattern: string | RegExp,
    caches: CacheManager[] = [memoryCache, persistentCache, sessionCache]
  ) => {
    caches.forEach(cache => cache.invalidatePattern(pattern));
  }, []);

  const invalidateKey = useCallback((
    key: string,
    caches: CacheManager[] = [memoryCache, persistentCache, sessionCache]
  ) => {
    caches.forEach(cache => cache.delete(key));
  }, []);

  const clearAll = useCallback((
    caches: CacheManager[] = [memoryCache, persistentCache, sessionCache]
  ) => {
    caches.forEach(cache => cache.clear());
  }, []);

  return {
    invalidatePattern,
    invalidateKey,
    clearAll,
  };
}

// Hook for cache statistics and monitoring
export function useCacheStats() {
  const [stats, setStats] = useState({
    memory: memoryCache.getStats(),
    persistent: persistentCache.getStats(),
    session: sessionCache.getStats(),
  });

  const refreshStats = useCallback(() => {
    setStats({
      memory: memoryCache.getStats(),
      persistent: persistentCache.getStats(),
      session: sessionCache.getStats(),
    });
  }, []);

  useEffect(() => {
    // Refresh stats periodically
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    totalCachedItems: stats.memory.size + stats.persistent.size + stats.session.size,
  };
}

// Hook for preloading cache data
export function useCachePreloader() {
  const preload = useCallback(async <T>(
    key: string,
    loader: () => Promise<T>,
    options: {
      cache?: CacheManager;
      ttl?: number;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ) => {
    const { cache = persistentCache, ttl = CACHE_TTL.MEDIUM, priority = 'normal' } = options;

    // Check if already cached
    if (cache.has(key)) {
      return cache.get<T>(key);
    }

    const executePreload = async () => {
      try {
        const data = await loader();
        cache.set(key, data, ttl);
        return data;
      } catch (error) {
        console.warn(`Failed to preload cache key: ${key}`, error);
        return null;
      }
    };

    // Execute based on priority
    if (priority === 'high') {
      return executePreload();
    } else if (priority === 'normal') {
      return Promise.resolve().then(executePreload);
    } else {
      // Low priority - use requestIdleCallback if available
      if (typeof requestIdleCallback !== 'undefined') {
        return new Promise(resolve => {
          requestIdleCallback(async () => {
            const result = await executePreload();
            resolve(result);
          });
        });
      } else {
        setTimeout(executePreload, 100);
        return Promise.resolve(null);
      }
    }
  }, []);

  const preloadBatch = useCallback(async (
    items: Array<{
      key: string;
      loader: () => Promise<any>;
      options?: { cache?: CacheManager; ttl?: number; priority?: 'high' | 'normal' | 'low' };
    }>
  ) => {
    const promises = items.map(item => preload(item.key, item.loader, item.options));
    return Promise.allSettled(promises);
  }, [preload]);

  return {
    preload,
    preloadBatch,
  };
}