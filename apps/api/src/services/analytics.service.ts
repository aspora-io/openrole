import { eq, and, desc, asc, gte, lte, sql, count, avg, sum } from 'drizzle-orm';
import { db } from '../lib/database';

// Advanced analytics service for job board metrics and insights
export class AnalyticsService {
  
  // Get comprehensive employer analytics
  async getEmployerAnalytics(employerId: string, options: {
    days?: number;
    jobId?: string;
  } = {}) {
    try {
      const { days = 30, jobId } = options;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get employer's jobs
      const whereConditions = [eq(jobs.posted_by, employerId)];
      if (jobId) {
        whereConditions.push(eq(jobs.id, jobId));
      }
      
      const employerJobs = await db.query.jobs.findMany({
        where: and(...whereConditions),
        columns: { id: true }
      });
      
      const jobIds = employerJobs.map(job => job.id);
      
      if (jobIds.length === 0) {
        return this.getEmptyAnalytics();
      }
      
      // Parallel data fetching
      const [
        performanceMetrics,
        applicationTrends,
        conversionFunnel,
        sourceAttribution,
        timeToHire,
        candidateQuality,
        jobPerformance,
        dailyMetrics
      ] = await Promise.all([
        this.getPerformanceMetrics(jobIds, startDate, endDate),
        this.getApplicationTrends(jobIds, startDate, endDate),
        this.getConversionFunnel(jobIds),
        this.getSourceAttribution(jobIds, startDate, endDate),
        this.getTimeToHireMetrics(jobIds),
        this.getCandidateQualityMetrics(jobIds),
        this.getJobPerformanceMetrics(jobIds, startDate, endDate),
        this.getDailyMetrics(jobIds, startDate, endDate)
      ]);
      
      return {
        period: { days, start_date: startDate, end_date: endDate },
        performance_metrics: performanceMetrics,
        application_trends: applicationTrends,
        conversion_funnel: conversionFunnel,
        source_attribution: sourceAttribution,
        time_to_hire: timeToHire,
        candidate_quality: candidateQuality,
        job_performance: jobPerformance,
        daily_metrics: dailyMetrics
      };
    } catch (error) {
      console.error('Get employer analytics error:', error);
      throw new Error('Failed to get employer analytics');
    }
  }
  
  // Get hiring funnel analytics
  async getHiringFunnelAnalytics(employerId: string, options: {
    days?: number;
    jobId?: string;
  } = {}) {
    try {
      const { days = 90, jobId } = options;
      
      // Get funnel metrics
      const funnelQuery = `
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT CASE WHEN ap.id IS NOT NULL THEN ap.candidate_id END) as applicants,
          COUNT(CASE WHEN ap.status IN ('screening', 'phone_interview', 'technical_interview', 'final_interview', 'reference_check') THEN 1 END) as in_process,
          COUNT(CASE WHEN ap.status = 'offer_extended' THEN 1 END) as offers,
          COUNT(CASE WHEN ap.status = 'hired' THEN 1 END) as hires
        FROM job_views jv
        LEFT JOIN jobs j ON jv.job_id = j.id
        LEFT JOIN application_pipeline ap ON j.id = ap.job_id AND jv.user_id = ap.candidate_id
        WHERE j.posted_by = $1
        ${jobId ? 'AND j.id = $2' : ''}
        AND jv.viewed_at >= NOW() - INTERVAL '${days} days'
      `;
      
      const funnelResults = await db.execute(sql.raw(funnelQuery, [employerId, ...(jobId ? [jobId] : [])]));
      const funnel = funnelResults.rows[0];
      
      // Calculate conversion rates
      const conversionRates = {
        view_to_application: funnel.total_views > 0 ? (funnel.applicants / funnel.total_views * 100) : 0,
        application_to_process: funnel.applicants > 0 ? (funnel.in_process / funnel.applicants * 100) : 0,
        process_to_offer: funnel.in_process > 0 ? (funnel.offers / funnel.in_process * 100) : 0,
        offer_to_hire: funnel.offers > 0 ? (funnel.hires / funnel.offers * 100) : 0,
        overall_conversion: funnel.total_views > 0 ? (funnel.hires / funnel.total_views * 100) : 0
      };
      
      // Get funnel by stage over time
      const dailyFunnel = await this.getDailyFunnelMetrics(employerId, days, jobId);
      
      return {
        funnel_metrics: {
          total_views: parseInt(funnel.total_views),
          applicants: parseInt(funnel.applicants),
          in_process: parseInt(funnel.in_process),
          offers: parseInt(funnel.offers),
          hires: parseInt(funnel.hires)
        },
        conversion_rates: Object.keys(conversionRates).reduce((acc, key) => {
          acc[key] = Math.round(conversionRates[key] * 100) / 100;
          return acc;
        }, {}),
        daily_funnel: dailyFunnel
      };
    } catch (error) {
      console.error('Get hiring funnel analytics error:', error);
      throw new Error('Failed to get hiring funnel analytics');
    }
  }
  
