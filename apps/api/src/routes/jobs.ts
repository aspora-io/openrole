import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateInput } from '../middleware/validation';
import { rateLimitPresets } from '../middleware/rate-limit';
import { JobsService } from '../services/jobs.service';
import { JobSearchService } from '../services/job-search.service';
import { ApplicationsService } from '../services/applications.service';

const jobs = new Hono();

// Apply rate limiting
jobs.use('/*', rateLimitPresets.jobs);

// Job search schema
const jobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  remote_type: z.enum(['remote', 'hybrid', 'office']).optional(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  company_id: z.string().uuid().optional(),
  department: z.string().optional(),
  featured: z.boolean().optional(),
  urgent: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'date', 'salary_min', 'salary_max', 'company']).default('relevance')
});

// Job creation schema
const createJobSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(50),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  
  // Mandatory salary transparency
  salary_min: z.number().min(0),
  salary_max: z.number().min(0),
  salary_currency: z.string().length(3).default('EUR'),
  salary_type: z.enum(['annual', 'monthly', 'daily', 'hourly']).default('annual'),
  equity_offered: z.boolean().default(false),
  
  // Location
  location_precise: z.string().optional(),
  location_general: z.string().optional(),
  remote_type: z.enum(['remote', 'hybrid', 'office']).default('office'),
  
  // Job details
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
  department: z.string().optional(),
  
  // Skills
  core_skills: z.array(z.string()).min(1),
  nice_to_have_skills: z.array(z.string()).default([]),
  certifications_required: z.array(z.string()).default([]),
  
  // Application settings
  application_deadline: z.string().datetime().optional(),
  external_application_url: z.string().url().optional(),
  requires_cover_letter: z.boolean().default(false),
  requires_portfolio: z.boolean().default(false),
  custom_questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'multiselect']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional()
  })).default([]),
  
  // Job features
  featured: z.boolean().default(false),
  urgent: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

// Job update schema (partial)
const updateJobSchema = createJobSchema.partial();

// Bulk import schema for scraped jobs
const bulkImportJobSchema = z.object({
  jobs: z.array(z.object({
    title: z.string().min(3).max(255),
    description: z.string().min(10),
    company_name: z.string().min(1).max(255),
    salary_min: z.number().min(0),
    salary_max: z.number().min(0),
    salary_currency: z.string().length(3).default('EUR'),
    location_precise: z.string().optional(),
    location_general: z.string().optional(),
    remote_type: z.enum(['remote', 'hybrid', 'office']).default('office'),
    employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']).default('full-time'),
    experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).default('mid'),
    core_skills: z.array(z.string()).default([]),
    nice_to_have_skills: z.array(z.string()).default([]),
    external_url: z.string().url().optional(),
    source: z.string().default('import'),
    source_id: z.string().optional(), // Original ID from source
    tags: z.array(z.string()).default([])
  })).min(1).max(1000), // Allow up to 1000 jobs per import
  source_name: z.string().min(1).max(100),
  import_note: z.string().optional(),
  auto_publish: z.boolean().default(false),
  deduplicate: z.boolean().default(true)
});

// Application schema
const applyToJobSchema = z.object({
  cv_document_id: z.string().uuid().optional(),
  cover_letter: z.string().optional(),
  portfolio_items: z.array(z.string().uuid()).default([]),
  custom_responses: z.record(z.string(), z.any()).default({})
});

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

// GET /api/v1/jobs - Public job search with advanced filtering
jobs.get('/', validateInput('query', jobSearchSchema), async (c) => {
  try {
    const searchParams = c.req.valid('query');
    const searchService = new JobSearchService();
    
    const results = await searchService.searchJobs(searchParams);
    
    return c.json({
      success: true,
      data: results.jobs,
      pagination: {
        page: searchParams.page,
        limit: searchParams.limit,
        total: results.total,
        totalPages: Math.ceil(results.total / searchParams.limit)
      },
      filters: results.facets
    });
  } catch (error) {
    console.error('Job search error:', error);
    return c.json({ success: false, error: 'Failed to search jobs' }, 500);
  }
});

// GET /api/v1/jobs/:id - Get single job details with view tracking
jobs.get('/:id', async (c) => {
  try {
    const jobId = c.req.param('id');
    const jobsService = new JobsService();
    
    // Track view
    const sessionId = c.req.header('x-session-id') || 'anonymous';
    const userAgent = c.req.header('user-agent') || '';
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '';
    
    await jobsService.trackJobView(jobId, {
      user_id: (c as any).userId || null,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      referrer: c.req.header('referer') || null
    });
    
    const job = await jobsService.getJobById(jobId, {
      includeCompany: true,
      includeAnalytics: false
    });
    
    if (!job) {
      return c.json({ success: false, error: 'Job not found' }, 404);
    }
    
    return c.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    return c.json({ success: false, error: 'Failed to get job' }, 500);
  }
});

