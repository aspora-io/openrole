import { eq, and, desc, asc, gte, lte, like, ilike, inArray, sql, count } from 'drizzle-orm';
import { db } from '../lib/database';
import { z } from 'zod';

// Job service for comprehensive job management
export class JobsService {
  
  // Create new job posting
  async createJob(jobData: {
    title: string;
    description: string;
    requirements?: string[];
    responsibilities?: string[];
    benefits?: string[];
    salary_min: number;
    salary_max: number;
    salary_currency?: string;
    salary_type?: string;
    equity_offered?: boolean;
    location_precise?: string;
    location_general?: string;
    remote_type?: string;
    employment_type: string;
    experience_level: string;
    department?: string;
    core_skills: string[];
    nice_to_have_skills?: string[];
    certifications_required?: string[];
    application_deadline?: string;
    external_application_url?: string;
    requires_cover_letter?: boolean;
    requires_portfolio?: boolean;
    custom_questions?: any[];
    featured?: boolean;
    urgent?: boolean;
    tags?: string[];
    posted_by: string;
    company_id?: string;
    status?: string;
  }) {
    try {
      // Generate slug from title
      const slug = this.generateSlug(jobData.title);
      
      // Get company_id from user if not provided
      let companyId = jobData.company_id;
      if (!companyId) {
        const userCompany = await db.query.companies.findFirst({
          where: eq(companies.created_by, jobData.posted_by)
        });
        companyId = userCompany?.id;
      }
      
      if (!companyId) {
        throw new Error('Company not found for user');
      }
      
      // Create job
      const [job] = await db.insert(jobs).values({
        ...jobData,
        company_id: companyId,
        slug,
        meta_description: this.generateMetaDescription(jobData.title, jobData.description),
        status: jobData.status || 'draft'
      }).returning();
      
      // Initialize analytics record
      await this.initializeJobAnalytics(job.id);
      
      return job;
    } catch (error) {
      console.error('Create job error:', error);
      throw new Error('Failed to create job posting');
    }
  }
  
  // Get job by ID with optional relations
  async getJobById(jobId: string, options: {
    includeCompany?: boolean;
    includeAnalytics?: boolean;
    includeApplications?: boolean;
  } = {}) {
    try {
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
        with: {
          company: options.includeCompany,
          posted_by_user: true
        }
      });
      
      if (!job) {
        return null;
      }
      
      // Add analytics if requested
      if (options.includeAnalytics) {
        const analytics = await this.getJobAnalytics(jobId);
        job.analytics = analytics;
      }
      
      // Add application count if requested
      if (options.includeApplications) {
        const applicationCount = await db.select({ count: count() })
          .from(application_pipeline)
          .where(eq(application_pipeline.job_id, jobId));
        
        job.application_count = applicationCount[0]?.count || 0;
      }
      
