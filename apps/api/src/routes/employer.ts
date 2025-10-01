import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateInput } from '../middleware/validation';
import { rateLimitPresets } from '../middleware/rate-limit';
import { EmployerService } from '../services/employer.service';
import { JobsService } from '../services/jobs.service';
import { ApplicationsService } from '../services/applications.service';
import { AnalyticsService } from '../services/analytics.service';

const employer = new Hono();

// Apply rate limiting
employer.use('/*', rateLimitPresets.general);

// Company profile update schema
const updateCompanySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size_category: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  locations: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  culture_values: z.array(z.string()).optional(),
  social_media: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional()
  }).optional()
});

// Job template schema
const jobTemplateSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  template_data: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    employment_type: z.string().optional(),
    experience_level: z.string().optional(),
    core_skills: z.array(z.string()).optional(),
    nice_to_have_skills: z.array(z.string()).optional(),
    custom_questions: z.array(z.any()).optional()
  }),
  is_public: z.boolean().default(false)
});

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================

// GET /api/v1/employer/dashboard - Get employer dashboard overview
employer.get('/dashboard', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '30');
    
    const employerService = new EmployerService();
    const dashboard = await employerService.getDashboardOverview(employerId, days);
    
    return c.json({ success: true, data: dashboard });
  } catch (error) {
    console.error('Get employer dashboard error:', error);
    return c.json({ success: false, error: 'Failed to get dashboard data' }, 500);
  }
});

// GET /api/v1/employer/stats - Get key employer statistics
employer.get('/stats', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    
    const employerService = new EmployerService();
    const stats = await employerService.getEmployerStats(employerId);
    
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get employer stats error:', error);
    return c.json({ success: false, error: 'Failed to get statistics' }, 500);
  }
});

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

// GET /api/v1/employer/jobs - Get all employer's jobs
employer.get('/jobs', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const sort = c.req.query('sort') || 'created_at';
    
    const jobsService = new JobsService();
    const jobs = await jobsService.getEmployerJobs(employerId, {
      page,
      limit,
      status,
      sort,
      includeAnalytics: true
    });
    
    return c.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    return c.json({ success: false, error: 'Failed to get jobs' }, 500);
  }
});

// GET /api/v1/employer/jobs/drafts - Get draft jobs
employer.get('/jobs/drafts', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    
    const jobsService = new JobsService();
    const drafts = await jobsService.getEmployerJobs(employerId, {
      status: 'draft',
      limit: 100
    });
    
    return c.json({ success: true, data: drafts });
  } catch (error) {
    console.error('Get draft jobs error:', error);
    return c.json({ success: false, error: 'Failed to get draft jobs' }, 500);
  }
});

// POST /api/v1/employer/jobs/bulk-action - Bulk job actions
employer.post('/jobs/bulk-action', 
  requireAuth,
  requireRole(['employer', 'admin']),
  async (c) => {
    try {
      const employerId = (c as any).userId;
      const { job_ids, action, data } = await c.req.json();
      
      if (!Array.isArray(job_ids) || job_ids.length === 0) {
        return c.json({ success: false, error: 'Invalid job IDs' }, 400);
      }
      
      const jobsService = new JobsService();
      const results = await jobsService.bulkJobAction(job_ids, action, data, employerId);
      
      return c.json({ 
        success: true, 
        data: results,
        message: `Bulk action completed: ${results.updated} jobs updated`
      });
    } catch (error) {
      console.error('Bulk job action error:', error);
      return c.json({ success: false, error: 'Failed to perform bulk action' }, 500);
    }
  }
);

// ============================================================================
// APPLICATION MANAGEMENT
// ============================================================================

// GET /api/v1/employer/applications - Get all applications across jobs
employer.get('/applications', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const jobId = c.req.query('job_id');
    const sort = c.req.query('sort') || 'applied_at';
    
    const applicationsService = new ApplicationsService();
    const applications = await applicationsService.getEmployerApplications(employerId, {
      page,
      limit,
      status,
      jobId,
      sort
    });
    
    return c.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get employer applications error:', error);
    return c.json({ success: false, error: 'Failed to get applications' }, 500);
  }
});

