// Cache utility for managing client-side data caching

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of items to store
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

class CacheManager {
  private cache = new Map<string, CacheItem>();
  private defaultTTL: number;
  private maxSize: number;
  private storageType: 'memory' | 'localStorage' | 'sessionStorage';

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
    this.storageType = options.storage || 'memory';

    // Load from persistent storage if available
    if (this.storageType !== 'memory') {
      this.loadFromStorage();
    }
  }

  private getStorageKey(key: string): string {
    return `cache_${key}`;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
    
    try {
      const keys = Object.keys(storage).filter(key => key.startsWith('cache_'));
      
      for (const storageKey of keys) {
        const item = storage.getItem(storageKey);
        if (item) {
          const parsed: CacheItem = JSON.parse(item);
          const key = storageKey.replace('cache_', '');
          
          // Check if item has expired
          if (this.isExpired(parsed)) {
            storage.removeItem(storageKey);
          } else {
            this.cache.set(key, parsed);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(key: string, item: CacheItem): void {
    if (typeof window === 'undefined' || this.storageType === 'memory') return;

    const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
    
    try {
      storage.setItem(this.getStorageKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save cache item to storage:', error);
      // If storage is full, try to clear expired items
      this.clearExpired();
    }
  }

  private removeFromStorage(key: string): void {
    if (typeof window === 'undefined' || this.storageType === 'memory') return;

    const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
    storage.removeItem(this.getStorageKey(key));
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find the oldest item
    let oldestKey = '';
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove expired items before adding new ones
    this.clearExpired();

    // If cache is at max size, evict LRU item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key,
    };

    this.cache.set(key, item);
    this.saveToStorage(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    // Update timestamp for LRU
    item.timestamp = Date.now();
    this.cache.set(key, item);
    
    if (this.storageType !== 'memory') {
      this.saveToStorage(key, item);
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.removeFromStorage(key);
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    
    if (typeof window !== 'undefined' && this.storageType !== 'memory') {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      const keys = Object.keys(storage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => storage.removeItem(key));
    }
  }

  clearExpired(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  size(): number {
    this.clearExpired();
    return this.cache.size;
  }

  keys(): string[] {
    this.clearExpired();
    return Array.from(this.cache.keys());
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
    storage: string;
  } {
    return {
      size: this.size(),
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implement hit/miss tracking
      missRate: 0,
      storage: this.storageType,
    };
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  // Preload data into cache
  preload<T>(key: string, dataLoader: () => Promise<T>, ttl?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if data is already cached
      const cached = this.get<T>(key);
      if (cached !== null) {
        resolve(cached);
        return;
      }

      // Load data and cache it
      dataLoader()
        .then(data => {
          this.set(key, data, ttl);
          resolve(data);
        })
        .catch(reject);
    });
  }
}

// Default cache instances
export const memoryCache = new CacheManager({
  storage: 'memory',
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
});

export const persistentCache = new CacheManager({
  storage: 'localStorage',
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 50,
});

export const sessionCache = new CacheManager({
  storage: 'sessionStorage',
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 25,
});

// Cache keys constants
export const CACHE_KEYS = {
  PROFILE: (userId: string) => `profile_${userId}`,
  EXPERIENCES: (userId: string) => `experiences_${userId}`,
  EDUCATION: (userId: string) => `education_${userId}`,
  PORTFOLIO: (userId: string) => `portfolio_${userId}`,
  SEARCH_RESULTS: (query: string) => `search_${btoa(query)}`,
  CV_TEMPLATES: 'cv_templates',
  PRIVACY_SETTINGS: (userId: string) => `privacy_${userId}`,
  USER_FILES: (userId: string) => `files_${userId}`,
  GENERATED_CVS: (userId: string) => `generated_cvs_${userId}`,
} as const;

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 15 * 60 * 1000,    // 15 minutes
  LONG: 60 * 60 * 1000,      // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Helper functions for common cache operations
export function cacheProfile(userId: string, profileData: any): void {
  persistentCache.set(CACHE_KEYS.PROFILE(userId), profileData, CACHE_TTL.MEDIUM);
}

export function getCachedProfile(userId: string): any | null {
  return persistentCache.get(CACHE_KEYS.PROFILE(userId));
}

export function invalidateUserCache(userId: string): void {
  const patterns = [
    CACHE_KEYS.PROFILE(userId),
    CACHE_KEYS.EXPERIENCES(userId),
    CACHE_KEYS.EDUCATION(userId),
    CACHE_KEYS.PORTFOLIO(userId),
    CACHE_KEYS.PRIVACY_SETTINGS(userId),
    CACHE_KEYS.USER_FILES(userId),
    CACHE_KEYS.GENERATED_CVS(userId),
  ];

  patterns.forEach(pattern => {
    memoryCache.delete(pattern);
    persistentCache.delete(pattern);
    sessionCache.delete(pattern);
  });
}

export function cacheSearchResults(query: string, results: any): void {
  sessionCache.set(CACHE_KEYS.SEARCH_RESULTS(query), results, CACHE_TTL.SHORT);
}

export function getCachedSearchResults(query: string): any | null {
  return sessionCache.get(CACHE_KEYS.SEARCH_RESULTS(query));
}

export function clearSearchCache(): void {
  sessionCache.invalidatePattern(/^search_/);
}

// Cache warming strategies
export async function warmUserCache(userId: string, apiClient: any): Promise<void> {
  const promises = [
    apiClient.get(`/api/profile/${userId}`).then((data: any) => 
      cacheProfile(userId, data)
    ),
    apiClient.get(`/api/experience?userId=${userId}`).then((data: any) => 
      persistentCache.set(CACHE_KEYS.EXPERIENCES(userId), data, CACHE_TTL.MEDIUM)
    ),
    apiClient.get(`/api/education?userId=${userId}`).then((data: any) => 
      persistentCache.set(CACHE_KEYS.EDUCATION(userId), data, CACHE_TTL.MEDIUM)
    ),
    apiClient.get(`/api/portfolio?userId=${userId}`).then((data: any) => 
      persistentCache.set(CACHE_KEYS.PORTFOLIO(userId), data, CACHE_TTL.MEDIUM)
    ),
  ];

  try {
    await Promise.allSettled(promises);
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

// Cache invalidation strategies
export function onProfileUpdate(userId: string): void {
  persistentCache.delete(CACHE_KEYS.PROFILE(userId));
  // Also clear related search results that might be stale
  clearSearchCache();
}

export function onExperienceUpdate(userId: string): void {
  persistentCache.delete(CACHE_KEYS.EXPERIENCES(userId));
  persistentCache.delete(CACHE_KEYS.PROFILE(userId)); // Profile completeness might change
}

export function onEducationUpdate(userId: string): void {
  persistentCache.delete(CACHE_KEYS.EDUCATION(userId));
  persistentCache.delete(CACHE_KEYS.PROFILE(userId)); // Profile completeness might change
}

export function onPortfolioUpdate(userId: string): void {
  persistentCache.delete(CACHE_KEYS.PORTFOLIO(userId));
  persistentCache.delete(CACHE_KEYS.PROFILE(userId)); // Profile completeness might change
}

// Export the CacheManager class for custom instances
export { CacheManager };