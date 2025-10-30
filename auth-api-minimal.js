#!/usr/bin/env node

/**
 * Minimal Authentication API for OpenRole
 * Standalone Node.js server with authentication endpoints
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3002;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'Hw00tSuklDbLH4QDfmdoOuQhu6WwToWJ53yxOuDaeG8=';
const JWT_EXPIRES_IN = '7d';

// Google OAuth Configuration - Load from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@openrole-db:5432/openrole',
  ssl: false
});

// Middleware
app.use(cors({
  origin: ['https://openrole.net', 'http://145.223.75.73:8081', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'OpenRole Auth API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, user_type } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name || !user_type) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, user_type, verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, email, first_name, last_name, user_type, verified, created_at
    `, [email, passwordHash, first_name, last_name, user_type, false]);

    const user = newUser.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verified: user.verified,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Get user
    const userResult = await pool.query(`
      SELECT id, email, password_hash, first_name, last_name, user_type, verified
      FROM users WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verified: user.verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(`
      SELECT id, email, first_name, last_name, user_type, verified, created_at
      FROM users WHERE id = $1
    `, [req.user.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verified: user.verified,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Google OAuth - Initiate
app.get('/api/auth/google', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=https://openrole.net/api/auth/google/callback&` +
    `response_type=code&` +
    `scope=openid email profile&` +
    `state=${state}`;
  
  res.redirect(googleAuthUrl);
});

// Google OAuth - Callback
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.redirect(`/auth-callback.html?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect('/auth-callback.html?error=no_authorization_code');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://openrole.net/api/auth/google/callback'
      })
    });

    const tokenData = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    const profile = await profileResponse.json();

    // Check if user exists or create new user
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1 OR google_id = $2', [profile.email, profile.id]);
    
    let user;
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
      // Update Google ID if not set
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1, verified = true WHERE id = $2', [profile.id, user.id]);
      }
    } else {
      // Create new user
      const newUserResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, user_type, google_id, verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
        RETURNING *
      `, [
        profile.email,
        await bcrypt.hash(Math.random().toString(36), 12), // Random password for OAuth users
        profile.given_name || '',
        profile.family_name || '',
        'candidate',
        profile.id
      ]);
      user = newUserResult.rows[0];
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.redirect(`/auth-callback.html?token=${encodeURIComponent(token)}&provider=google`);

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/auth-callback.html?error=oauth_failed');
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 OpenRole Auth API running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});