// GET /api/v1/employer/candidates - Get candidate pipeline
employer.get('/candidates', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const stage = c.req.query('stage');
    const jobId = c.req.query('job_id');
    
    const employerService = new EmployerService();
    const candidates = await employerService.getCandidatePipeline(employerId, {
      stage,
      jobId
    });
    
    return c.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Get candidate pipeline error:', error);
    return c.json({ success: false, error: 'Failed to get candidates' }, 500);
  }
});

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

// GET /api/v1/employer/analytics - Get comprehensive hiring analytics
employer.get('/analytics', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '30');
    const jobId = c.req.query('job_id');
    
    const analyticsService = new AnalyticsService();
    const analytics = await analyticsService.getEmployerAnalytics(employerId, {
      days,
      jobId
    });
    
    return c.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get employer analytics error:', error);
    return c.json({ success: false, error: 'Failed to get analytics' }, 500);
  }
});

// GET /api/v1/employer/analytics/hiring-funnel - Get hiring funnel metrics
employer.get('/analytics/hiring-funnel', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '90');
    const jobId = c.req.query('job_id');
    
    const analyticsService = new AnalyticsService();
    const funnelData = await analyticsService.getHiringFunnelAnalytics(employerId, {
      days,
      jobId
    });
    
    return c.json({ success: true, data: funnelData });
  } catch (error) {
    console.error('Get hiring funnel error:', error);
    return c.json({ success: false, error: 'Failed to get funnel data' }, 500);
  }
});

// GET /api/v1/employer/analytics/diversity - Get diversity & inclusion metrics
employer.get('/analytics/diversity', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '90');
    
    const analyticsService = new AnalyticsService();
    const diversityData = await analyticsService.getDiversityAnalytics(employerId, days);
    
    return c.json({ success: true, data: diversityData });
  } catch (error) {
    console.error('Get diversity analytics error:', error);
    return c.json({ success: false, error: 'Failed to get diversity data' }, 500);
  }
});

// GET /api/v1/employer/analytics/source-attribution - Get application source tracking
employer.get('/analytics/source-attribution', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '30');
    
    const analyticsService = new AnalyticsService();
    const sourceData = await analyticsService.getSourceAttributionAnalytics(employerId, days);
    
    return c.json({ success: true, data: sourceData });
  } catch (error) {
    console.error('Get source attribution error:', error);
    return c.json({ success: false, error: 'Failed to get source data' }, 500);
  }
});

// ============================================================================
// COMPANY MANAGEMENT
// ============================================================================

// GET /api/v1/employer/company - Get company profile
employer.get('/company', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    
    const employerService = new EmployerService();
    const company = await employerService.getCompanyProfile(employerId);
    
    return c.json({ success: true, data: company });
  } catch (error) {
    console.error('Get company profile error:', error);
    return c.json({ success: false, error: 'Failed to get company profile' }, 500);
  }
});

// PUT /api/v1/employer/company - Update company profile
employer.put('/company', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', updateCompanySchema),
  async (c) => {
    try {
      const employerId = (c as any).userId;
      const companyData = c.req.valid('json');
      
      const employerService = new EmployerService();
      const company = await employerService.updateCompanyProfile(employerId, companyData);
      
      return c.json({ 
        success: true, 
        data: company,
        message: 'Company profile updated successfully'
      });
    } catch (error) {
      console.error('Update company profile error:', error);
      return c.json({ success: false, error: 'Failed to update company profile' }, 500);
    }
  }
);

// ============================================================================
// JOB TEMPLATES
// ============================================================================

// GET /api/v1/employer/templates - Get job templates
employer.get('/templates', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    
    const employerService = new EmployerService();
    const templates = await employerService.getJobTemplates(employerId);
    
    return c.json({ success: true, data: templates });
  } catch (error) {
    console.error('Get job templates error:', error);
    return c.json({ success: false, error: 'Failed to get templates' }, 500);
  }
});

