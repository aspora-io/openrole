import { eq, and, desc, asc, gte, lte, inArray, sql, count, or } from 'drizzle-orm';
import { db } from '../lib/database';

// Comprehensive application management service with ATS functionality
export class ApplicationsService {
  
  // Create new job application
  async createApplication(applicationData: {
    job_id: string;
    candidate_id: string;
    cv_document_id?: string;
    cover_letter?: string;
    portfolio_items?: string[];
    custom_responses?: Record<string, any>;
  }) {
    try {
      // Check if candidate already applied to this job
      const existingApplication = await db.query.application_pipeline.findFirst({
        where: and(
          eq(application_pipeline.job_id, applicationData.job_id),
          eq(application_pipeline.candidate_id, applicationData.candidate_id)
        )
      });
      
      if (existingApplication) {
        throw new Error('You have already applied to this job');
      }
      
      // Get candidate profile ID if available
      const candidateProfile = await db.query.candidate_profiles.findFirst({
        where: eq(candidate_profiles.user_id, applicationData.candidate_id)
      });
      
      // Create application
      const [application] = await db.insert(application_pipeline).values({
        ...applicationData,
        profile_id: candidateProfile?.id,
        status: 'submitted',
        applied_at: new Date()
      }).returning();
      
      // Update job application count
      await db.update(jobs)
        .set({ application_count: sql`application_count + 1` })
        .where(eq(jobs.id, applicationData.job_id));
      
      // Update daily analytics
      await this.updateJobAnalytics(applicationData.job_id, 'application');
      
      // Send notification to employer (implement as needed)
      await this.sendApplicationNotification(application);
      
      return application;
    } catch (error) {
      console.error('Create application error:', error);
      throw error;
    }
  }
  
