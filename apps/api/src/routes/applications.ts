import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateInput } from '../middleware/validation';
import { rateLimitPresets } from '../middleware/rate-limit';
import { ApplicationsService } from '../services/applications.service';

const applications = new Hono();

// Apply rate limiting
applications.use('/*', rateLimitPresets.applications);

// Application status update schema
const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'submitted', 'screening', 'phone_interview', 'technical_interview',
    'final_interview', 'reference_check', 'offer_extended', 
    'hired', 'rejected', 'withdrawn'
  ]),
  notes: z.string().optional(),
  interview_type: z.enum(['phone', 'video', 'in_person', 'technical']).optional(),
  interview_scheduled_at: z.string().datetime().optional(),
  rejection_reason: z.string().optional(),
  rejection_feedback: z.string().optional(),
  feedback_shared_with_candidate: z.boolean().default(false)
});

// Application feedback schema
const addFeedbackSchema = z.object({
  feedback_type: z.enum(['recruiter', 'hiring_manager', 'technical', 'culture_fit']),
  rating: z.number().min(1).max(5).optional(),
  score: z.number().min(1).max(100).optional(),
  notes: z.string(),
  private_notes: z.string().optional()
});

// Bulk action schema
const bulkActionSchema = z.object({
  application_ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['reject', 'advance', 'schedule_interview', 'mark_as_reviewed']),
  data: z.object({
    status: z.string().optional(),
    rejection_reason: z.string().optional(),
    interview_type: z.string().optional(),
    interview_scheduled_at: z.string().datetime().optional(),
    notes: z.string().optional()
  }).optional()
});

// ============================================================================
// CANDIDATE ENDPOINTS
// ============================================================================

// GET /api/v1/applications - Get candidate's applications
applications.get('/', requireAuth, requireRole(['candidate']), async (c) => {
  try {
    const candidateId = (c as any).userId;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    
    const applicationsService = new ApplicationsService();
    const candidateApplications = await applicationsService.getCandidateApplications(candidateId, {
      page,
      limit,
      status
    });
    
    return c.json({ success: true, data: candidateApplications });
  } catch (error) {
    console.error('Get candidate applications error:', error);
    return c.json({ success: false, error: 'Failed to get applications' }, 500);
  }
});

// GET /api/v1/applications/:id - Get single application details
applications.get('/:id', requireAuth, async (c) => {
  try {
    const applicationId = c.req.param('id');
    const userId = (c as any).userId;
    const userRole = (c as any).userRole;
    
    const applicationsService = new ApplicationsService();
    const application = await applicationsService.getApplicationById(applicationId, {
      userId,
      userRole,
      includePrivateNotes: userRole === 'employer' || userRole === 'admin'
    });
    
    if (!application) {
      return c.json({ success: false, error: 'Application not found' }, 404);
    }
    
    return c.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application error:', error);
    if (error.message.includes('permission')) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }
    return c.json({ success: false, error: 'Failed to get application' }, 500);
  }
});

// DELETE /api/v1/applications/:id - Withdraw application (candidate only)
applications.delete('/:id', requireAuth, requireRole(['candidate']), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const candidateId = (c as any).userId;
    
    const applicationsService = new ApplicationsService();
    await applicationsService.withdrawApplication(applicationId, candidateId);
    
    return c.json({ 
      success: true, 
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return c.json({ success: false, error: 'Application not found or access denied' }, 404);
    }
    return c.json({ success: false, error: 'Failed to withdraw application' }, 500);
  }
});

// GET /api/v1/applications/stats - Get candidate application statistics
applications.get('/stats', requireAuth, requireRole(['candidate']), async (c) => {
  try {
    const candidateId = (c as any).userId;
    
    const applicationsService = new ApplicationsService();
    const stats = await applicationsService.getCandidateApplicationStats(candidateId);
    
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get application stats error:', error);
    return c.json({ success: false, error: 'Failed to get application statistics' }, 500);
  }
});

// ============================================================================
// EMPLOYER ENDPOINTS
// ============================================================================

// PUT /api/v1/applications/:id/status - Update application status (employer only)
applications.put('/:id/status', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', updateApplicationStatusSchema),
  async (c) => {
    try {
      const applicationId = c.req.param('id');
      const statusData = c.req.valid('json');
      const employerId = (c as any).userId;
      
      const applicationsService = new ApplicationsService();
      const application = await applicationsService.updateApplicationStatus(
        applicationId, 
        statusData, 
        employerId
      );
      
      return c.json({ 
        success: true, 
        data: application,
        message: 'Application status updated successfully'
      });
    } catch (error) {
      console.error('Update application status error:', error);
      if (error.message.includes('not found') || error.message.includes('permission')) {
        return c.json({ success: false, error: 'Application not found or access denied' }, 404);
      }
      return c.json({ success: false, error: 'Failed to update application status' }, 500);
    }
  }
);