// POST /api/v1/employer/templates - Create job template
employer.post('/templates', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', jobTemplateSchema),
  async (c) => {
    try {
      const employerId = (c as any).userId;
      const templateData = c.req.valid('json');
      
      const employerService = new EmployerService();
      const template = await employerService.createJobTemplate(employerId, templateData);
      
      return c.json({ 
        success: true, 
        data: template,
        message: 'Job template created successfully'
      }, 201);
    } catch (error) {
      console.error('Create job template error:', error);
      return c.json({ success: false, error: 'Failed to create template' }, 500);
    }
  }
);

// PUT /api/v1/employer/templates/:id - Update job template
employer.put('/templates/:id', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', jobTemplateSchema.partial()),
  async (c) => {
    try {
      const templateId = c.req.param('id');
      const employerId = (c as any).userId;
      const templateData = c.req.valid('json');
      
      const employerService = new EmployerService();
      const template = await employerService.updateJobTemplate(templateId, templateData, employerId);
      
      return c.json({ 
        success: true, 
        data: template,
        message: 'Job template updated successfully'
      });
    } catch (error) {
      console.error('Update job template error:', error);
      return c.json({ success: false, error: 'Failed to update template' }, 500);
    }
  }
);

// DELETE /api/v1/employer/templates/:id - Delete job template
employer.delete('/templates/:id', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const templateId = c.req.param('id');
    const employerId = (c as any).userId;
    
    const employerService = new EmployerService();
    await employerService.deleteJobTemplate(templateId, employerId);
    
    return c.json({ 
      success: true, 
      message: 'Job template deleted successfully'
    });
  } catch (error) {
    console.error('Delete job template error:', error);
    return c.json({ success: false, error: 'Failed to delete template' }, 500);
  }
});

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

// GET /api/v1/employer/team - Get team members
employer.get('/team', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    
    const employerService = new EmployerService();
    const team = await employerService.getTeamMembers(employerId);
    
    return c.json({ success: true, data: team });
  } catch (error) {
    console.error('Get team members error:', error);
    return c.json({ success: false, error: 'Failed to get team members' }, 500);
  }
});

// POST /api/v1/employer/team/invite - Invite team member
employer.post('/team/invite', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const { email, role, permissions } = await c.req.json();
    
    const employerService = new EmployerService();
    const invitation = await employerService.inviteTeamMember(employerId, {
      email,
      role,
      permissions
    });
    
    return c.json({ 
      success: true, 
      data: invitation,
      message: 'Team member invitation sent successfully'
    }, 201);
  } catch (error) {
    console.error('Invite team member error:', error);
    return c.json({ success: false, error: 'Failed to send invitation' }, 500);
  }
});

// ============================================================================
// EXPORTS & REPORTS
// ============================================================================

// GET /api/v1/employer/export/applications - Export applications report
employer.get('/export/applications', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const format = c.req.query('format') || 'csv';
    const jobId = c.req.query('job_id');
    const status = c.req.query('status');
    const dateFrom = c.req.query('date_from');
    const dateTo = c.req.query('date_to');
    
    const employerService = new EmployerService();
    const exportData = await employerService.exportApplicationsReport(employerId, {
      format,
      jobId,
      status,
      dateFrom,
      dateTo
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `applications_report_${timestamp}.${format}`;
    
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Type', 
      format === 'csv' ? 'text/csv' : 
      format === 'pdf' ? 'application/pdf' : 
      'application/json'
    );
    
    return c.body(exportData);
  } catch (error) {
    console.error('Export applications report error:', error);
    return c.json({ success: false, error: 'Failed to export report' }, 500);
  }
});

// GET /api/v1/employer/export/analytics - Export analytics report
employer.get('/export/analytics', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const format = c.req.query('format') || 'pdf';
    const days = parseInt(c.req.query('days') || '30');
    
    const employerService = new EmployerService();
    const reportData = await employerService.exportAnalyticsReport(employerId, {
      format,
      days
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics_report_${timestamp}.${format}`;
    
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Type', 
      format === 'pdf' ? 'application/pdf' : 'application/json'
    );
    
    return c.body(reportData);
  } catch (error) {
    console.error('Export analytics report error:', error);
    return c.json({ success: false, error: 'Failed to export analytics report' }, 500);
  }
});

export default employer;