      return job;
    } catch (error) {
      console.error('Get job by ID error:', error);
      throw new Error('Failed to get job');
    }
  }
  
  // Update job posting
  async updateJob(jobId: string, updateData: Partial<any>, employerId: string) {
    try {
      // Verify job ownership
      await this.verifyJobOwnership(jobId, employerId);
      
      // Update slug if title changed
      if (updateData.title) {
        updateData.slug = this.generateSlug(updateData.title);
        updateData.meta_description = this.generateMetaDescription(
          updateData.title, 
          updateData.description || ''
        );
      }
      
      updateData.updated_at = new Date();
      
      const [updatedJob] = await db.update(jobs)
        .set(updateData)
        .where(eq(jobs.id, jobId))
        .returning();
      
      return updatedJob;
    } catch (error) {
      console.error('Update job error:', error);
      throw new Error('Failed to update job');
    }
  }
  
  // Delete job posting
  async deleteJob(jobId: string, employerId: string) {
    try {
      await this.verifyJobOwnership(jobId, employerId);
      
      // Check if job has applications
      const applicationCount = await db.select({ count: count() })
        .from(application_pipeline)
        .where(eq(application_pipeline.job_id, jobId));
      
      if (applicationCount[0]?.count > 0) {
        throw new Error('Cannot delete job with existing applications');
      }
      
      await db.delete(jobs).where(eq(jobs.id, jobId));
    } catch (error) {
      console.error('Delete job error:', error);
      throw error;
    }
  }
  
  // Publish draft job
  async publishJob(jobId: string, employerId: string) {
    try {
      await this.verifyJobOwnership(jobId, employerId);
      
      const [job] = await db.update(jobs)
        .set({ 
          status: 'active',
          updated_at: new Date()
        })
        .where(and(
          eq(jobs.id, jobId),
          eq(jobs.status, 'draft')
        ))
        .returning();
      
      if (!job) {
        throw new Error('Job not found or not in draft status');
      }
      
      return job;
    } catch (error) {
      console.error('Publish job error:', error);
      throw error;
    }
  }
  
  // Pause active job
  async pauseJob(jobId: string, employerId: string) {
    try {
      await this.verifyJobOwnership(jobId, employerId);
      
      const [job] = await db.update(jobs)
        .set({ 
          status: 'paused',
          updated_at: new Date()
        })
        .where(and(
          eq(jobs.id, jobId),
          eq(jobs.status, 'active')
        ))
        .returning();
      
      if (!job) {
        throw new Error('Job not found or not active');
      }
      
      return job;
    } catch (error) {
      console.error('Pause job error:', error);
      throw error;
    }
  }
  
  // Clone existing job
  async cloneJob(jobId: string, employerId: string) {
    try {
      const originalJob = await this.getJobById(jobId);
      if (!originalJob) {
        throw new Error('Original job not found');
      }
      
      // Verify ownership
      await this.verifyJobOwnership(jobId, employerId);
      
      // Create new job from original
      const cloneData = {
        ...originalJob,
        title: `${originalJob.title} (Copy)`,
        status: 'draft',
        posted_by: employerId,
        view_count: 0,
        application_count: 0,
        filled_at: null
      };
      
      // Remove fields that shouldn't be cloned
      delete cloneData.id;
      delete cloneData.created_at;
      delete cloneData.updated_at;
      delete cloneData.slug;
      delete cloneData.meta_description;
      
      return await this.createJob(cloneData);
    } catch (error) {
      console.error('Clone job error:', error);
      throw error;
    }
  }
  
  // Get employer's jobs
  async getEmployerJobs(employerId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    sort?: string;
    includeAnalytics?: boolean;
  } = {}) {
    try {
      const { page = 1, limit = 20, status, sort = 'created_at' } = options;
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = [eq(jobs.posted_by, employerId)];
      if (status) {
        whereConditions.push(eq(jobs.status, status));
      }
      
      // Build order by
      const orderBy = this.buildJobsOrderBy(sort);
      
      const employerJobs = await db.query.jobs.findMany({
        where: and(...whereConditions),
        orderBy,
        limit,
        offset,
        with: {
          company: true
        }
      });
      
      // Get total count
      const totalCount = await db.select({ count: count() })
        .from(jobs)
        .where(and(...whereConditions));
      
      return {
        jobs: employerJobs,
        total: totalCount[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
      };
    } catch (error) {
      console.error('Get employer jobs error:', error);
      throw new Error('Failed to get employer jobs');
    }
  }
  
  // Track job view
  async trackJobView(jobId: string, viewData: {
    user_id?: string;
    session_id: string;
    user_agent: string;
    ip_address: string;
    referrer?: string;
  }) {
    try {
      // Insert view record
      await db.insert(job_views).values({
        job_id: jobId,
        ...viewData,
        viewed_at: new Date()
      });
      
      // Update daily analytics
      await this.updateDailyJobAnalytics(jobId, 'view');
      
    } catch (error) {
      console.error('Track job view error:', error);
      // Don't throw error for analytics failures
    }
  }
  
  // Save job for candidate
  async saveJob(candidateId: string, jobId: string) {
    try {
      await db.insert(saved_jobs).values({
        candidate_id: candidateId,
        job_id: jobId
      });
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('Job already saved');
      }
      console.error('Save job error:', error);
      throw new Error('Failed to save job');
    }
  }
  
  // Remove saved job
  async unsaveJob(candidateId: string, jobId: string) {
    try {
      await db.delete(saved_jobs)
        .where(and(
          eq(saved_jobs.candidate_id, candidateId),
          eq(saved_jobs.job_id, jobId)
        ));
    } catch (error) {
      console.error('Unsave job error:', error);
      throw new Error('Failed to remove saved job');
    }
  }
  
  // Get candidate's saved jobs
  async getSavedJobs(candidateId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      const savedJobsList = await db.query.saved_jobs.findMany({
        where: eq(saved_jobs.candidate_id, candidateId),
        orderBy: desc(saved_jobs.saved_at),
        limit,
        offset,
        with: {
          job: {
            with: {
              company: true
            }
          }
        }
      });
      
      const total = await db.select({ count: count() })
        .from(saved_jobs)
        .where(eq(saved_jobs.candidate_id, candidateId));
      
      return {
        saved_jobs: savedJobsList,
        total: total[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((total[0]?.count || 0) / limit)
      };
    } catch (error) {
      console.error('Get saved jobs error:', error);
      throw new Error('Failed to get saved jobs');
    }
  }
  
  // Get job analytics
  async getJobAnalytics(jobId: string, employerId?: string, days: number = 30) {
    try {
      if (employerId) {
        await this.verifyJobOwnership(jobId, employerId);
      }
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const analytics = await db.query.job_analytics.findMany({
        where: and(
          eq(job_analytics.job_id, jobId),
          gte(job_analytics.date, startDate),
          lte(job_analytics.date, endDate)
        ),
        orderBy: desc(job_analytics.date)
      });
      
      // Calculate totals
      const totals = analytics.reduce((acc, day) => ({
        views: acc.views + day.views,
        unique_views: acc.unique_views + day.unique_views,
        applications: acc.applications + day.applications,
        qualified_applications: acc.qualified_applications + day.qualified_applications
      }), { views: 0, unique_views: 0, applications: 0, qualified_applications: 0 });
      
      return {
        daily_analytics: analytics,
        totals,
        conversion_rate: totals.views > 0 ? (totals.applications / totals.views * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Get job analytics error:', error);
      throw new Error('Failed to get job analytics');
    }
  }
  
  // Bulk job actions
  async bulkJobAction(jobIds: string[], action: string, data: any = {}, employerId: string) {
    try {
      // Verify ownership of all jobs
      for (const jobId of jobIds) {
        await this.verifyJobOwnership(jobId, employerId);
      }
      
      let updateData: any = { updated_at: new Date() };
      
      switch (action) {
        case 'publish':
          updateData.status = 'active';
          break;
        case 'pause':
          updateData.status = 'paused';
          break;
        case 'archive':
          updateData.status = 'expired';
          break;
        case 'feature':
          updateData.featured = true;
          break;
        case 'unfeature':
          updateData.featured = false;
          break;
        case 'mark_urgent':
          updateData.urgent = true;
          break;
        case 'unmark_urgent':
          updateData.urgent = false;
          break;
        case 'update_deadline':
          if (data.application_deadline) {
            updateData.application_deadline = data.application_deadline;
          }
          break;
        default:
          throw new Error('Invalid bulk action');
      }
      
      const results = await db.update(jobs)
        .set(updateData)
        .where(inArray(jobs.id, jobIds))
        .returning({ id: jobs.id });
      
      return {
        updated: results.length,
        action,
        job_ids: results.map(r => r.id)
      };
    } catch (error) {
      console.error('Bulk job action error:', error);
      throw error;
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
  
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  private generateMetaDescription(title: string, description: string): string {
    const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
    const maxLength = 160;
    
    if (cleanDescription.length <= maxLength) {
      return cleanDescription;
    }
    
    return cleanDescription.substring(0, maxLength - 3) + '...';
  }
  
  private buildJobsOrderBy(sort: string) {
    switch (sort) {
      case 'title':
        return asc(jobs.title);
      case 'salary_min':
        return desc(jobs.salary_min);
      case 'salary_max':
        return desc(jobs.salary_max);
      case 'application_count':
        return desc(jobs.application_count);
      case 'view_count':
        return desc(jobs.view_count);
      case 'updated_at':
        return desc(jobs.updated_at);
      case 'created_at':
      default:
        return desc(jobs.created_at);
    }
  }
  
  private async initializeJobAnalytics(jobId: string) {
    try {
      await db.insert(job_analytics).values({
        job_id: jobId,
        date: new Date(),
        views: 0,
        unique_views: 0,
        applications: 0,
        qualified_applications: 0
      });
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message.includes('duplicate')) {
        console.error('Initialize job analytics error:', error);
      }
    }
  }
  
  private async updateDailyJobAnalytics(jobId: string, type: 'view' | 'application') {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const updateData = type === 'view' 
        ? { views: sql`views + 1` }
        : { applications: sql`applications + 1` };
      
      await db.insert(job_analytics)
        .values({
          job_id: jobId,
          date: today,
          ...updateData
        })
        .onConflictDoUpdate({
          target: [job_analytics.job_id, job_analytics.date],
          set: updateData
        });
    } catch (error) {
      console.error('Update daily analytics error:', error);
    }
  }
}

// Import necessary database schemas (these would be defined in your database schema file)
const { jobs, companies, job_analytics, saved_jobs, job_views, application_pipeline } = {} as any;