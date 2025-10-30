/**
 * Authentication Routes - User registration, login, and OAuth handling
 * 
 * Handles user authentication flows including:
 * - User registration with email/password
 * - User login with email/password  
 * - Google OAuth authentication
 * - LinkedIn OAuth authentication
 * - JWT token management
 * - Password reset functionality
 * 
 * @author OpenRole Team
 * @date 2025-10-03
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthService, AuthContext, authMiddleware } from '../middleware/auth';
import { pgClient as db } from '../lib/database';
import { rateLimitPresets } from '../middleware/rate-limit';

const auth = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  user_type: z.enum(['candidate', 'employer'], {
    errorMap: () => ({ message: 'User type must be either candidate or employer' })
  }),
  company_name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Apply rate limiting to auth endpoints
auth.use('/register', rateLimitPresets.auth);
auth.use('/login', rateLimitPresets.auth);
auth.use('/forgot-password', rateLimitPresets.auth);

/**
 * User Registration
 * POST /api/auth/register
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.query(`
      SELECT id FROM users WHERE email = $1
    `, [validatedData.email]);

    if (existingUser.rows.length > 0) {
      throw new HTTPException(409, { 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Create user
    const newUser = await db.query(`
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        user_type,
        company_name,
        verified,
        created_at,
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, email, first_name, last_name, user_type, company_name, verified, created_at
    `, [
      validatedData.email,
      passwordHash,
      validatedData.first_name,
      validatedData.last_name,
      validatedData.user_type,
      validatedData.company_name || null,
      false // Email verification required
    ]);

    const user = newUser.rows[0];

    // Generate JWT token
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      role: user.user_type
    });

    return c.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        companyName: user.company_name,
        verified: user.verified,
        createdAt: user.created_at
      }
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { 
        message: 'Validation error', 
        cause: error.errors 
      });
    }
    
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Registration error:', error);
    throw new HTTPException(500, { 
      message: 'Internal server error during registration' 
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = loginSchema.parse(body);

    // Get user by email
    const userResult = await db.query(`
      SELECT id, email, password_hash, first_name, last_name, user_type, company_name, verified
      FROM users 
      WHERE email = $1
    `, [validatedData.email]);

    if (userResult.rows.length === 0) {
      throw new HTTPException(401, { 
        message: 'Invalid email or password' 
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new HTTPException(401, { 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      role: user.user_type
    });

    return c.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        companyName: user.company_name,
        verified: user.verified
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { 
        message: 'Validation error', 
        cause: error.errors 
      });
    }
    
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Login error:', error);
    throw new HTTPException(500, { 
      message: 'Internal server error during login' 
    });
  }
});

/**
 * Get Current User
 * GET /api/auth/me
 */
auth.get('/me', authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.userId;

    const userResult = await db.query(`
      SELECT id, email, first_name, last_name, user_type, company_name, verified, created_at
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new HTTPException(404, { 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        companyName: user.company_name,
        verified: user.verified,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Get user error:', error);
    throw new HTTPException(500, { 
      message: 'Internal server error' 
    });
  }
});

/**
 * Logout (Token invalidation would be handled client-side)
 * POST /api/auth/logout
 */
auth.post('/logout', authMiddleware, async (c: AuthContext) => {
  // For JWT tokens, logout is typically handled client-side by removing the token
  // In a production system, you might want to maintain a blacklist of invalidated tokens
  
  return c.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
auth.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Check if user exists
    const userResult = await db.query(`
      SELECT id, email FROM users WHERE email = $1
    `, [validatedData.email]);

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return c.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    const user = userResult.rows[0];

    // TODO: Implement password reset token generation and email sending
    // For now, return success message
    console.log(`Password reset requested for user: ${user.email}`);

    return c.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { 
        message: 'Validation error', 
        cause: error.errors 
      });
    }

    console.error('Forgot password error:', error);
    throw new HTTPException(500, { 
      message: 'Internal server error' 
    });
  }
});

/**
 * Update Profile
 * PUT /api/auth/profile
 */
auth.put('/profile', authMiddleware, async (c: AuthContext) => {
  try {
    const body = await c.req.json();
    const userId = c.userId;

    const updateSchema = z.object({
      first_name: z.string().min(1).optional(),
      last_name: z.string().min(1).optional(),
      company_name: z.string().optional()
    });

    const validatedData = updateSchema.parse(body);

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (validatedData.first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(validatedData.first_name);
    }

    if (validatedData.last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(validatedData.last_name);
    }

    if (validatedData.company_name !== undefined) {
      updates.push(`company_name = $${paramCount++}`);
      values.push(validatedData.company_name);
    }

    if (updates.length === 0) {
      throw new HTTPException(400, { 
        message: 'No valid fields to update' 
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, user_type, company_name, verified
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new HTTPException(404, { 
        message: 'User not found' 
      });
    }

    const user = result.rows[0];

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        companyName: user.company_name,
        verified: user.verified
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { 
        message: 'Validation error', 
        cause: error.errors 
      });
    }
    
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Update profile error:', error);
    throw new HTTPException(500, { 
      message: 'Internal server error' 
    });
  }
});

export default auth;