// GET /api/v1/jobs/:id/similar - Get similar jobs
jobs.get('/:id/similar', async (c) => {
  try {
    const jobId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '5');
    
    const searchService = new JobSearchService();
    const similarJobs = await searchService.getSimilarJobs(jobId, limit);
    
    return c.json({ success: true, data: similarJobs });
  } catch (error) {
    console.error('Similar jobs error:', error);
    return c.json({ success: false, error: 'Failed to get similar jobs' }, 500);
  }
});

// ============================================================================
// CANDIDATE ENDPOINTS
// ============================================================================

// POST /api/v1/jobs/:id/apply - Apply to job
jobs.post('/:id/apply', 
  requireAuth,
  requireRole(['candidate']),
  validateInput('json', applyToJobSchema),
  async (c) => {
    try {
      const jobId = c.req.param('id');
      const applicationData = c.req.valid('json');
      const candidateId = (c as any).userId;
      
      const applicationsService = new ApplicationsService();
      
      const application = await applicationsService.createApplication({
        job_id: jobId,
        candidate_id: candidateId,
        ...applicationData
      });
      
      return c.json({ 
        success: true, 
        data: application,
        message: 'Application submitted successfully'
      }, 201);
    } catch (error) {
      console.error('Job application error:', error);
      if (error.message.includes('duplicate')) {
        return c.json({ success: false, error: 'You have already applied to this job' }, 409);
      }
      return c.json({ success: false, error: 'Failed to submit application' }, 500);
    }
  }
);

// POST /api/v1/jobs/:id/save - Save job for later
jobs.post('/:id/save', requireAuth, requireRole(['candidate']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const candidateId = (c as any).userId;
    
    const jobsService = new JobsService();
    await jobsService.saveJob(candidateId, jobId);
    
    return c.json({ 
      success: true, 
      message: 'Job saved successfully'
    });
  } catch (error) {
    console.error('Save job error:', error);
    if (error.message.includes('duplicate')) {
      return c.json({ success: false, error: 'Job already saved' }, 409);
    }
    return c.json({ success: false, error: 'Failed to save job' }, 500);
  }
});

// DELETE /api/v1/jobs/:id/save - Remove saved job
jobs.delete('/:id/save', requireAuth, requireRole(['candidate']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const candidateId = (c as any).userId;
    
    const jobsService = new JobsService();
    await jobsService.unsaveJob(candidateId, jobId);
    
    return c.json({ 
      success: true, 
      message: 'Job removed from saved jobs'
    });
  } catch (error) {
    console.error('Unsave job error:', error);
    return c.json({ success: false, error: 'Failed to remove saved job' }, 500);
  }
});

// GET /api/v1/jobs/saved - Get candidate's saved jobs
jobs.get('/saved', requireAuth, requireRole(['candidate']), async (c) => {
  try {
    const candidateId = (c as any).userId;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const jobsService = new JobsService();
    const savedJobs = await jobsService.getSavedJobs(candidateId, { page, limit });
    
    return c.json({ success: true, data: savedJobs });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return c.json({ success: false, error: 'Failed to get saved jobs' }, 500);
  }
});

// ============================================================================
// EMPLOYER ENDPOINTS
// ============================================================================

// POST /api/v1/jobs - Create new job posting
jobs.post('/', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', createJobSchema),
  async (c) => {
    try {
      const jobData = c.req.valid('json');
      const employerId = (c as any).userId;
      
      const jobsService = new JobsService();
      
      // Validate salary range
      if (jobData.salary_min > jobData.salary_max) {
        return c.json({ 
          success: false, 
          error: 'Minimum salary cannot be greater than maximum salary' 
        }, 400);
      }
      
      const job = await jobsService.createJob({
        ...jobData,
        posted_by: employerId,
        status: 'draft' // Start as draft
      });
      
      return c.json({ 
        success: true, 
        data: job,
        message: 'Job created successfully as draft'
      }, 201);
    } catch (error) {
      console.error('Create job error:', error);
      return c.json({ success: false, error: 'Failed to create job' }, 500);
    }
  }
);

