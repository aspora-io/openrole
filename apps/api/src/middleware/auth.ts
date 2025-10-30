/**
 * Authentication Middleware - JWT-based authentication for API endpoints
 * 
 * Provides secure authentication, token validation, and user context
 * for protected API routes with support for different authentication levels.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as jwt from 'jsonwebtoken';
import { pgClient as db } from '../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'candidate' | 'employer' | 'admin';
  isVerified: boolean;
  permissions: string[];
  createdAt: Date;
}

export interface AuthContext extends Context {
  user?: AuthenticatedUser;
  userId?: string;
  userRole?: string;
}

/**
 * JWT token payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Authentication service for token management
 */
export class AuthService {
  /**
   * Generate JWT token for user
   */
  static generateToken(user: Pick<AuthenticatedUser, 'id' | 'email' | 'role'>): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'openrole.net',
      audience: 'openrole-api'
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'openrole.net',
        audience: 'openrole-api'
      }) as JWTPayload;
    } catch (error) {
      throw new HTTPException(401, { message: 'Invalid or expired token' });
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractToken(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new HTTPException(401, { message: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new HTTPException(401, { message: 'Invalid authorization format. Use: Bearer <token>' });
    }

    return parts[1];
  }

  /**
   * Get user data from database
   */
  static async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const result = await db`
        SELECT id, email, user_type, verified, created_at
        FROM users 
        WHERE id = ${userId}
      `;

      if (result.length === 0) {
        return null;
      }

      const user = result[0];
      
      // Define permissions based on user type
      const permissions = user.user_type === 'employer' 
        ? ['profile:read', 'profile:write', 'jobs:read', 'jobs:write', 'applications:read']
        : ['profile:read', 'profile:write', 'cv:read', 'cv:write', 'applications:write'];

      return {
        id: user.id,
        email: user.email,
        role: user.user_type,
        isVerified: user.verified,
        permissions,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Check if user has required permission
   */
  static hasPermission(user: AuthenticatedUser, permission: string): boolean {
    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }

    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the required roles
   */
  static hasRole(user: AuthenticatedUser, roles: string[]): boolean {
    return roles.includes(user.role);
  }
}

/**
 * Basic authentication middleware - verifies JWT token
 */
export const authMiddleware = async (c: AuthContext, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = AuthService.extractToken(authHeader);
    const payload = AuthService.verifyToken(token);

    // Get user data
    const user = await AuthService.getUserById(payload.userId);
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }

    // Add user to context
    c.user = user;
    c.userId = user.id;
    c.userRole = user.role;

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Authentication error:', error);
    throw new HTTPException(401, { message: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware - adds user context if token present
 */
export const optionalAuthMiddleware = async (c: AuthContext, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader) {
      const token = AuthService.extractToken(authHeader);
      const payload = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(payload.userId);
      
      if (user) {
        c.user = user;
        c.userId = user.id;
        c.userRole = user.role;
      }
    }

    await next();
  } catch (error) {
    // For optional auth, continue without user context if auth fails
    console.warn('Optional authentication failed:', error);
    await next();
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (c: AuthContext, next: Next) => {
    if (!c.user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!AuthService.hasRole(c.user, allowedRoles)) {
      throw new HTTPException(403, { 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    await next();
  };
};

/**
 * Permission-based access control middleware
 */
export const requirePermission = (permission: string) => {
  return async (c: AuthContext, next: Next) => {
    if (!c.user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!AuthService.hasPermission(c.user, permission)) {
      throw new HTTPException(403, { 
        message: `Access denied. Required permission: ${permission}` 
      });
    }

    await next();
  };
};

/**
 * Resource ownership middleware - ensures user owns the resource
 */
export const requireOwnership = (resourceUserIdField = 'userId') => {
  return async (c: AuthContext, next: Next) => {
    if (!c.user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const resourceUserId = c.req.param(resourceUserIdField) || c.req.query(resourceUserIdField);
    
    if (!resourceUserId) {
      throw new HTTPException(400, { 
        message: `Resource ${resourceUserIdField} parameter required` 
      });
    }

    // Admin can access all resources
    if (c.user.role === 'admin') {
      await next();
      return;
    }

    if (c.user.id !== resourceUserId) {
      throw new HTTPException(403, { 
        message: 'Access denied. You can only access your own resources.' 
      });
    }

    await next();
  };
};

/**
 * Account verification middleware
 */
export const requireVerification = async (c: AuthContext, next: Next) => {
  if (!c.user) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  if (!c.user.isVerified) {
    throw new HTTPException(403, { 
      message: 'Account verification required. Please verify your email address.' 
    });
  }

  await next();
};

/**
 * Rate limiting by user middleware
 */
export const rateLimitByUser = (
  maxRequests: number, 
  windowMs: number = 60000 // 1 minute default
) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return async (c: AuthContext, next: Next) => {
    const userId = c.user?.id || c.req.header('X-Forwarded-For') || 'anonymous';
    const now = Date.now();
    
    const userLimit = userRequests.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize limit
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      throw new HTTPException(429, { 
        message: 'Rate limit exceeded. Please try again later.',
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': userLimit.resetTime.toString()
        }
      });
    }

    userLimit.count++;
    await next();
  };
};

/**
 * API key authentication middleware (for service-to-service calls)
 */
export const apiKeyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header('X-API-Key');
  const validApiKeys = process.env.API_KEYS?.split(',') || [];

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    throw new HTTPException(401, { message: 'Invalid API key' });
  }

  await next();
};

/**
 * Development-only middleware
 */
export const devOnly = async (c: Context, next: Next) => {
  if (process.env.NODE_ENV === 'production') {
    throw new HTTPException(404, { message: 'Not found' });
  }
  await next();
};

/**
 * Request context helper to add common request data
 */
export const addRequestContext = async (c: Context, next: Next) => {
  // Add request metadata
  (c as any).requestId = crypto.randomUUID();
  (c as any).requestTime = Date.now();
  (c as any).userAgent = c.req.header('User-Agent');
  (c as any).ip = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';

  await next();
};

/**
 * Composite middleware for common authentication patterns
 */
export const authPatterns = {
  // Basic authenticated route
  authenticated: [authMiddleware],

  // Authenticated with verification required
  verifiedUser: [authMiddleware, requireVerification],

  // Admin only
  adminOnly: [authMiddleware, requireRole(['admin'])],

  // Candidate only
  candidateOnly: [authMiddleware, requireRole(['candidate'])],

  // Employer only
  employerOnly: [authMiddleware, requireRole(['employer'])],

  // Candidate or Admin
  candidateOrAdmin: [authMiddleware, requireRole(['candidate', 'admin'])],

  // Optional authentication with rate limiting
  publicWithLimits: [optionalAuthMiddleware, rateLimitByUser(100, 60000)],

  // High-security endpoints
  highSecurity: [
    authMiddleware,
    requireVerification,
    rateLimitByUser(10, 60000)
  ]
};

/**
 * Alias for authMiddleware for better compatibility
 * Some routes use requireAuth instead of authMiddleware
 */
export const requireAuth = authMiddleware;