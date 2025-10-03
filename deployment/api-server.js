const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'openrole-api' });
});

// Mock data
const mockJobs = [
  {
    id: 1,
    title: 'Senior Software Developer',
    company: 'Tech Corp',
    location: 'London',
    salary_min: 60000,
    salary_max: 80000,
    type: 'permanent',
    description: 'We are looking for an experienced software developer to join our team. You\'ll work on cutting-edge projects using React, Node.js, and cloud technologies.',
    requirements: ['5+ years experience', 'React', 'Node.js', 'Cloud technologies'],
    posted_date: new Date(Date.now() - 86400000).toISOString(),
    remote: false
  },
  {
    id: 2,
    title: 'Digital Marketing Manager',
    company: 'Global Marketing Ltd',
    location: 'Manchester',
    salary_min: 45000,
    salary_max: 55000,
    type: 'permanent',
    description: 'Exciting opportunity for a digital marketing professional to lead our online marketing strategy.',
    requirements: ['SEO expertise', 'PPC campaigns', 'Social media marketing'],
    posted_date: new Date(Date.now() - 172800000).toISOString(),
    remote: true
  },
  {
    id: 3,
    title: 'Data Analyst',
    company: 'Analytics Pro',
    location: 'Birmingham',
    salary_min: 35000,
    salary_max: 45000,
    type: 'contract',
    description: 'Join our data team to help drive insights and business decisions.',
    requirements: ['SQL', 'Python or R', 'Data visualization'],
    posted_date: new Date(Date.now() - 259200000).toISOString(),
    remote: true
  },
  {
    id: 4,
    title: 'Finance Manager',
    company: 'Corporate Finance Ltd',
    location: 'Edinburgh',
    salary_min: 50000,
    salary_max: 65000,
    type: 'permanent',
    description: 'We\'re seeking an experienced Finance Manager to oversee financial operations.',
    requirements: ['ACA/ACCA qualified', '5+ years experience', 'Team leadership'],
    posted_date: new Date(Date.now() - 345600000).toISOString(),
    remote: false
  },
  {
    id: 5,
    title: 'UX Designer',
    company: 'Design Studio',
    location: 'Bristol',
    salary_min: 40000,
    salary_max: 50000,
    type: 'permanent',
    description: 'Creative UX Designer needed to join our award-winning design team.',
    requirements: ['Portfolio required', 'Figma/Sketch', 'User research'],
    posted_date: new Date(Date.now() - 432000000).toISOString(),
    remote: false
  }
];

// API Routes
app.get('/api/jobs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const per_page = parseInt(req.query.per_page) || 10;
  const start = (page - 1) * per_page;
  const end = start + per_page;
  
  res.json({
    data: mockJobs.slice(start, end),
    total: mockJobs.length,
    page: page,
    per_page: per_page,
    total_pages: Math.ceil(mockJobs.length / per_page)
  });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = mockJobs.find(j => j.id === parseInt(req.params.id));
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password required' 
    });
  }
  
  res.json({
    success: true,
    message: 'Registration successful (demo mode)',
    user: {
      id: Math.floor(Math.random() * 1000),
      email: email,
      role: role || 'candidate'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password required' 
    });
  }
  
  // Demo mode - accept any credentials
  res.json({
    success: true,
    token: 'demo-jwt-token-' + Date.now(),
    user: {
      id: 1,
      email: email,
      role: email.includes('employer') ? 'employer' : 'candidate'
    }
  });
});

app.post('/api/cv/upload', (req, res) => {
  res.json({
    success: true,
    message: 'CV uploaded successfully (demo mode)',
    cv_id: 'cv_' + Date.now()
  });
});

app.get('/api/search', (req, res) => {
  const { q, location } = req.query;
  
  let results = [...mockJobs];
  
  if (q) {
    results = results.filter(job => 
      job.title.toLowerCase().includes(q.toLowerCase()) ||
      job.company.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  if (location) {
    results = results.filter(job => 
      job.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  res.json({
    data: results,
    total: results.length,
    query: q,
    location: location
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`OpenRole API running on port ${PORT}`);
});