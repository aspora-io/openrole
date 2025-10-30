import { eq, and, or, desc, asc, gte, lte, like, ilike, inArray, sql, count } from 'drizzle-orm';
import { db, jobs, companies } from '../lib/database';
import type { Job } from '../lib/database';

// Advanced job search service with filtering, sorting, and relevance scoring
export class JobSearchService {
  
  // Main job search with comprehensive filtering
  async searchJobs(searchParams: {
    query?: string;
    location?: string;
    remote_type?: string;
    employment_type?: string;
    experience_level?: string;
    salary_min?: number;
    salary_max?: number;
    skills?: string[];
    company_id?: string;
    department?: string;
    featured?: boolean;
    urgent?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    try {
      const {
        query,
        location,
        remote_type,
        employment_type,
        experience_level,
        salary_min,
        salary_max,
        skills,
        company_id,
        department,
        featured,
        urgent,
        page = 1,
        limit = 20,
        sort = 'relevance'
      } = searchParams;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = [
        eq(jobs.status, 'active'),
        or(
          eq(jobs.expires_at, null),
          gte(jobs.expires_at, new Date())
        )
      ];
      
      // Text search across title, description, and company name
      if (query) {
        whereConditions.push(
          or(
            ilike(jobs.title, `%${query}%`),
            ilike(jobs.description, `%${query}%`),
            sql`EXISTS (
              SELECT 1 FROM companies c 
              WHERE c.id = ${jobs.company_id} 
              AND c.name ILIKE ${`%${query}%`}
            )`
          )
        );
      }
      
      // Location filtering
      if (location) {
        whereConditions.push(
          or(
            ilike(jobs.location_general, `%${location}%`),
            ilike(jobs.location_precise, `%${location}%`)
          )
        );
      }
      
      // Remote work type
      if (remote_type) {
        whereConditions.push(eq(jobs.remote_type, remote_type));
      }
      
      // Employment type
      if (employment_type) {
        whereConditions.push(eq(jobs.employment_type, employment_type));
      }
      
      // Experience level
      if (experience_level) {
        whereConditions.push(eq(jobs.experience_level, experience_level));
      }
      
      // Salary range filtering
      if (salary_min) {
        whereConditions.push(gte(jobs.salary_max, salary_min));
      }
      if (salary_max) {
        whereConditions.push(lte(jobs.salary_min, salary_max));
      }
      
      // Company filtering
      if (company_id) {
        whereConditions.push(eq(jobs.company_id, company_id));
      }
      
      // Department filtering
      if (department) {
        whereConditions.push(eq(jobs.department, department));
      }
      
      // Featured jobs filter
      if (featured) {
        whereConditions.push(eq(jobs.featured, true));
      }
      
      // Urgent jobs filter
      if (urgent) {
        whereConditions.push(eq(jobs.urgent, true));
      }
      
      // Skills filtering using JSON operators
      if (skills && skills.length > 0) {
        const skillsConditions = skills.map(skill => 
          sql`${jobs.core_skills} ? ${skill} OR ${jobs.nice_to_have_skills} ? ${skill}`
        );
        whereConditions.push(or(...skillsConditions));
      }
      
      // Build order by clause
      const orderBy = this.buildSearchOrderBy(sort, query, skills);
      
      // Execute search query
      const searchResults = await db.query.jobs.findMany({
        where: and(...whereConditions),
        orderBy,
        limit,
        offset,
        with: {
          company: {
            columns: {
              id: true,
              name: true,
              logo_url: true,
              industry: true,
              size_category: true,
              verified: true
            }
          }
        }
      });
      
      // Get total count for pagination
      const totalCount = await db.select({ count: count() })
        .from(jobs)
        .where(and(...whereConditions));
      
      // Calculate relevance scores if needed
      const jobsWithScores = sort === 'relevance' 
        ? await this.calculateRelevanceScores(searchResults, query, skills)
        : searchResults;
      
      // Get search facets for filtering UI
      const facets = await this.getSearchFacets(whereConditions);
      
      return {
        jobs: jobsWithScores,
        total: totalCount[0]?.count || 0,
        facets
      };
    } catch (error) {
      console.error('Job search error:', error);
      throw new Error('Failed to search jobs');
    }
  }
  
  // Get similar jobs based on skills and other attributes
  async getSimilarJobs(jobId: string, limit: number = 5) {
    try {
      // Get the reference job
      const referenceJob = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId)
      });
      
      if (!referenceJob) {
        return [];
      }
      