  // Get diversity & inclusion analytics
  async getDiversityAnalytics(employerId: string, days: number = 90) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Note: This assumes diversity data is collected through optional candidate surveys
      // or inferred from other data points (names, schools, etc.) - implement based on compliance requirements
      
      const diversityMetrics = await db.select({
        total_applications: count(),
        // Add diversity breakdowns based on available data
        gender_distribution: sql`
          jsonb_build_object(
            'male', COUNT(CASE WHEN cp.gender = 'male' THEN 1 END),
            'female', COUNT(CASE WHEN cp.gender = 'female' THEN 1 END),
            'non_binary', COUNT(CASE WHEN cp.gender = 'non_binary' THEN 1 END),
            'prefer_not_to_say', COUNT(CASE WHEN cp.gender = 'prefer_not_to_say' THEN 1 END),
            'not_provided', COUNT(CASE WHEN cp.gender IS NULL THEN 1 END)
          )
        `,
        ethnicity_distribution: sql`
          jsonb_build_object(
            'asian', COUNT(CASE WHEN cp.ethnicity = 'asian' THEN 1 END),
            'black', COUNT(CASE WHEN cp.ethnicity = 'black' THEN 1 END),
            'hispanic', COUNT(CASE WHEN cp.ethnicity = 'hispanic' THEN 1 END),
            'white', COUNT(CASE WHEN cp.ethnicity = 'white' THEN 1 END),
            'mixed', COUNT(CASE WHEN cp.ethnicity = 'mixed' THEN 1 END),
            'other', COUNT(CASE WHEN cp.ethnicity = 'other' THEN 1 END),
            'prefer_not_to_say', COUNT(CASE WHEN cp.ethnicity = 'prefer_not_to_say' THEN 1 END),
            'not_provided', COUNT(CASE WHEN cp.ethnicity IS NULL THEN 1 END)
          )
        `,
        age_distribution: sql`
          jsonb_build_object(
            'under_25', COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(cp.date_of_birth)) < 25 THEN 1 END),
            '25_34', COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(cp.date_of_birth)) BETWEEN 25 AND 34 THEN 1 END),
            '35_44', COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(cp.date_of_birth)) BETWEEN 35 AND 44 THEN 1 END),
            '45_54', COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(cp.date_of_birth)) BETWEEN 45 AND 54 THEN 1 END),
            'over_55', COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(cp.date_of_birth)) >= 55 THEN 1 END),
            'not_provided', COUNT(CASE WHEN cp.date_of_birth IS NULL THEN 1 END)
          )
        `
      })
      .from(application_pipeline)
      .leftJoin(candidate_profiles, eq(application_pipeline.profile_id, candidate_profiles.id))
      .leftJoin(jobs, eq(application_pipeline.job_id, jobs.id))
      .where(and(
        eq(jobs.posted_by, employerId),
        gte(application_pipeline.applied_at, startDate),
        lte(application_pipeline.applied_at, endDate)
      ));
      
      // Get hiring outcomes by diversity groups
      const hiringOutcomes = await this.getDiversityHiringOutcomes(employerId, startDate, endDate);
      
