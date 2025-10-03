// SSO Endpoints for OpenRole API
// Add these to your main API server (api-server-db.js)

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR google_id = $2',
        [profile.emails[0].value, profile.id]
      );
      
      if (existingUser.rows.length > 0) {
        // User exists, update Google ID if needed
        const user = existingUser.rows[0];
        if (!user.google_id) {
          await pool.query(
            'UPDATE users SET google_id = $1 WHERE id = $2',
            [profile.id, user.id]
          );
        }
        return done(null, user);
      } else {
        // Create new user
        const newUser = await pool.query(
          `INSERT INTO users (email, first_name, last_name, user_type, google_id, email_verified, created_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           RETURNING id, email, first_name, last_name, user_type`,
          [
            profile.emails[0].value,
            profile.name.givenName,
            profile.name.familyName,
            'candidate',
            profile.id
          ]
        );
        return done(null, newUser.rows[0]);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

// Configure LinkedIn OAuth Strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "/api/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_liteprofile']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR linkedin_id = $2',
        [profile.emails[0].value, profile.id]
      );
      
      if (existingUser.rows.length > 0) {
        // User exists, update LinkedIn ID if needed
        const user = existingUser.rows[0];
        if (!user.linkedin_id) {
          await pool.query(
            'UPDATE users SET linkedin_id = $1 WHERE id = $2',
            [profile.id, user.id]
          );
        }
        return done(null, user);
      } else {
        // Create new user
        const newUser = await pool.query(
          `INSERT INTO users (email, first_name, last_name, user_type, linkedin_id, email_verified, created_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           RETURNING id, email, first_name, last_name, user_type`,
          [
            profile.emails[0].value,
            profile.name.givenName,
            profile.name.familyName,
            'candidate',
            profile.id
          ]
        );
        return done(null, newUser.rows[0]);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

// Initialize passport
app.use(passport.initialize());

// Google OAuth routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        user_type: req.user.user_type 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to callback page with token
    res.redirect(`/auth-callback?token=${token}&provider=google`);
  }
);

// LinkedIn OAuth routes
app.get('/api/auth/linkedin',
  passport.authenticate('linkedin')
);

app.get('/api/auth/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        user_type: req.user.user_type 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to callback page with token
    res.redirect(`/auth-callback?token=${token}&provider=linkedin`);
  }
);

// Get current user info endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT id, email, first_name, last_name, user_type, email_verified FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user: user.rows[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Required environment variables:
// GOOGLE_CLIENT_ID=your-google-client-id
// GOOGLE_CLIENT_SECRET=your-google-client-secret
// LINKEDIN_CLIENT_ID=your-linkedin-client-id
// LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

// Required database schema additions:
/*
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
*/