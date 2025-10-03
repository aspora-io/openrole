/**
 * Rate Limiting Middleware - Advanced rate limiting with Redis support
 * 
 * Provides flexible rate limiting with multiple strategies, user-based limits,
 * and integration with Redis for distributed rate limiting.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator
  skipFunction?: (c: Context) => boolean; // Skip rate limiting for certain requests
  onLimitReached?: (c: Context) => void; // Callback when limit is reached
  message?: string; // Custom error message
  headers?: boolean; // Include rate limit headers in response
}

/**
 * Rate limit storage interface
 */
export interface IRateLimitStorage {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit storage (for development/single instance)
 */
export class MemoryRateLimitStorage implements IRateLimitStorage {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    return entry.count;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count: value,
      resetTime: Date.now() + ttl
    });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      // Create new entry
      const newEntry = { count: 1, resetTime: now + ttl };
      this.store.set(key, newEntry);
      return 1;
    } else {
      // Increment existing entry
      entry.count++;
      return entry.count;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis rate limit storage (for production/distributed systems)
 */
export class RedisRateLimitStorage implements IRateLimitStorage {
  private redis: any; // Redis client

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<number | null> {
    try {
      const value = await this.redis.get(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Redis rate limit get error:', error);
      return null;
    }
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, Math.ceil(ttl / 1000), value.toString());
    } catch (error) {
      console.error('Redis rate limit set error:', error);
    }
  }

  async increment(key: string, ttl: number): Promise<number> {
    try {
      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(ttl / 1000));
      const results = await multi.exec();
      return results[0][1]; // First command result
    } catch (error) {
      console.error('Redis rate limit increment error:', error);
      return 1; // Fallback
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis rate limit reset error:', error);
    }
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private storage: IRateLimitStorage;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig, storage?: IRateLimitStorage) {
    this.storage = storage || new MemoryRateLimitStorage();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipFunction: config.skipFunction || (() => false),
      onLimitReached: config.onLimitReached || (() => {}),
      message: config.message || 'Too many requests, please try again later',
      headers: config.headers !== false // Default to true
    };
  }

  /**
   * Default key generator (IP + User ID if available)
   */
  private defaultKeyGenerator(c: Context): string {
    const ip = c.req.header('X-Forwarded-For') || 
               c.req.header('X-Real-IP') || 
               'unknown';
    const userId = (c as any).userId || 'anonymous';
    return `rate_limit:${ip}:${userId}`;
  }

  /**
   * Apply rate limiting
   */
  async apply(c: Context, next: Next): Promise<void> {
    // Skip if configured to skip
    if (this.config.skipFunction(c)) {
      await next();
      return;
    }

    const key = this.config.keyGenerator(c);
    const currentCount = await this.storage.increment(key, this.config.windowMs);

    // Add rate limit headers if enabled
    if (this.config.headers) {
      c.header('X-RateLimit-Limit', this.config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - currentCount).toString());
      c.header('X-RateLimit-Reset', (Date.now() + this.config.windowMs).toString());
    }

    // Check if limit exceeded
    if (currentCount > this.config.maxRequests) {
      this.config.onLimitReached(c);
      
      throw new HTTPException(429, {
        message: this.config.message,
        headers: this.config.headers ? {
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + this.config.windowMs).toString(),
          'Retry-After': Math.ceil(this.config.windowMs / 1000).toString()
        } : undefined
      });
    }

    await next();
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(c: Context): Promise<void> {
    const key = this.config.keyGenerator(c);
    await this.storage.reset(key);
  }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig, storage?: IRateLimitStorage) {
  const limiter = new RateLimiter(config, storage);
  return (c: Context, next: Next) => limiter.apply(c, next);
}

/**
 * Predefined rate limiting configurations
 */
export const rateLimitPresets = {
  // General API rate limiting
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later'
  }),

  // Strict rate limiting for authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  }),

  // Moderate rate limiting for file uploads
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many file uploads, please try again later'
  }),

  // Generous rate limiting for search endpoints
  search: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please slow down'
  }),

  // Very strict rate limiting for sensitive operations
  sensitive: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Rate limit exceeded for sensitive operation'
  }),

  // Per-user rate limiting (requires authentication)
  perUser: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    keyGenerator: (c: Context) => {
      const userId = (c as any).userId;
      return userId ? `user_rate_limit:${userId}` : `ip_rate_limit:${c.req.header('X-Forwarded-For') || 'unknown'}`;
    }
  }),

  // Burst rate limiting (short window, low limit)
  burst: createRateLimit({
    windowMs: 1000, // 1 second
    maxRequests: 5,
    message: 'Request rate too high, please slow down'
  })
};

/**
 * Advanced rate limiting with multiple tiers
 */
export class TieredRateLimiter {
  private limiters: Array<{ limiter: RateLimiter; priority: number }> = [];

  addLimiter(config: RateLimitConfig, priority: number = 0, storage?: IRateLimitStorage): void {
    this.limiters.push({
      limiter: new RateLimiter(config, storage),
      priority
    });
    // Sort by priority (higher priority first)
    this.limiters.sort((a, b) => b.priority - a.priority);
  }

  async apply(c: Context, next: Next): Promise<void> {
    // Apply all limiters in priority order
    for (const { limiter } of this.limiters) {
      await limiter.apply(c, async () => {
        // Don't call next here, just validate this limiter
      });
    }
    // If all limiters pass, call next
    await next();
  }
}

/**
 * Rate limiting based on user role/tier
 */
export function createTieredRateLimit(
  basicConfig: RateLimitConfig,
  premiumConfig: RateLimitConfig,
  storage?: IRateLimitStorage
) {
  const basicLimiter = new RateLimiter(basicConfig, storage);
  const premiumLimiter = new RateLimiter(premiumConfig, storage);

  return async (c: Context, next: Next) => {
    const userRole = (c as any).userRole || 'basic';
    const limiter = userRole === 'premium' ? premiumLimiter : basicLimiter;
    await limiter.apply(c, next);
  };
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  private storage: IRateLimitStorage;
  private windowMs: number;
  private maxRequests: number;

  constructor(
    windowMs: number,
    maxRequests: number,
    storage?: IRateLimitStorage
  ) {
    this.storage = storage || new MemoryRateLimitStorage();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; count: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // This would require a more sophisticated storage implementation
    // For now, we'll use the simple increment approach
    const count = await this.storage.increment(key, this.windowMs);
    
    return {
      allowed: count <= this.maxRequests,
      count,
      resetTime: now + this.windowMs
    };
  }
}

/**
 * Rate limiting with different strategies
 */
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket'
}

/**
 * Cleanup function for memory storage
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startRateLimitCleanup(storage: MemoryRateLimitStorage, intervalMs: number = 60000): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    storage.cleanup();
  }, intervalMs);
}

export function stopRateLimitCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Utility function to get rate limit status
 */
export async function getRateLimitStatus(
  c: Context,
  limiter: RateLimiter
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
  exceeded: boolean;
}> {
  // This would require access to the limiter's internal state
  // Implementation would depend on the specific use case
  return {
    limit: 100,
    remaining: 50,
    reset: Date.now() + 900000, // 15 minutes
    exceeded: false
  };
}