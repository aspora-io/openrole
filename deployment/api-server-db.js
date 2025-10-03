const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'openrole',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      service: 'openrole-api',
      database: 'connected',
      time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Get jobs with companies
app.get('/api/jobs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.per_page) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', ['active']);
    const total = parseInt(countResult.rows[0].count);
    
    // Get jobs with company info
    const query = `
      SELECT 
        j.id,
        j.title,
        j.description,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.location_general as location,
        j.remote_type,
        j.employment_type as type,
        j.created_at as posted_date,
        c.name as company,
        c.logo_url
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.status = $1
      ORDER BY j.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, ['active', limit, offset]);
    
    res.json({
      data: result.rows,
      total: total,
      page: page,
      per_page: limit,
      total_pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        j.*,
        c.name as company_name,
        c.description as company_description,
        c.logo_url,
        c.website
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, user_type = 'candidate' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }
    
    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create user
    const insertQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, user_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, user_type
    `;
    
    const result = await pool.query(insertQuery, [
      email, password_hash, first_name, last_name, user_type
    ]);
    
    res.json({
      success: true,
      message: 'Registration successful',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }
    
    // Find user
    const userQuery = await pool.query(
      'SELECT id, email, password_hash, user_type, first_name, last_name FROM users WHERE email = $1',
      [email]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const user = userQuery.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// Search jobs
app.get('/api/search', async (req, res) => {
  try {
    const { q, location } = req.query;
    let conditions = ['j.status = $1'];
    let params = ['active'];
    let paramIndex = 2;
    
    if (q) {
      conditions.push(`(LOWER(j.title) LIKE LOWER($${paramIndex}) OR LOWER(c.name) LIKE LOWER($${paramIndex}))`);
      params.push(`%${q}%`);
      paramIndex++;
    }
    
    if (location) {
      conditions.push(`(LOWER(j.location_general) LIKE LOWER($${paramIndex}) OR LOWER(j.location_precise) LIKE LOWER($${paramIndex}))`);
      params.push(`%${location}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const query = `
      SELECT 
        j.id,
        j.title,
        j.description,
        j.salary_min,
        j.salary_max,
        j.location_general as location,
        j.remote_type,
        j.employment_type as type,
        j.created_at as posted_date,
        c.name as company
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      total: result.rows.length,
      query: q,
      location: location
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Add some sample data if database is empty
async function seedDatabase() {
  try {
    // Check if we have any companies
    const companyCount = await pool.query('SELECT COUNT(*) FROM companies');
    
    if (parseInt(companyCount.rows[0].count) === 0) {
      console.log('Seeding database with sample data...');
      
      // Create sample companies
      const companies = [
        ['Tech Corp', 'Leading technology company', 'https://techcorp.com', 'Technology', 'large'],
        ['Global Marketing Ltd', 'Digital marketing experts', 'https://globalmarketing.com', 'Marketing', 'medium'],
        ['Analytics Pro', 'Data analytics specialists', 'https://analyticspro.com', 'Technology', 'small'],
        ['Corporate Finance Ltd', 'Financial services', 'https://corpfinance.com', 'Finance', 'large'],
        ['Design Studio', 'Creative design agency', 'https://designstudio.com', 'Creative', 'small']
      ];
      
      for (const [name, description, website, industry, size] of companies) {
        await pool.query(
          `INSERT INTO companies (name, description, website, industry, size_category, verified)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [name, description, website, industry, size]
        );
      }
      
      // Get company IDs
      const companyResult = await pool.query('SELECT id, name FROM companies');
      const companyMap = {};
      companyResult.rows.forEach(c => companyMap[c.name] = c.id);
      
      // Create sample jobs
      const jobs = [
        {
          title: 'Senior Software Developer',
          company: 'Tech Corp',
          salary_min: 60000,
          salary_max: 80000,
          location: 'London',
          description: 'We are looking for an experienced software developer...',
          type: 'full-time'
        },
        {
          title: 'Digital Marketing Manager',
          company: 'Global Marketing Ltd',
          salary_min: 45000,
          salary_max: 55000,
          location: 'Manchester',
          remote: 'remote',
          description: 'Exciting opportunity for a digital marketing professional...',
          type: 'full-time'
        },
        {
          title: 'Data Analyst',
          company: 'Analytics Pro',
          salary_min: 35000,
          salary_max: 45000,
          location: 'Birmingham',
          remote: 'hybrid',
          description: 'Join our data team to help drive insights...',
          type: 'contract'
        },
        {
          title: 'Finance Manager',
          company: 'Corporate Finance Ltd',
          salary_min: 50000,
          salary_max: 65000,
          location: 'Edinburgh',
          description: 'Seeking an experienced Finance Manager...',
          type: 'full-time'
        },
        {
          title: 'UX Designer',
          company: 'Design Studio',
          salary_min: 40000,
          salary_max: 50000,
          location: 'Bristol',
          description: 'Creative UX Designer needed...',
          type: 'full-time'
        }
      ];
      
      for (const job of jobs) {
        await pool.query(
          `INSERT INTO jobs (
            title, description, company_id, salary_min, salary_max,
            salary_currency, location_general, remote_type, employment_type,
            experience_level, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            job.title,
            job.description,
            companyMap[job.company],
            job.salary_min,
            job.salary_max,
            'GBP',
            job.location,
            job.remote || 'office',
            job.type,
            'mid',
            'active'
          ]
        );
      }
      
      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`OpenRole API running on port ${PORT}`);
  await seedDatabase();
});