  // Get application by ID with permission checking
  async getApplicationById(applicationId: string, options: {
    userId: string;
    userRole: string;
    includePrivateNotes?: boolean;
  }) {
    try {
      const application = await db.query.application_pipeline.findFirst({
        where: eq(application_pipeline.id, applicationId),
        with: {
          job: {
            with: {
              company: true
            }
          },
          candidate: {
            columns: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          profile: true,
          cv_document: true
        }
      });
      
      if (!application) {
        return null;
      }
      
      // Permission checking
      const canView = await this.checkApplicationViewPermission(
        application, 
        options.userId, 
        options.userRole
      );
      
      if (!canView) {
        throw new Error('Access denied');
      }
      
      // Remove sensitive data for candidates
      if (options.userRole === 'candidate' && !options.includePrivateNotes) {
        delete application.recruiter_rating;
        delete application.hiring_manager_rating;
        delete application.technical_score;
        delete application.culture_fit_score;
        delete application.interview_notes;
      }
      
      return application;
    } catch (error) {
      console.error('Get application by ID error:', error);
      throw error;
    }
  }
  
  // Get candidate's applications
  async getCandidateApplications(candidateId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;
      
      const whereConditions = [eq(application_pipeline.candidate_id, candidateId)];
      if (status) {
        whereConditions.push(eq(application_pipeline.status, status));
      }
      
      const applications = await db.query.application_pipeline.findMany({
        where: and(...whereConditions),
        orderBy: desc(application_pipeline.applied_at),
        limit,
        offset,
        with: {
          job: {
            with: {
              company: {
                columns: {
                  id: true,
                  name: true,
                  logo_url: true,
                  verified: true
                }
              }
            }
          }
        }
      });
      
      const total = await db.select({ count: count() })
        .from(application_pipeline)
        .where(and(...whereConditions));
      
      return {
        applications,
        total: total[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((total[0]?.count || 0) / limit)
      };
    } catch (error) {
      console.error('Get candidate applications error:', error);
      throw new Error('Failed to get applications');
    }
  }
  
  // Get job applications for employer
  async getJobApplications(jobId: string, options: {
    employerId: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      // Verify job ownership
      await this.verifyJobOwnership(jobId, options.employerId);
      
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;
      
      const whereConditions = [eq(application_pipeline.job_id, jobId)];
      if (status) {
        whereConditions.push(eq(application_pipeline.status, status));
      }
      
      const applications = await db.query.application_pipeline.findMany({
        where: and(...whereConditions),
        orderBy: desc(application_pipeline.applied_at),
        limit,
        offset,
        with: {
          candidate: {
            columns: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          profile: true,
          cv_document: true
        }
      });
      
      const total = await db.select({ count: count() })
        .from(application_pipeline)
        .where(and(...whereConditions));
      
      return {
        applications,
        total: total[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((total[0]?.count || 0) / limit)
      };
    } catch (error) {
      console.error('Get job applications error:', error);
      throw error;
    }
  }
  
  // Get all employer applications across jobs
  async getEmployerApplications(employerId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
    sort?: string;
  } = {}) {
    try {
      const { page = 1, limit = 20, status, jobId, sort = 'applied_at' } = options;
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = [
        sql`EXISTS (
          SELECT 1 FROM ${jobs} j 
          WHERE j.id = ${application_pipeline.job_id} 
          AND j.posted_by = ${employerId}
        )`
      ];
      
      if (status) {
        whereConditions.push(eq(application_pipeline.status, status));
      }
      
      if (jobId) {
        whereConditions.push(eq(application_pipeline.job_id, jobId));
      }
      
      // Build order by
      const orderBy = this.buildApplicationsOrderBy(sort);
      
      const applications = await db.query.application_pipeline.findMany({
        where: and(...whereConditions),
        orderBy,
        limit,
        offset,
        with: {
          job: {
            columns: {
              id: true,
              title: true,
              department: true
            }
          },
          candidate: {
            columns: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          profile: true
        }
      });
      
      const total = await db.select({ count: count() })
        .from(application_pipeline)
        .where(and(...whereConditions));
      
      return {
        applications,
        total: total[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((total[0]?.count || 0) / limit)
      };
    } catch (error) {
      console.error('Get employer applications error:', error);
      throw new Error('Failed to get employer applications');
    }
  }
  
  // Update application status with workflow validation
  async updateApplicationStatus(
    applicationId: string,
    statusData: {
      status: string;
      notes?: string;
      interview_type?: string;
      interview_scheduled_at?: string;
      rejection_reason?: string;
      rejection_feedback?: string;
      feedback_shared_with_candidate?: boolean;
    },
    employerId: string
  ) {
    try {
      // Get current application
      const application = await db.query.application_pipeline.findFirst({
        where: eq(application_pipeline.id, applicationId),
        with: { job: true }
      });
      
      if (!application) {
        throw new Error('Application not found');
      }
      
      // Verify job ownership
      await this.verifyJobOwnership(application.job_id, employerId);
      
      // Validate status transition
      this.validateStatusTransition(application.status, statusData.status);
      
      // Update application
      const updateData: any = {
        status: statusData.status,
        status_updated_at: new Date(),
        status_updated_by: employerId,
        updated_at: new Date()
      };
      
      // Add interview data if provided
      if (statusData.interview_type) {
        updateData.interview_type = statusData.interview_type;
      }
      if (statusData.interview_scheduled_at) {
        updateData.interview_scheduled_at = new Date(statusData.interview_scheduled_at);
      }
      
      // Add rejection data if provided
      if (statusData.rejection_reason) {
        updateData.rejection_reason = statusData.rejection_reason;
      }
      if (statusData.rejection_feedback) {
        updateData.rejection_feedback = statusData.rejection_feedback;
        updateData.feedback_shared_with_candidate = statusData.feedback_shared_with_candidate || false;
      }
      
      const [updatedApplication] = await db.update(application_pipeline)
        .set(updateData)
        .where(eq(application_pipeline.id, applicationId))
        .returning();
      
      // Create status history record
      await this.createStatusHistoryRecord(applicationId, {
        from_status: application.status,
        to_status: statusData.status,
        notes: statusData.notes,
        updated_by: employerId
      });
      
      // Send candidate notification if status changed
      if (application.status !== statusData.status) {
        await this.sendStatusUpdateNotification(updatedApplication);
      }
      
      return updatedApplication;
    } catch (error) {
      console.error('Update application status error:', error);
      throw error;
    }
  }
  
  // Withdraw application (candidate only)
  async withdrawApplication(applicationId: string, candidateId: string) {
    try {
      const application = await db.query.application_pipeline.findFirst({
        where: and(
          eq(application_pipeline.id, applicationId),
          eq(application_pipeline.candidate_id, candidateId)
        )
      });
      
      if (!application) {
        throw new Error('Application not found or access denied');
      }
      
      // Can only withdraw if not yet hired
      if (application.status === 'hired') {
        throw new Error('Cannot withdraw application after being hired');
      }
      
      await db.update(application_pipeline)
        .set({
          status: 'withdrawn',
          status_updated_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(application_pipeline.id, applicationId));
      
    } catch (error) {
      console.error('Withdraw application error:', error);
      throw error;
    }
  }
  
  // Add feedback to application
  async addApplicationFeedback(
    applicationId: string,
    feedbackData: {
      feedback_type: string;
      rating?: number;
      score?: number;
      notes: string;
      private_notes?: string;
    },
    employerId: string
  ) {
    try {
      // Verify permission
      const application = await db.query.application_pipeline.findFirst({
        where: eq(application_pipeline.id, applicationId),
        with: { job: true }
      });
      
      if (!application) {
        throw new Error('Application not found');
      }
      
      await this.verifyJobOwnership(application.job_id, employerId);
      
      // Update application with feedback
      const updateData: any = { updated_at: new Date() };
      
      switch (feedbackData.feedback_type) {
        case 'recruiter':
          updateData.recruiter_rating = feedbackData.rating;
          break;
        case 'hiring_manager':
          updateData.hiring_manager_rating = feedbackData.rating;
          break;
        case 'technical':
          updateData.technical_score = feedbackData.score;
          break;
        case 'culture_fit':
          updateData.culture_fit_score = feedbackData.rating;
          break;
      }
      
      if (feedbackData.notes) {
        updateData.interview_notes = feedbackData.notes;
      }
      
      const [updatedApplication] = await db.update(application_pipeline)
        .set(updateData)
        .where(eq(application_pipeline.id, applicationId))
        .returning();
      
      // Create feedback history record
      await this.createFeedbackRecord(applicationId, {
        ...feedbackData,
        given_by: employerId
      });
      
      return updatedApplication;
    } catch (error) {
      console.error('Add application feedback error:', error);
      throw new Error('Failed to add feedback');
    }
  }
  
  // Get application pipeline view for employer dashboard
  async getApplicationPipeline(options: {
    employerId: string;
    jobId?: string;
  }) {
    try {
      // Build where conditions
      const whereConditions = [
        sql`EXISTS (
          SELECT 1 FROM ${jobs} j 
          WHERE j.id = ${application_pipeline.job_id} 
          AND j.posted_by = ${options.employerId}
        )`
      ];
      
      if (options.jobId) {
        whereConditions.push(eq(application_pipeline.job_id, options.jobId));
      }
      
      // Get applications grouped by status
      const pipeline = await db.select({
        status: application_pipeline.status,
        count: count(),
        applications: sql`json_agg(
          json_build_object(
            'id', ${application_pipeline.id},
            'candidate_name', CONCAT(${users.first_name}, ' ', ${users.last_name}),
            'job_title', ${jobs.title},
            'applied_at', ${application_pipeline.applied_at},
            'rating', ${application_pipeline.recruiter_rating}
          ) ORDER BY ${application_pipeline.applied_at} DESC
        )`
      })
      .from(application_pipeline)
      .leftJoin(users, eq(application_pipeline.candidate_id, users.id))
      .leftJoin(jobs, eq(application_pipeline.job_id, jobs.id))
      .where(and(...whereConditions))
      .groupBy(application_pipeline.status);
      
      // Format pipeline data
      const pipelineStages = [
        'submitted', 'screening', 'phone_interview', 'technical_interview',
        'final_interview', 'reference_check', 'offer_extended', 'hired', 'rejected'
      ];
      
      const formattedPipeline = pipelineStages.map(stage => {
        const stageData = pipeline.find(p => p.status === stage);
        return {
          stage,
          count: stageData?.count || 0,
          applications: stageData?.applications || []
        };
      });
      
      return formattedPipeline;
    } catch (error) {
      console.error('Get application pipeline error:', error);
      throw new Error('Failed to get application pipeline');
    }
  }
  
  // Bulk update applications
  async bulkUpdateApplications(bulkData: {
    application_ids: string[];
    action: string;
    data?: any;
  }, employerId: string) {
    try {
      // Verify all applications belong to employer's jobs
      for (const appId of bulkData.application_ids) {
        const app = await db.query.application_pipeline.findFirst({
          where: eq(application_pipeline.id, appId),
          with: { job: true }
        });
        
        if (!app || app.job.posted_by !== employerId) {
          throw new Error('Invalid application ID or access denied');
        }
      }
      
      let updateData: any = { updated_at: new Date() };
      
      switch (bulkData.action) {
        case 'reject':
          updateData.status = 'rejected';
          updateData.rejection_reason = bulkData.data?.rejection_reason || 'Bulk rejection';
          break;
        case 'advance':
          updateData.status = bulkData.data?.status || 'screening';
          break;
        case 'schedule_interview':
          updateData.status = 'phone_interview';
          updateData.interview_type = bulkData.data?.interview_type || 'phone';
          updateData.interview_scheduled_at = bulkData.data?.interview_scheduled_at;
          break;
        case 'mark_as_reviewed':
          updateData.status = 'screening';
          break;
        default:
          throw new Error('Invalid bulk action');
      }
      
      const results = await db.update(application_pipeline)
        .set(updateData)
        .where(inArray(application_pipeline.id, bulkData.application_ids))
        .returning({ id: application_pipeline.id });
      
      return {
        updated: results.length,
        action: bulkData.action,
        application_ids: results.map(r => r.id)
      };
    } catch (error) {
      console.error('Bulk update applications error:', error);
      throw error;
    }
  }
  
  // Get candidate application statistics
  async getCandidateApplicationStats(candidateId: string) {
    try {
      const stats = await db.select({
        total: count(),
        submitted: count(sql`CASE WHEN ${application_pipeline.status} = 'submitted' THEN 1 END`),
        in_progress: count(sql`CASE WHEN ${application_pipeline.status} IN ('screening', 'phone_interview', 'technical_interview', 'final_interview', 'reference_check') THEN 1 END`),
        offers: count(sql`CASE WHEN ${application_pipeline.status} = 'offer_extended' THEN 1 END`),
        hired: count(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 END`),
        rejected: count(sql`CASE WHEN ${application_pipeline.status} = 'rejected' THEN 1 END`),
        withdrawn: count(sql`CASE WHEN ${application_pipeline.status} = 'withdrawn' THEN 1 END`)
      })
      .from(application_pipeline)
      .where(eq(application_pipeline.candidate_id, candidateId));
      
      return stats[0];
    } catch (error) {
      console.error('Get candidate application stats error:', error);
      throw new Error('Failed to get application statistics');
    }
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private async verifyJobOwnership(jobId: string, employerId: string) {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      columns: { posted_by: true }
    });
    
    if (!job || job.posted_by !== employerId) {
      throw new Error('Job not found or access denied');
    }
  }
  
  private async checkApplicationViewPermission(
    application: any,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // Candidates can view their own applications
    if (userRole === 'candidate' && application.candidate_id === userId) {
      return true;
    }
    
    // Employers can view applications for their jobs
    if (userRole === 'employer' && application.job.posted_by === userId) {
      return true;
    }
    
    // Admins can view all applications
    if (userRole === 'admin') {
      return true;
    }
    
    return false;
  }
  
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      'submitted': ['screening', 'rejected'],
      'screening': ['phone_interview', 'rejected'],
      'phone_interview': ['technical_interview', 'final_interview', 'rejected'],
      'technical_interview': ['final_interview', 'rejected'],
      'final_interview': ['reference_check', 'offer_extended', 'rejected'],
      'reference_check': ['offer_extended', 'rejected'],
      'offer_extended': ['hired', 'rejected'],
      'hired': [], // Terminal state
      'rejected': [], // Terminal state
      'withdrawn': [] // Terminal state
    };
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
  
  private buildApplicationsOrderBy(sort: string) {
    switch (sort) {
      case 'name':
        return asc(users.last_name);
      case 'job_title':
        return asc(jobs.title);
      case 'status':
        return asc(application_pipeline.status);
      case 'rating':
        return desc(application_pipeline.recruiter_rating);
      case 'applied_at':
      default:
        return desc(application_pipeline.applied_at);
    }
  }
  
  private async updateJobAnalytics(jobId: string, type: 'application') {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await db.insert(job_analytics)
        .values({
          job_id: jobId,
          date: today,
          applications: 1
        })
        .onConflictDoUpdate({
          target: [job_analytics.job_id, job_analytics.date],
          set: { applications: sql`applications + 1` }
        });
    } catch (error) {
      console.error('Update job analytics error:', error);
    }
  }
  
  private async createStatusHistoryRecord(applicationId: string, historyData: any) {
    // Implementation would create a status history record
    // This is a placeholder for the actual implementation
  }
  
  private async createFeedbackRecord(applicationId: string, feedbackData: any) {
    // Implementation would create a feedback history record
    // This is a placeholder for the actual implementation
  }
  
  private async sendApplicationNotification(application: any) {
    // Implementation would send email/notification to employer
    // This is a placeholder for the actual implementation
  }
  
  private async sendStatusUpdateNotification(application: any) {
    // Implementation would send email/notification to candidate
    // This is a placeholder for the actual implementation
  }
}

// Import necessary database schemas
const { 
  application_pipeline, 
  jobs, 
  users, 
  candidate_profiles, 
  job_analytics 
} = {} as any;