// PUT /api/v1/jobs/:id - Update job posting
jobs.put('/:id', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', updateJobSchema),
  async (c) => {
    try {
      const jobId = c.req.param('id');
      const jobData = c.req.valid('json');
      const employerId = (c as any).userId;
      
      const jobsService = new JobsService();
      
      const job = await jobsService.updateJob(jobId, jobData, employerId);
      
      return c.json({ 
        success: true, 
        data: job,
        message: 'Job updated successfully'
      });
    } catch (error) {
      console.error('Update job error:', error);
      if (error.message.includes('not found') || error.message.includes('permission')) {
        return c.json({ success: false, error: 'Job not found or access denied' }, 404);
      }
      return c.json({ success: false, error: 'Failed to update job' }, 500);
    }
  }
);

// DELETE /api/v1/jobs/:id - Delete job posting
jobs.delete('/:id', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const employerId = (c as any).userId;
    
    const jobsService = new JobsService();
    await jobsService.deleteJob(jobId, employerId);
    
    return c.json({ 
      success: true, 
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return c.json({ success: false, error: 'Job not found or access denied' }, 404);
    }
    return c.json({ success: false, error: 'Failed to delete job' }, 500);
  }
});

// POST /api/v1/jobs/:id/publish - Publish draft job
jobs.post('/:id/publish', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const employerId = (c as any).userId;
    
    const jobsService = new JobsService();
    const job = await jobsService.publishJob(jobId, employerId);
    
    return c.json({ 
      success: true, 
      data: job,
      message: 'Job published successfully'
    });
  } catch (error) {
    console.error('Publish job error:', error);
    return c.json({ success: false, error: 'Failed to publish job' }, 500);
  }
});

// POST /api/v1/jobs/:id/pause - Pause active job
jobs.post('/:id/pause', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const employerId = (c as any).userId;
    
    const jobsService = new JobsService();
    const job = await jobsService.pauseJob(jobId, employerId);
    
    return c.json({ 
      success: true, 
      data: job,
      message: 'Job paused successfully'
    });
  } catch (error) {
    console.error('Pause job error:', error);
    return c.json({ success: false, error: 'Failed to pause job' }, 500);
  }
});

// GET /api/v1/jobs/:id/applications - Get job applications (employer only)
jobs.get('/:id/applications', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const employerId = (c as any).userId;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    
    const applicationsService = new ApplicationsService();
    const applications = await applicationsService.getJobApplications(jobId, {
      employerId,
      page,
      limit,
      status
    });
    
    return c.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    return c.json({ success: false, error: 'Failed to get applications' }, 500);
  }
});

// GET /api/v1/jobs/:id/analytics - Get job analytics
jobs.get('/:id/analytics', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '30');
    
    const jobsService = new JobsService();
    const analytics = await jobsService.getJobAnalytics(jobId, employerId, days);
    
    return c.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get job analytics error:', error);
    return c.json({ success: false, error: 'Failed to get analytics' }, 500);
  }
});

// POST /api/v1/jobs/:id/clone - Clone existing job
jobs.post('/:id/clone', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const jobId = c.req.param('id');
    const employerId = (c as any).userId;
    
    const jobsService = new JobsService();
    const clonedJob = await jobsService.cloneJob(jobId, employerId);
    
    return c.json({ 
      success: true, 
      data: clonedJob,
      message: 'Job cloned successfully'
    }, 201);
  } catch (error) {
    console.error('Clone job error:', error);
    return c.json({ success: false, error: 'Failed to clone job' }, 500);
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// POST /api/v1/jobs/bulk-import - Bulk import scraped jobs
jobs.post('/bulk-import', 
  requireAuth,
  requireRole(['admin']),
  validateInput('json', bulkImportJobSchema),
  async (c) => {
    try {
      const importData = c.req.valid('json');
      const importedBy = (c as any).userId;
      
      const jobsService = new JobsService();
      
      // Process bulk import
      const result = await jobsService.bulkImportJobs({
        ...importData,
        imported_by: importedBy,
        imported_at: new Date().toISOString()
      });
      
      return c.json({ 
        success: true, 
        data: result,
        message: `Successfully imported ${result.imported_count} jobs from ${importData.source_name}`
      }, 201);
    } catch (error) {
      console.error('Bulk import error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to import jobs',
        details: error.message 
      }, 500);
    }
  }
);

// GET /api/v1/jobs/import-history - Get import history
jobs.get('/import-history', requireAuth, requireRole(['admin']), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const jobsService = new JobsService();
    const history = await jobsService.getImportHistory({ page, limit });
    
    return c.json({ success: true, data: history });
  } catch (error) {
    console.error('Get import history error:', error);
    return c.json({ success: false, error: 'Failed to get import history' }, 500);
  }
});

export default jobs;