      // Find similar jobs based on skills, department, and experience level
      const similarJobs = await db.query.jobs.findMany({
        where: and(
          eq(jobs.status, 'active'),
          sql`${jobs.id} != ${jobId}`,
          or(
            // Same department
            eq(jobs.department, referenceJob.department),
            // Similar experience level
            eq(jobs.experience_level, referenceJob.experience_level),
            // Overlapping skills
            sql`${jobs.core_skills} && ${referenceJob.core_skills}`,
            // Same company
            eq(jobs.company_id, referenceJob.company_id)
          )
        ),
        orderBy: [
          desc(jobs.featured),
          desc(jobs.created_at)
        ],
        limit,
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
      });
      
      return similarJobs;
    } catch (error) {
      console.error('Get similar jobs error:', error);
      throw new Error('Failed to get similar jobs');
    }
  }
  
  // Get job search suggestions for autocomplete
  async getSearchSuggestions(query: string, type: 'skills' | 'locations' | 'companies' | 'titles') {
    try {
      const suggestions: string[] = [];
      
      switch (type) {
        case 'skills':
          // Get popular skills from active jobs
          const skillsResult = await db.select({
            skills: sql`jsonb_array_elements_text(${jobs.core_skills}) as skill`
          })
          .from(jobs)
          .where(and(
            eq(jobs.status, 'active'),
            sql`jsonb_array_elements_text(${jobs.core_skills}) ILIKE ${`%${query}%`}`
          ))
          .groupBy(sql`skill`)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(10);
          
          suggestions.push(...skillsResult.map(r => r.skills));
          break;
          
        case 'locations':
          const locationsResult = await db.select({
            location: jobs.location_general
          })
          .from(jobs)
          .where(and(
            eq(jobs.status, 'active'),
            ilike(jobs.location_general, `%${query}%`)
          ))
          .groupBy(jobs.location_general)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(10);
          
          suggestions.push(...locationsResult.map(r => r.location).filter(Boolean));
          break;
          
        case 'companies':
          const companiesResult = await db.select({
            name: companies.name
          })
          .from(companies)
          .where(ilike(companies.name, `%${query}%`))
          .orderBy(asc(companies.name))
          .limit(10);
          
          suggestions.push(...companiesResult.map(r => r.name));
          break;
          
        case 'titles':
          const titlesResult = await db.select({
            title: jobs.title
          })
          .from(jobs)
          .where(and(
            eq(jobs.status, 'active'),
            ilike(jobs.title, `%${query}%`)
          ))
          .groupBy(jobs.title)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(10);
          
          suggestions.push(...titlesResult.map(r => r.title));
          break;
      }
      
      return [...new Set(suggestions)]; // Remove duplicates
    } catch (error) {
      console.error('Get search suggestions error:', error);
      return [];
    }
  }
  
  // Get trending jobs based on view and application metrics
  async getTrendingJobs(limit: number = 10, days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const trendingJobs = await db.select({
        job: jobs,
        company: companies,
        total_views: sql<number>`COALESCE(SUM(${job_analytics.views}), 0)`,
        total_applications: sql<number>`COALESCE(SUM(${job_analytics.applications}), 0)`,
        trend_score: sql<number>`
          (COALESCE(SUM(${job_analytics.views}), 0) * 0.3 + 
           COALESCE(SUM(${job_analytics.applications}), 0) * 0.7) / ${days}
        `
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.company_id, companies.id))
      .leftJoin(job_analytics, and(
        eq(job_analytics.job_id, jobs.id),
        gte(job_analytics.date, startDate),
        lte(job_analytics.date, endDate)
      ))
      .where(eq(jobs.status, 'active'))
      .groupBy(jobs.id, companies.id)
      .orderBy(desc(sql`trend_score`))
      .limit(limit);
      
      return trendingJobs;
    } catch (error) {
      console.error('Get trending jobs error:', error);
      throw new Error('Failed to get trending jobs');
    }
  }
  
  // Get job search analytics for admin dashboard
  async getSearchAnalytics(days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get popular search terms (this would require search logging)
      const popularTerms = await db.select({
        term: search_logs.query,
        count: sql<number>`COUNT(*)`
      })
      .from(search_logs)
      .where(and(
        gte(search_logs.created_at, startDate),
        lte(search_logs.created_at, endDate)
      ))
      .groupBy(search_logs.query)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(20);
      
      // Get search volume trends
      const searchVolume = await db.select({
        date: sql<string>`DATE(${search_logs.created_at})`,
        searches: sql<number>`COUNT(*)`
      })
      .from(search_logs)
      .where(and(
        gte(search_logs.created_at, startDate),
        lte(search_logs.created_at, endDate)
      ))
      .groupBy(sql`DATE(${search_logs.created_at})`)
      .orderBy(sql`DATE(${search_logs.created_at})`);
      
      return {
        popular_terms: popularTerms,
        search_volume: searchVolume
      };
    } catch (error) {
      console.error('Get search analytics error:', error);
      return {
        popular_terms: [],
        search_volume: []
      };
    }
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private buildSearchOrderBy(sort: string, query?: string, skills?: string[]) {
    switch (sort) {
      case 'salary_min':
        return desc(jobs.salary_min);
      case 'salary_max':
        return desc(jobs.salary_max);
      case 'date':
        return desc(jobs.created_at);
      case 'company':
        return asc(companies.name);
      case 'title':
        return asc(jobs.title);
      case 'relevance':
      default:
        // For relevance, we'll use a combination of factors
        return [
          desc(jobs.featured), // Featured jobs first
          desc(jobs.urgent),   // Then urgent jobs
          desc(jobs.created_at) // Then by recency
        ];
    }
  }
  
  private async calculateRelevanceScores(jobs: any[], query?: string, skills?: string[]) {
    // Calculate relevance scores based on:
    // 1. Query match in title/description
    // 2. Skills overlap
    // 3. Recency
    // 4. Company verification
    // 5. Job engagement metrics
    
    return jobs.map(job => {
      let score = 0;
      
      // Title match bonus
      if (query && job.title.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
      }
      
      // Description match bonus
      if (query && job.description.toLowerCase().includes(query.toLowerCase())) {
        score += 5;
      }
      
      // Skills overlap bonus
      if (skills && skills.length > 0) {
        const jobSkills = [...(job.core_skills || []), ...(job.nice_to_have_skills || [])];
        const overlap = skills.filter(skill => 
          jobSkills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        score += overlap * 3;
      }
      
      // Recency bonus (jobs posted in last 7 days)
      const daysSincePosted = Math.floor(
        (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSincePosted <= 7) {
        score += 5 - (daysSincePosted * 0.7);
      }
      
      // Verified company bonus
      if (job.company?.verified) {
        score += 2;
      }
      
      // Featured job bonus
      if (job.featured) {
        score += 5;
      }
      
      // Urgent job bonus
      if (job.urgent) {
        score += 3;
      }
      
      return {
        ...job,
        relevance_score: Math.round(score * 100) / 100
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }
  
  private async getSearchFacets(whereConditions: any[]) {
    try {
      // Get facets for filtering UI
      const [
        locationFacets,
        remoteTypeFacets,
        employmentTypeFacets,
        experienceLevelFacets,
        departmentFacets,
        skillsFacets
      ] = await Promise.all([
        // Location facets
        db.select({
          value: jobs.location_general,
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(...whereConditions))
        .groupBy(jobs.location_general)
        .having(sql`${jobs.location_general} IS NOT NULL`)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10),
        
        // Remote type facets
        db.select({
          value: jobs.remote_type,
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(...whereConditions))
        .groupBy(jobs.remote_type)
        .orderBy(sql`COUNT(*) DESC`),
        
        // Employment type facets
        db.select({
          value: jobs.employment_type,
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(...whereConditions))
        .groupBy(jobs.employment_type)
        .orderBy(sql`COUNT(*) DESC`),
        
        // Experience level facets
        db.select({
          value: jobs.experience_level,
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(...whereConditions))
        .groupBy(jobs.experience_level)
        .orderBy(sql`COUNT(*) DESC`),
        
        // Department facets
        db.select({
          value: jobs.department,
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(...whereConditions))
        .groupBy(jobs.department)
        .having(sql`${jobs.department} IS NOT NULL`)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10),
        
        // Top skills facets
        db.select({
          skill: sql`jsonb_array_elements_text(${jobs.core_skills})`,
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(...whereConditions))
        .groupBy(sql`jsonb_array_elements_text(${jobs.core_skills})`)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(20)
      ]);
      
      return {
        locations: locationFacets,
        remote_types: remoteTypeFacets,
        employment_types: employmentTypeFacets,
        experience_levels: experienceLevelFacets,
        departments: departmentFacets,
        skills: skillsFacets
      };
    } catch (error) {
      console.error('Get search facets error:', error);
      return {
        locations: [],
        remote_types: [],
        employment_types: [],
        experience_levels: [],
        departments: [],
        skills: []
      };
    }
  }
}

// Import necessary database schemas
const { jobs, companies, job_analytics, search_logs } = {} as any;