      return {
        period: { days, start_date: startDate, end_date: endDate },
        application_diversity: diversityMetrics[0],
        hiring_outcomes: hiringOutcomes,
        diversity_insights: this.calculateDiversityInsights(diversityMetrics[0], hiringOutcomes)
      };
    } catch (error) {
      console.error('Get diversity analytics error:', error);
      throw new Error('Failed to get diversity analytics');
    }
  }
  
  // Get source attribution analytics
  async getSourceAttributionAnalytics(employerId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get application sources
      const sourceAttribution = await db.select({
        source: application_pipeline.referral_source,
        applications: count(),
        hired: count(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 END`),
        avg_time_to_hire: avg(sql`EXTRACT(DAYS FROM (${application_pipeline.updated_at} - ${application_pipeline.applied_at}))`),
        conversion_rate: avg(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 ELSE 0 END`)
      })
      .from(application_pipeline)
      .leftJoin(jobs, eq(application_pipeline.job_id, jobs.id))
      .where(and(
        eq(jobs.posted_by, employerId),
        gte(application_pipeline.applied_at, startDate),
        lte(application_pipeline.applied_at, endDate)
      ))
      .groupBy(application_pipeline.referral_source)
      .orderBy(desc(count()));
      
      // Get traffic sources from job views
      const trafficSources = await db.select({
        source: sql`CASE 
          WHEN ${job_views.referrer} LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN ${job_views.referrer} LIKE '%indeed%' THEN 'Indeed'
          WHEN ${job_views.referrer} LIKE '%google%' THEN 'Google'
          WHEN ${job_views.referrer} LIKE '%facebook%' THEN 'Facebook'
          WHEN ${job_views.referrer} IS NULL THEN 'Direct'
          ELSE 'Other'
        END`,
        views: count(),
        unique_views: count(sql`DISTINCT ${job_views.session_id}`)
      })
      .from(job_views)
      .leftJoin(jobs, eq(job_views.job_id, jobs.id))
      .where(and(
        eq(jobs.posted_by, employerId),
        gte(job_views.viewed_at, startDate),
        lte(job_views.viewed_at, endDate)
      ))
      .groupBy(sql`CASE 
        WHEN ${job_views.referrer} LIKE '%linkedin%' THEN 'LinkedIn'
        WHEN ${job_views.referrer} LIKE '%indeed%' THEN 'Indeed'
        WHEN ${job_views.referrer} LIKE '%google%' THEN 'Google'
        WHEN ${job_views.referrer} LIKE '%facebook%' THEN 'Facebook'
        WHEN ${job_views.referrer} IS NULL THEN 'Direct'
        ELSE 'Other'
      END`)
      .orderBy(desc(count()));
      
      // Calculate ROI by source (if cost data is available)
      const sourceROI = await this.calculateSourceROI(sourceAttribution);
      
      return {
        period: { days, start_date: startDate, end_date: endDate },
        application_sources: sourceAttribution.map(source => ({
          ...source,
          conversion_rate: Math.round((source.conversion_rate || 0) * 100 * 100) / 100,
          avg_time_to_hire: Math.round(source.avg_time_to_hire || 0)
        })),
        traffic_sources: trafficSources,
        source_roi: sourceROI,
        recommendations: this.generateSourceRecommendations(sourceAttribution, trafficSources)
      };
    } catch (error) {
      console.error('Get source attribution analytics error:', error);
      throw new Error('Failed to get source attribution analytics');
    }
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private async getPerformanceMetrics(jobIds: string[], startDate: Date, endDate: Date) {
    const metrics = await db.select({
      total_jobs: count(sql`DISTINCT ${jobs.id}`),
      total_views: sum(job_analytics.views),
      total_applications: sum(job_analytics.applications),
      avg_applications_per_job: avg(job_analytics.applications),
      avg_views_per_job: avg(job_analytics.views),
      conversion_rate: sql`CASE WHEN SUM(${job_analytics.views}) > 0 THEN SUM(${job_analytics.applications}) * 100.0 / SUM(${job_analytics.views}) ELSE 0 END`
    })
    .from(jobs)
    .leftJoin(job_analytics, and(
      eq(job_analytics.job_id, jobs.id),
      gte(job_analytics.date, startDate),
      lte(job_analytics.date, endDate)
    ))
    .where(sql`${jobs.id} = ANY(${jobIds})`);
    
    return {
      ...metrics[0],
      conversion_rate: Math.round((metrics[0].conversion_rate || 0) * 100) / 100
    };
  }
  
  private async getApplicationTrends(jobIds: string[], startDate: Date, endDate: Date) {
    return await db.select({
      date: sql<string>`DATE(${application_pipeline.applied_at})`,
      applications: count(),
      unique_candidates: count(sql`DISTINCT ${application_pipeline.candidate_id}`)
    })
    .from(application_pipeline)
    .where(and(
      sql`${application_pipeline.job_id} = ANY(${jobIds})`,
      gte(application_pipeline.applied_at, startDate),
      lte(application_pipeline.applied_at, endDate)
    ))
    .groupBy(sql`DATE(${application_pipeline.applied_at})`)
    .orderBy(sql`DATE(${application_pipeline.applied_at})`);
  }
  
  private async getConversionFunnel(jobIds: string[]) {
    const funnelData = await db.select({
      stage: application_pipeline.status,
      count: count(),
      avg_days_in_stage: avg(sql`EXTRACT(DAYS FROM (${application_pipeline.status_updated_at} - ${application_pipeline.applied_at}))`)
    })
    .from(application_pipeline)
    .where(sql`${application_pipeline.job_id} = ANY(${jobIds})`)
    .groupBy(application_pipeline.status);
    
    // Calculate conversion rates between stages
    const stages = ['submitted', 'screening', 'phone_interview', 'technical_interview', 'final_interview', 'offer_extended', 'hired'];
    
    return stages.map((stage, index) => {
      const stageData = funnelData.find(f => f.stage === stage);
      const nextStageData = index < stages.length - 1 ? funnelData.find(f => f.stage === stages[index + 1]) : null;
      
      return {
        stage,
        count: stageData?.count || 0,
        avg_days_in_stage: Math.round(stageData?.avg_days_in_stage || 0),
        conversion_to_next: nextStageData && stageData ? 
          Math.round((nextStageData.count / stageData.count) * 100 * 100) / 100 : 0
      };
    });
  }
  
  private async getSourceAttribution(jobIds: string[], startDate: Date, endDate: Date) {
    return await db.select({
      source: application_pipeline.referral_source,
      applications: count(),
      hired: count(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 END`),
      conversion_rate: avg(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 ELSE 0 END`)
    })
    .from(application_pipeline)
    .where(and(
      sql`${application_pipeline.job_id} = ANY(${jobIds})`,
      gte(application_pipeline.applied_at, startDate),
      lte(application_pipeline.applied_at, endDate)
    ))
    .groupBy(application_pipeline.referral_source)
    .orderBy(desc(count()));
  }
  
  private async getTimeToHireMetrics(jobIds: string[]) {
    const timeMetrics = await db.select({
      avg_time_to_hire: avg(sql`EXTRACT(DAYS FROM (${application_pipeline.updated_at} - ${application_pipeline.applied_at}))`),
      median_time_to_hire: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(DAYS FROM (${application_pipeline.updated_at} - ${application_pipeline.applied_at})))`,
      fastest_hire: sql`MIN(EXTRACT(DAYS FROM (${application_pipeline.updated_at} - ${application_pipeline.applied_at})))`,
      slowest_hire: sql`MAX(EXTRACT(DAYS FROM (${application_pipeline.updated_at} - ${application_pipeline.applied_at})))`
    })
    .from(application_pipeline)
    .where(and(
      sql`${application_pipeline.job_id} = ANY(${jobIds})`,
      eq(application_pipeline.status, 'hired')
    ));
    
    return {
      ...timeMetrics[0],
      avg_time_to_hire: Math.round(timeMetrics[0].avg_time_to_hire || 0),
      median_time_to_hire: Math.round(timeMetrics[0].median_time_to_hire || 0)
    };
  }
  
  private async getCandidateQualityMetrics(jobIds: string[]) {
    return await db.select({
      avg_recruiter_rating: avg(application_pipeline.recruiter_rating),
      avg_hiring_manager_rating: avg(application_pipeline.hiring_manager_rating),
      avg_technical_score: avg(application_pipeline.technical_score),
      avg_culture_fit_score: avg(application_pipeline.culture_fit_score),
      applications_with_ratings: count(sql`CASE WHEN ${application_pipeline.recruiter_rating} IS NOT NULL THEN 1 END`)
    })
    .from(application_pipeline)
    .where(sql`${application_pipeline.job_id} = ANY(${jobIds})`);
  }
  
  private async getJobPerformanceMetrics(jobIds: string[], startDate: Date, endDate: Date) {
    return await db.select({
      job_id: jobs.id,
      job_title: jobs.title,
      views: sum(job_analytics.views),
      applications: sum(job_analytics.applications),
      conversion_rate: sql`CASE WHEN SUM(${job_analytics.views}) > 0 THEN SUM(${job_analytics.applications}) * 100.0 / SUM(${job_analytics.views}) ELSE 0 END`,
      hired_count: count(sql`CASE WHEN ${application_pipeline.status} = 'hired' THEN 1 END`)
    })
    .from(jobs)
    .leftJoin(job_analytics, and(
      eq(job_analytics.job_id, jobs.id),
      gte(job_analytics.date, startDate),
      lte(job_analytics.date, endDate)
    ))
    .leftJoin(application_pipeline, eq(application_pipeline.job_id, jobs.id))
    .where(sql`${jobs.id} = ANY(${jobIds})`)
    .groupBy(jobs.id, jobs.title)
    .orderBy(desc(sum(job_analytics.applications)));
  }
  
  private async getDailyMetrics(jobIds: string[], startDate: Date, endDate: Date) {
    return await db.select({
      date: job_analytics.date,
      total_views: sum(job_analytics.views),
      total_applications: sum(job_analytics.applications),
      conversion_rate: sql`CASE WHEN SUM(${job_analytics.views}) > 0 THEN SUM(${job_analytics.applications}) * 100.0 / SUM(${job_analytics.views}) ELSE 0 END`
    })
    .from(job_analytics)
    .where(and(
      sql`${job_analytics.job_id} = ANY(${jobIds})`,
      gte(job_analytics.date, startDate),
      lte(job_analytics.date, endDate)
    ))
    .groupBy(job_analytics.date)
    .orderBy(job_analytics.date);
  }
  
  private async getDailyFunnelMetrics(employerId: string, days: number, jobId?: string) {
    // Implementation for daily funnel metrics
    // This is a complex query that would track daily progression through the funnel
    return [];
  }
  
  private async getDiversityHiringOutcomes(employerId: string, startDate: Date, endDate: Date) {
    // Implementation for diversity hiring outcome analysis
    // This would analyze hiring rates across different demographic groups
    return {};
  }
  
  private calculateDiversityInsights(applicationDiversity: any, hiringOutcomes: any) {
    // Implementation for diversity insights calculation
    // This would identify potential bias or areas for improvement
    return {};
  }
  
  private async calculateSourceROI(sourceAttribution: any[]) {
    // Implementation for ROI calculation by source
    // This would require cost data per source channel
    return [];
  }
  
  private generateSourceRecommendations(applicationSources: any[], trafficSources: any[]) {
    // Implementation for generating source optimization recommendations
    return [];
  }
  
  private getEmptyAnalytics() {
    return {
      period: { days: 30, start_date: new Date(), end_date: new Date() },
      performance_metrics: {},
      application_trends: [],
      conversion_funnel: [],
      source_attribution: [],
      time_to_hire: {},
      candidate_quality: {},
      job_performance: [],
      daily_metrics: []
    };
  }
}

// Import necessary database schemas
const { 
  jobs, 
  application_pipeline, 
  job_analytics, 
  job_views,
  candidate_profiles 
} = {} as any;