// POST /api/v1/applications/:id/feedback - Add feedback/notes to application
applications.post('/:id/feedback', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', addFeedbackSchema),
  async (c) => {
    try {
      const applicationId = c.req.param('id');
      const feedbackData = c.req.valid('json');
      const employerId = (c as any).userId;
      
      const applicationsService = new ApplicationsService();
      const feedback = await applicationsService.addApplicationFeedback(
        applicationId, 
        feedbackData, 
        employerId
      );
      
      return c.json({ 
        success: true, 
        data: feedback,
        message: 'Feedback added successfully'
      }, 201);
    } catch (error) {
      console.error('Add application feedback error:', error);
      return c.json({ success: false, error: 'Failed to add feedback' }, 500);
    }
  }
);

// GET /api/v1/applications/:id/feedback - Get application feedback history
applications.get('/:id/feedback', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const employerId = (c as any).userId;
    
    const applicationsService = new ApplicationsService();
    const feedback = await applicationsService.getApplicationFeedback(applicationId, employerId);
    
    return c.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Get application feedback error:', error);
    return c.json({ success: false, error: 'Failed to get feedback' }, 500);
  }
});

// POST /api/v1/applications/bulk-action - Bulk application actions
applications.post('/bulk-action', 
  requireAuth,
  requireRole(['employer', 'admin']),
  validateInput('json', bulkActionSchema),
  async (c) => {
    try {
      const bulkData = c.req.valid('json');
      const employerId = (c as any).userId;
      
      const applicationsService = new ApplicationsService();
      const results = await applicationsService.bulkUpdateApplications(bulkData, employerId);
      
      return c.json({ 
        success: true, 
        data: results,
        message: `Bulk action completed: ${results.updated} applications updated`
      });
    } catch (error) {
      console.error('Bulk application action error:', error);
      return c.json({ success: false, error: 'Failed to perform bulk action' }, 500);
    }
  }
);

// GET /api/v1/applications/analytics - Application analytics for employer
applications.get('/analytics', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const days = parseInt(c.req.query('days') || '30');
    const jobId = c.req.query('job_id');
    
    const applicationsService = new ApplicationsService();
    const analytics = await applicationsService.getApplicationAnalytics({
      employerId,
      days,
      jobId
    });
    
    return c.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get application analytics error:', error);
    return c.json({ success: false, error: 'Failed to get analytics' }, 500);
  }
});

// GET /api/v1/applications/pipeline - Application pipeline view
applications.get('/pipeline', requireAuth, requireRole(['employer', 'admin']), async (c) => {
  try {
    const employerId = (c as any).userId;
    const jobId = c.req.query('job_id');
    
    const applicationsService = new ApplicationsService();
    const pipeline = await applicationsService.getApplicationPipeline({
      employerId,
      jobId
    });
    
    return c.json({ success: true, data: pipeline });
  } catch (error) {
    console.error('Get application pipeline error:', error);
    return c.json({ success: false, error: 'Failed to get pipeline' }, 500);
  }
});

// POST /api/v1/applications/:id/schedule-interview - Schedule interview
applications.post('/:id/schedule-interview', 
  requireAuth,
  requireRole(['employer', 'admin']),
  async (c) => {
    try {
      const applicationId = c.req.param('id');
      const employerId = (c as any).userId;
      
      const { interview_type, scheduled_at, notes } = await c.req.json();
      
      const applicationsService = new ApplicationsService();
      const interview = await applicationsService.scheduleInterview(applicationId, {
        interview_type,
        scheduled_at,
        notes,
        scheduled_by: employerId
      });
      
      return c.json({ 
        success: true, 
        data: interview,
        message: 'Interview scheduled successfully'
      }, 201);
    } catch (error) {
      console.error('Schedule interview error:', error);
      return c.json({ success: false, error: 'Failed to schedule interview' }, 500);
    }
  }
);

// GET /api/v1/applications/:id/timeline - Get application timeline/history
applications.get('/:id/timeline', requireAuth, async (c) => {
  try {
    const applicationId = c.req.param('id');
    const userId = (c as any).userId;
    const userRole = (c as any).userRole;
    
    const applicationsService = new ApplicationsService();
    const timeline = await applicationsService.getApplicationTimeline(applicationId, {
      userId,
      userRole
    });
    
    return c.json({ success: true, data: timeline });
  } catch (error) {
    console.error('Get application timeline error:', error);
    return c.json({ success: false, error: 'Failed to get timeline' }, 500);
  }
});

// ============================================================================
// SHARED ENDPOINTS
// ============================================================================

// GET /api/v1/applications/export - Export applications (CSV/PDF)
applications.get('/export', requireAuth, async (c) => {
  try {
    const userId = (c as any).userId;
    const userRole = (c as any).userRole;
    const format = c.req.query('format') || 'csv';
    const jobId = c.req.query('job_id');
    const status = c.req.query('status');
    
    if (!['csv', 'pdf', 'json'].includes(format)) {
      return c.json({ success: false, error: 'Invalid export format' }, 400);
    }
    
    const applicationsService = new ApplicationsService();
    const exportData = await applicationsService.exportApplications({
      userId,
      userRole,
      format,
      jobId,
      status
    });
    
    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `applications_${timestamp}.${format}`;
    
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Type', 
      format === 'csv' ? 'text/csv' : 
      format === 'pdf' ? 'application/pdf' : 
      'application/json'
    );
    
    return c.body(exportData);
  } catch (error) {
    console.error('Export applications error:', error);
    return c.json({ success: false, error: 'Failed to export applications' }, 500);
  }
});

export default applications;