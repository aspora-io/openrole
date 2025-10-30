/**
 * OAuth Authentication Routes - Google and LinkedIn SSO
 * 
 * Handles OAuth flows for third-party authentication providers:
 * - Google OAuth 2.0
 * - LinkedIn OAuth 2.0
 * - User creation/linking for OAuth accounts
 * - JWT token generation after successful OAuth
 * 
 * @author OpenRole Team
 * @date 2025-10-03
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../middleware/auth';
import { pgClient as db } from '../lib/database';

const oauth = new Hono();

// OAuth Configuration - Load from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://openrole.net/api/auth/google/callback';

// LinkedIn OAuth (placeholder - need actual credentials)
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || 'your-linkedin-client-id';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || 'your-linkedin-client-secret';
const LINKEDIN_REDIRECT_URI = 'https://openrole.net/api/auth/linkedin/callback';

/**
 * Initiate Google OAuth
 * GET /api/auth/google
 */
oauth.get('/google', async (c) => {
  const state = crypto.randomUUID(); // CSRF protection
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);

  // Store state in session/cookie for verification (simplified for now)
  return c.redirect(googleAuthUrl.toString());
});

/**
 * Google OAuth Callback
 * GET /api/auth/google/callback
 */
oauth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
      return c.redirect(`/auth-callback?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return c.redirect('/auth-callback?error=no_authorization_code');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();

    // Check if user exists
    let user;
    const existingUser = await db.query(`
      SELECT id, email, first_name, last_name, user_type, google_id, verified
      FROM users 
      WHERE email = $1 OR google_id = $2
    `, [profile.email, profile.id]);

    if (existingUser.rows.length > 0) {
      // User exists, update Google ID if needed
      user = existingUser.rows[0];
      if (!user.google_id) {
        await db.query(`
          UPDATE users 
          SET google_id = $1, verified = true, updated_at = NOW()
          WHERE id = $2
        `, [profile.id, user.id]);
      }
    } else {
      // Create new user
      const newUserResult = await db.query(`
        INSERT INTO users (
          email, 
          password_hash, 
          first_name, 
          last_name, 
          user_type,
          google_id,
          verified,
          created_at,
          updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, email, first_name, last_name, user_type, google_id, verified
      `, [
        profile.email,
        await bcrypt.hash(crypto.randomUUID(), 12), // Random password for OAuth users
        profile.given_name || '',
        profile.family_name || '',
        'candidate', // Default to candidate
        profile.id,
        true // OAuth users are automatically verified
      ]);

      user = newUserResult.rows[0];
    }

    // Generate JWT token
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      role: user.user_type
    });

    // Redirect to callback page with token
    return c.redirect(`/auth-callback?token=${encodeURIComponent(token)}&provider=google`);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.redirect('/auth-callback?error=oauth_failed');
  }
});

/**
 * Initiate LinkedIn OAuth
 * GET /api/auth/linkedin
 */
oauth.get('/linkedin', async (c) => {
  const state = crypto.randomUUID(); // CSRF protection
  
  const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  linkedinAuthUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
  linkedinAuthUrl.searchParams.set('redirect_uri', LINKEDIN_REDIRECT_URI);
  linkedinAuthUrl.searchParams.set('response_type', 'code');
  linkedinAuthUrl.searchParams.set('scope', 'r_liteprofile r_emailaddress');
  linkedinAuthUrl.searchParams.set('state', state);

  return c.redirect(linkedinAuthUrl.toString());
});

/**
 * LinkedIn OAuth Callback
 * GET /api/auth/linkedin/callback
 */
oauth.get('/linkedin/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
      return c.redirect(`/auth-callback?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return c.redirect('/auth-callback?error=no_authorization_code');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: LINKEDIN_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user profile from LinkedIn
    const [profileResponse, emailResponse] = await Promise.all([
      fetch('https://api.linkedin.com/v2/people/~:(id,localizedFirstName,localizedLastName)', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }),
      fetch('https://api.linkedin.com/v2/emailAddresses?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    ]);

    if (!profileResponse.ok || !emailResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();
    const emailData = await emailResponse.json();
    const email = emailData.elements?.[0]?.['handle~']?.emailAddress;

    if (!email) {
      throw new Error('No email address found in LinkedIn profile');
    }

    // Check if user exists
    let user;
    const existingUser = await db.query(`
      SELECT id, email, first_name, last_name, user_type, linkedin_id, verified
      FROM users 
      WHERE email = $1 OR linkedin_id = $2
    `, [email, profile.id]);

    if (existingUser.rows.length > 0) {
      // User exists, update LinkedIn ID if needed
      user = existingUser.rows[0];
      if (!user.linkedin_id) {
        await db.query(`
          UPDATE users 
          SET linkedin_id = $1, verified = true, updated_at = NOW()
          WHERE id = $2
        `, [profile.id, user.id]);
      }
    } else {
      // Create new user
      const newUserResult = await db.query(`
        INSERT INTO users (
          email, 
          password_hash, 
          first_name, 
          last_name, 
          user_type,
          linkedin_id,
          verified,
          created_at,
          updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, email, first_name, last_name, user_type, linkedin_id, verified
      `, [
        email,
        await bcrypt.hash(crypto.randomUUID(), 12), // Random password for OAuth users
        profile.localizedFirstName || '',
        profile.localizedLastName || '',
        'candidate', // Default to candidate
        profile.id,
        true // OAuth users are automatically verified
      ]);

      user = newUserResult.rows[0];
    }

    // Generate JWT token
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      role: user.user_type
    });

    // Redirect to callback page with token
    return c.redirect(`/auth-callback?token=${encodeURIComponent(token)}&provider=linkedin`);

  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return c.redirect('/auth-callback?error=oauth_failed');
  }
});

/**
 * Link OAuth Account to Existing User
 * POST /api/auth/link-oauth
 */
oauth.post('/link-oauth', async (c) => {
  // This endpoint would be used to link an OAuth account to an existing user
  // Implementation depends on specific requirements
  return c.json({
    success: false,
    message: 'OAuth linking not yet implemented'
  });
});

/**
 * Unlink OAuth Account
 * DELETE /api/auth/unlink-oauth
 */
oauth.delete('/unlink-oauth', async (c) => {
  // This endpoint would be used to unlink an OAuth account
  // Implementation depends on specific requirements
  return c.json({
    success: false,
    message: 'OAuth unlinking not yet implemented'
  });
});

export default oauth;