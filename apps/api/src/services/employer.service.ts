import { eq, and, desc, asc, gte, lte, sql, count, avg, sum } from 'drizzle-orm';
import { db } from '../lib/database';

// Comprehensive employer service for dashboard and hiring management
export class EmployerService {
  
  // Get comprehensive dashboard overview
  async getDashboardOverview(employerId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get employer's jobs
      const employerJobs = await db.query.jobs.findMany({
        where: eq(jobs.posted_by, employerId),
        columns: { id: true, status: true }
      });
      
      const jobIds = employerJobs.map(job => job.id);
      
      if (jobIds.length === 0) {
        return this.getEmptyDashboard();
      }
      
      // Parallel data fetching for performance
      const [
        jobStats,
        applicationStats,
        recentApplications,
        topPerformingJobs,
        hiringMetrics,
        pipelineStats
      ] = await Promise.all([
        this.getJobStats(employerId),
        this.getApplicationStats(jobIds, startDate, endDate),
        this.getRecentApplications(jobIds, 5),
        this.getTopPerformingJobs(jobIds, days),
        this.getHiringMetrics(jobIds, days),
        this.getPipelineStats(jobIds)
      ]);
      
      return {
        overview: {
          period_days: days,
          total_jobs: jobStats.total,
          active_jobs: jobStats.active,
          total_applications: applicationStats.total,
          new_applications: applicationStats.new_applications,
          applications_this_week: applicationStats.applications_this_week,
          response_rate: applicationStats.response_rate,
          time_to_hire: hiringMetrics.avg_time_to_hire,
          offers_extended: hiringMetrics.offers_extended,
          hires_made: hiringMetrics.hires_made
        },
        job_statistics: jobStats,
        application_statistics: applicationStats,
        recent_applications: recentApplications,
        top_performing_jobs: topPerformingJobs,
        hiring_metrics: hiringMetrics,
        pipeline_statistics: pipelineStats
      };
    } catch (error) {
      console.error('Get dashboard overview error:', error);
      throw new Error('Failed to get dashboard overview');
    }
  }
  
  // Get employer statistics
  async getEmployerStats(employerId: string) {
    try {
      const [
        jobCounts,
        applicationCounts,
        companyInfo
      ] = await Promise.all([
        // Job statistics
        db.select({
          total: count(),
          active: count(sql`CASE WHEN ${jobs.status} = 'active' THEN 1 END`),
          draft: count(sql`CASE WHEN ${jobs.status} = 'draft' THEN 1 END`),
          paused: count(sql`CASE WHEN ${jobs.status} = 'paused' THEN 1 END`),
          filled: count(sql`CASE WHEN ${jobs.status} = 'filled' THEN 1 END`),
          expired: count(sql`CASE WHEN ${jobs.status} = 'expired' THEN 1 END`)
        })
        .from(jobs)
        .where(eq(jobs.posted_by, employerId)),
        
        // Application statistics
        db.select({
          total: count(),
          pending: count(sql`CASE WHEN ${application_pipeline.status} IN ('submitted', 'screening') THEN 1 END`),
          interviewing: count(sql`CASE WHEN ${application_pipeline.status} IN ('phone_interview', 'technical_interview', 'final_interview') THEN 1 END`),
          offers: count(sql`CASE WHEN ${application_pipeline.status} = 'offer_extended' THEN 1 END`),
          hired: count(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 END`),
          rejected: count(sql`CASE WHEN ${application_pipeline.status} = 'rejected' THEN 1 END`)
        })
        .from(application_pipeline)
        .where(sql`EXISTS (
          SELECT 1 FROM ${jobs} j 
          WHERE j.id = ${application_pipeline.job_id} 
          AND j.posted_by = ${employerId}
        )`),
        
        // Company information
        db.query.companies.findFirst({
          where: eq(companies.created_by, employerId)
        })
      ]);
      
      return {
        jobs: jobCounts[0],
        applications: applicationCounts[0],
        company: companyInfo
      };
    } catch (error) {
      console.error('Get employer stats error:', error);
      throw new Error('Failed to get employer statistics');
    }
  }
  
  // Get candidate pipeline
  async getCandidatePipeline(employerId: string, options: {
    stage?: string;
    jobId?: string;
  } = {}) {
    try {
      const whereConditions = [
        sql`EXISTS (
          SELECT 1 FROM ${jobs} j 
          WHERE j.id = ${application_pipeline.job_id} 
          AND j.posted_by = ${employerId}
        )`
      ];
      
      if (options.stage) {
        whereConditions.push(eq(application_pipeline.status, options.stage));
      }
      
      if (options.jobId) {
        whereConditions.push(eq(application_pipeline.job_id, options.jobId));
      }
      
      const candidates = await db.query.application_pipeline.findMany({
        where: and(...whereConditions),
        orderBy: desc(application_pipeline.applied_at),
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
          job: {
            columns: {
              id: true,
              title: true,
              department: true
            }
          }
        }
      });
      
      // Group by pipeline stage
      const pipelineStages = [
        'submitted', 'screening', 'phone_interview', 'technical_interview',
        'final_interview', 'reference_check', 'offer_extended', 'hired'
      ];
      
      const pipeline = pipelineStages.reduce((acc, stage) => {
        acc[stage] = candidates.filter(c => c.status === stage);
        return acc;
      }, {} as Record<string, any[]>);
      
      return {
        total_candidates: candidates.length,
        pipeline,
        stage_counts: Object.keys(pipeline).reduce((acc, stage) => {
          acc[stage] = pipeline[stage].length;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Get candidate pipeline error:', error);
      throw new Error('Failed to get candidate pipeline');
    }
  }
  
  // Get/Update company profile
  async getCompanyProfile(employerId: string) {
    try {
      const company = await db.query.companies.findFirst({
        where: eq(companies.created_by, employerId)
      });
      
      if (!company) {
        throw new Error('Company profile not found');
      }
      
      return company;
    } catch (error) {
      console.error('Get company profile error:', error);
      throw error;
    }
  }
  
  async updateCompanyProfile(employerId: string, updateData: any) {
    try {
      const company = await this.getCompanyProfile(employerId);
      
      const [updatedCompany] = await db.update(companies)
        .set({
          ...updateData,
          updated_at: new Date()
        })
        .where(eq(companies.id, company.id))
        .returning();
      
      return updatedCompany;
    } catch (error) {
      console.error('Update company profile error:', error);
      throw new Error('Failed to update company profile');
    }
  }
  
  // Job template management
  async getJobTemplates(employerId: string) {
    try {
      const templates = await db.query.job_templates.findMany({
        where: or(
          eq(job_templates.created_by, employerId),
          eq(job_templates.is_public, true)
        ),
        orderBy: desc(job_templates.created_at)
      });
      
      return templates;
    } catch (error) {
      console.error('Get job templates error:', error);
      throw new Error('Failed to get job templates');
    }
  }
  
  async createJobTemplate(employerId: string, templateData: {
    name: string;
    description?: string;
    template_data: any;
    is_public?: boolean;
  }) {
    try {
      const [template] = await db.insert(job_templates).values({
        ...templateData,
        created_by: employerId
      }).returning();
      
      return template;
    } catch (error) {
      console.error('Create job template error:', error);
      throw new Error('Failed to create job template');
    }
  }
  
  async updateJobTemplate(templateId: string, updateData: any, employerId: string) {
    try {
      // Verify ownership
      const template = await db.query.job_templates.findFirst({
        where: eq(job_templates.id, templateId)
      });
      
      if (!template || template.created_by !== employerId) {
        throw new Error('Template not found or access denied');
      }
      
      const [updatedTemplate] = await db.update(job_templates)
        .set({
          ...updateData,
          updated_at: new Date()
        })
        .where(eq(job_templates.id, templateId))
        .returning();
      
      return updatedTemplate;
    } catch (error) {
      console.error('Update job template error:', error);
      throw error;
    }
  }
  
  async deleteJobTemplate(templateId: string, employerId: string) {
    try {
      const template = await db.query.job_templates.findFirst({
        where: eq(job_templates.id, templateId)
      });
      
      if (!template || template.created_by !== employerId) {
        throw new Error('Template not found or access denied');
      }
      
      await db.delete(job_templates).where(eq(job_templates.id, templateId));
    } catch (error) {
      console.error('Delete job template error:', error);
      throw error;
    }
  }
  
  // Team management
  async getTeamMembers(employerId: string) {
    try {
      const company = await this.getCompanyProfile(employerId);
      
      const teamMembers = await db.query.team_members.findMany({
        where: eq(team_members.company_id, company.id),
        with: {
          user: {
            columns: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });
      
      return teamMembers;
    } catch (error) {
      console.error('Get team members error:', error);
      throw new Error('Failed to get team members');
    }
  }
  
  async inviteTeamMember(employerId: string, inviteData: {
    email: string;
    role: string;
    permissions: string[];
  }) {
    try {
      const company = await this.getCompanyProfile(employerId);
      
      // Create invitation record
      const [invitation] = await db.insert(team_invitations).values({
        company_id: company.id,
        invited_by: employerId,
        email: inviteData.email,
        role: inviteData.role,
        permissions: inviteData.permissions,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }).returning();
      
      // Send invitation email (implement as needed)
      await this.sendTeamInvitationEmail(invitation);
      
      return invitation;
    } catch (error) {
      console.error('Invite team member error:', error);
      throw new Error('Failed to send team invitation');
    }
  }
  
  // Export functionality
  async exportApplicationsReport(employerId: string, options: {
    format: string;
    jobId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      // Build query conditions
      const whereConditions = [
        sql`EXISTS (
          SELECT 1 FROM ${jobs} j 
          WHERE j.id = ${application_pipeline.job_id} 
          AND j.posted_by = ${employerId}
        )`
      ];
      
      if (options.jobId) {
        whereConditions.push(eq(application_pipeline.job_id, options.jobId));
      }
      
      if (options.status) {
        whereConditions.push(eq(application_pipeline.status, options.status));
      }
      
      if (options.dateFrom) {
        whereConditions.push(gte(application_pipeline.applied_at, new Date(options.dateFrom)));
      }
      
      if (options.dateTo) {
        whereConditions.push(lte(application_pipeline.applied_at, new Date(options.dateTo)));
      }
      
      // Get applications data
      const applications = await db.query.application_pipeline.findMany({
        where: and(...whereConditions),
        orderBy: desc(application_pipeline.applied_at),
        with: {
          candidate: {
            columns: {
              first_name: true,
              last_name: true,
              email: true
            }
          },
          job: {
            columns: {
              title: true,
              department: true
            }
          }
        }
      });
      
      // Format data based on export format
      switch (options.format) {
        case 'csv':
          return this.formatApplicationsAsCSV(applications);
        case 'pdf':
          return this.formatApplicationsAsPDF(applications);
        case 'json':
        default:
          return JSON.stringify(applications, null, 2);
      }
    } catch (error) {
      console.error('Export applications report error:', error);
      throw new Error('Failed to export applications report');
    }
  }
  
  async exportAnalyticsReport(employerId: string, options: {
    format: string;
    days: number;
  }) {
    try {
      const analyticsData = await this.getDashboardOverview(employerId, options.days);
      
      switch (options.format) {
        case 'pdf':
          return this.formatAnalyticsAsPDF(analyticsData);
        case 'json':
        default:
          return JSON.stringify(analyticsData, null, 2);
      }
    } catch (error) {
      console.error('Export analytics report error:', error);
      throw new Error('Failed to export analytics report');
    }
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private async getJobStats(employerId: string) {
    const jobStats = await db.select({
      total: count(),
      active: count(sql`CASE WHEN ${jobs.status} = 'active' THEN 1 END`),
      draft: count(sql`CASE WHEN ${jobs.status} = 'draft' THEN 1 END`),
      paused: count(sql`CASE WHEN ${jobs.status} = 'paused' THEN 1 END`),
      filled: count(sql`CASE WHEN ${jobs.status} = 'filled' THEN 1 END`),
      expired: count(sql`CASE WHEN ${jobs.status} = 'expired' THEN 1 END`),
      featured: count(sql`CASE WHEN ${jobs.featured} = true THEN 1 END`),
      urgent: count(sql`CASE WHEN ${jobs.urgent} = true THEN 1 END`)
    })
    .from(jobs)
    .where(eq(jobs.posted_by, employerId));
    
    return jobStats[0];
  }
  
  private async getApplicationStats(jobIds: string[], startDate: Date, endDate: Date) {
    const stats = await db.select({
      total: count(),
      new_applications: count(sql`CASE WHEN ${application_pipeline.applied_at} >= ${startDate} THEN 1 END`),
      applications_this_week: count(sql`CASE WHEN ${application_pipeline.applied_at} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} THEN 1 END`),
      response_rate: avg(sql`CASE WHEN ${application_pipeline.status} != 'submitted' THEN 1 ELSE 0 END`)
    })
    .from(application_pipeline)
    .where(sql`${application_pipeline.job_id} = ANY(${jobIds})`);
    
    return {
      ...stats[0],
      response_rate: Math.round((stats[0].response_rate || 0) * 100)
    };
  }
  
  private async getRecentApplications(jobIds: string[], limit: number) {
    return await db.query.application_pipeline.findMany({
      where: sql`${application_pipeline.job_id} = ANY(${jobIds})`,
      orderBy: desc(application_pipeline.applied_at),
      limit,
      with: {
        candidate: {
          columns: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        job: {
          columns: {
            title: true
          }
        }
      }
    });
  }
  
  private async getTopPerformingJobs(jobIds: string[], days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db.select({
      job: jobs,
      application_count: count(application_pipeline.id),
      view_count: sum(job_analytics.views)
    })
    .from(jobs)
    .leftJoin(application_pipeline, eq(application_pipeline.job_id, jobs.id))
    .leftJoin(job_analytics, and(
      eq(job_analytics.job_id, jobs.id),
      gte(job_analytics.date, startDate)
    ))
    .where(sql`${jobs.id} = ANY(${jobIds})`)
    .groupBy(jobs.id)
    .orderBy(desc(count(application_pipeline.id)))
    .limit(5);
  }
  
  private async getHiringMetrics(jobIds: string[], days: number) {
    const metrics = await db.select({
      avg_time_to_hire: avg(sql`EXTRACT(DAYS FROM (${application_pipeline.updated_at} - ${application_pipeline.applied_at}))`),
      offers_extended: count(sql`CASE WHEN ${application_pipeline.status} = 'offer_extended' THEN 1 END`),
      hires_made: count(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 END`)
    })
    .from(application_pipeline)
    .where(sql`${application_pipeline.job_id} = ANY(${jobIds})`);
    
    return {
      ...metrics[0],
      avg_time_to_hire: Math.round(metrics[0].avg_time_to_hire || 0)
    };
  }
  
  private async getPipelineStats(jobIds: string[]) {
    return await db.select({
      status: application_pipeline.status,
      count: count()
    })
    .from(application_pipeline)
    .where(sql`${application_pipeline.job_id} = ANY(${jobIds})`)
    .groupBy(application_pipeline.status);
  }
  
  private getEmptyDashboard() {
    return {
      overview: {
        period_days: 30,
        total_jobs: 0,
        active_jobs: 0,
        total_applications: 0,
        new_applications: 0,
        applications_this_week: 0,
        response_rate: 0,
        time_to_hire: 0,
        offers_extended: 0,
        hires_made: 0
      },
      job_statistics: { total: 0, active: 0, draft: 0, paused: 0, filled: 0, expired: 0 },
      application_statistics: { total: 0, pending: 0, interviewing: 0, offers: 0, hired: 0, rejected: 0 },
      recent_applications: [],
      top_performing_jobs: [],
      hiring_metrics: { avg_time_to_hire: 0, offers_extended: 0, hires_made: 0 },
      pipeline_statistics: []
    };
  }
  
  private formatApplicationsAsCSV(applications: any[]): string {
    const headers = [
      'Candidate Name', 'Email', 'Job Title', 'Department', 'Status',
      'Applied Date', 'Last Updated', 'Rating'
    ];
    
    const rows = applications.map(app => [
      `${app.candidate.first_name} ${app.candidate.last_name}`,
      app.candidate.email,
      app.job.title,
      app.job.department || '',
      app.status,
      app.applied_at.toISOString().split('T')[0],
      app.updated_at.toISOString().split('T')[0],
      app.recruiter_rating || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  private formatApplicationsAsPDF(applications: any[]): Buffer {
    // Implementation would use a PDF library like puppeteer or pdfkit
    // This is a placeholder for the actual PDF generation
    throw new Error('PDF export not implemented');
  }
  
  private formatAnalyticsAsPDF(analyticsData: any): Buffer {
    // Implementation would use a PDF library to create analytics report
    // This is a placeholder for the actual PDF generation
    throw new Error('Analytics PDF export not implemented');
  }
  
  private async sendTeamInvitationEmail(invitation: any) {
    // Implementation would send email invitation
    // This is a placeholder for the actual email sending
  }
}

// Import necessary database schemas
const { 
  jobs, 
  companies, 
  application_pipeline, 
  job_analytics,
  job_templates,
  team_members,
  team_invitations
} = {} as any;