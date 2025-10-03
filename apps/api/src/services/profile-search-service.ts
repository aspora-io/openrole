/**
 * ProfileSearchService - Advanced profile search and discovery
 * 
 * Handles complex search operations, ranking algorithms, filtering,
 * and search analytics for candidate profiles.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { eq, and, or, sql, desc, asc, ilike, gt, lt, gte, lte } from 'drizzle-orm';
import { db } from '@openrole/database';
import { 
  candidateProfiles,
  workExperience,
  education,
  portfolioItems,
  SelectCandidateProfile,
  PrivacyLevel,
  RemotePreference
} from '@openrole/database/models/candidate-profile';
import { 
  profileSchemas,
  validateProfileData,
  ProfileSearchCriteria,
  ProfileSearchResult
} from '@openrole/validation';

export interface AdvancedSearchCriteria extends ProfileSearchCriteria {
  // Location-based search
  locationRadius?: number; // kilometers
  locationCoordinates?: { lat: number; lng: number };
  
  // Experience-based search
  minYearsExperience?: number;
  maxYearsExperience?: number;
  companySizes?: string[]; // 'startup', 'small', 'medium', 'large', 'enterprise'
  
  // Education-based search
  educationLevels?: string[]; // 'bachelor', 'master', 'phd', 'certificate'
  universities?: string[];
  graduationYearFrom?: number;
  graduationYearTo?: number;
  
  // Portfolio-based search
  portfolioTypes?: string[]; // 'project', 'article', 'design', 'code'
  hasPortfolio?: boolean;
  
  // Verification and quality filters
  minCompletionPercentage?: number;
  verifiedOnly?: boolean;
  recentlyUpdated?: boolean; // Updated within last 30 days
  
  // Availability filters
  availableImmediately?: boolean;
  noticePeriod?: number; // weeks
  
  // Ranking preferences
  rankBy?: 'relevance' | 'experience' | 'education' | 'completion' | 'recent';
  boost?: {
    skills?: number; // Boost factor for skill matches
    location?: number; // Boost factor for location matches
    experience?: number; // Boost factor for experience matches
  };
}

export interface SearchResult extends ProfileSearchResult {
  score: number; // Relevance score 0-100
  matchReasons: string[]; // Why this profile matched
  contactable: boolean; // Whether viewer can contact this candidate
  lastActivity: Date | null; // Last profile update or activity
}

export interface SearchAnalytics {
  totalResults: number;
  filteredResults: number;
  averageScore: number;
  topSkills: Array<{ skill: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  experienceDistribution: Array<{ range: string; count: number }>;
  searchDuration: number; // milliseconds
  cacheHit: boolean;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  criteria: AdvancedSearchCriteria;
  alertsEnabled: boolean;
  lastExecuted: Date | null;
  resultCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfileSearchService {
  // Core search operations
  searchProfiles(criteria: AdvancedSearchCriteria, viewerUserId?: string): Promise<SearchResult[]>;
  quickSearch(query: string, viewerUserId?: string): Promise<SearchResult[]>;
  similarProfiles(profileId: string, limit?: number): Promise<SearchResult[]>;
  
  // Advanced search features
  searchWithAnalytics(criteria: AdvancedSearchCriteria, viewerUserId?: string): Promise<{
    results: SearchResult[];
    analytics: SearchAnalytics;
  }>;
  
  // Search suggestions and auto-complete
  suggestSkills(query: string, limit?: number): Promise<string[]>;
  suggestLocations(query: string, limit?: number): Promise<string[]>;
  suggestCompanies(query: string, limit?: number): Promise<string[]>;
  
  // Saved searches
  saveSearch(userId: string, name: string, criteria: AdvancedSearchCriteria): Promise<SavedSearch>;
  getSavedSearches(userId: string): Promise<SavedSearch[]>;
  executeSavedSearch(searchId: string, userId: string): Promise<SearchResult[]>;
  deleteSavedSearch(searchId: string, userId: string): Promise<boolean>;
  
  // Search alerts
  enableSearchAlerts(searchId: string, userId: string): Promise<SavedSearch>;
  disableSearchAlerts(searchId: string, userId: string): Promise<SavedSearch>;
  processSearchAlerts(): Promise<number>; // Returns number of alerts sent
  
  // Search analytics
  getSearchAnalytics(userId: string, days?: number): Promise<any>;
  getPopularSearchTerms(limit?: number): Promise<Array<{ term: string; count: number }>>;
}

export class ProfileSearchService implements IProfileSearchService {
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Advanced profile search with scoring and ranking
   */
  async searchProfiles(criteria: AdvancedSearchCriteria, viewerUserId?: string): Promise<SearchResult[]> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(criteria, viewerUserId);
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }

    // Validate input
    const validation = validateProfileData(profileSchemas.profileSearch, criteria);
    if (!validation.success) {
      throw new Error(`Search validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
    }

    // Build base query
    let query = db
      .select({
        profile: candidateProfiles,
        workExp: workExperience,
        edu: education,
        portfolio: portfolioItems
      })
      .from(candidateProfiles)
      .leftJoin(workExperience, eq(candidateProfiles.userId, workExperience.userId))
      .leftJoin(education, eq(candidateProfiles.userId, education.userId))
      .leftJoin(portfolioItems, eq(candidateProfiles.userId, portfolioItems.userId))
      .where(
        and(
          // Base privacy filters
          or(
            eq(candidateProfiles.privacyLevel, PrivacyLevel.PUBLIC),
            and(
              eq(candidateProfiles.privacyLevel, PrivacyLevel.SEMI_PRIVATE),
              viewerUserId ? sql`true` : sql`false`
            )
          ),
          // Completion filter
          criteria.minCompletionPercentage 
            ? gte(candidateProfiles.completionPercentage, criteria.minCompletionPercentage)
            : sql`true`,
          // Verification filter
          criteria.verifiedOnly 
            ? eq(candidateProfiles.isVerified, true)
            : sql`true`,
          // Recent update filter
          criteria.recentlyUpdated
            ? gte(candidateProfiles.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            : sql`true`
        )
      );

    // Apply additional filters
    const conditions = [];

    // Skills matching
    if (criteria.skills && criteria.skills.length > 0) {
      conditions.push(
        sql`${candidateProfiles.skills} && ${JSON.stringify(criteria.skills)}`
      );
    }

    // Industry matching
    if (criteria.industries && criteria.industries.length > 0) {
      conditions.push(
        sql`${candidateProfiles.industries} && ${JSON.stringify(criteria.industries)}`
      );
    }

    // Location matching
    if (criteria.location) {
      conditions.push(
        ilike(candidateProfiles.location, `%${criteria.location}%`)
      );
    }

    // Remote preference
    if (criteria.remotePreference) {
      conditions.push(eq(candidateProfiles.remotePreference, criteria.remotePreference));
    }

    // Salary range
    if (criteria.salaryMin || criteria.salaryMax) {
      if (criteria.salaryMin) {
        conditions.push(
          or(
            gte(candidateProfiles.salaryExpectationMin, criteria.salaryMin),
            gte(candidateProfiles.salaryExpectationMax, criteria.salaryMin)
          )
        );
      }
      if (criteria.salaryMax) {
        conditions.push(
          or(
            lte(candidateProfiles.salaryExpectationMin, criteria.salaryMax),
            lte(candidateProfiles.salaryExpectationMax, criteria.salaryMax)
          )
        );
      }
    }

    // Experience-based filters
    if (criteria.minYearsExperience || criteria.maxYearsExperience) {
      // Calculate years of experience from work history
      if (criteria.minYearsExperience) {
        conditions.push(
          sql`EXTRACT(YEAR FROM AGE(COALESCE(${workExperience.endDate}, CURRENT_DATE), ${workExperience.startDate})) >= ${criteria.minYearsExperience}`
        );
      }
      if (criteria.maxYearsExperience) {
        conditions.push(
          sql`EXTRACT(YEAR FROM AGE(COALESCE(${workExperience.endDate}, CURRENT_DATE), ${workExperience.startDate})) <= ${criteria.maxYearsExperience}`
        );
      }
    }

    // Education filters
    if (criteria.educationLevels && criteria.educationLevels.length > 0) {
      conditions.push(
        sql`${education.degree} = ANY(${criteria.educationLevels})`
      );
    }

    // Portfolio filters
    if (criteria.hasPortfolio) {
      conditions.push(sql`${portfolioItems.id} IS NOT NULL`);
    }

    if (criteria.portfolioTypes && criteria.portfolioTypes.length > 0) {
      conditions.push(
        sql`${portfolioItems.type} = ANY(${criteria.portfolioTypes})`
      );
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query
    const rawResults = await query.limit(Math.min(criteria.limit || 20, 100));

    // Process and score results
    const scoredResults = await this.scoreAndRankResults(
      rawResults,
      criteria,
      viewerUserId
    );

    // Cache results
    this.searchCache.set(cacheKey, {
      results: scoredResults,
      timestamp: Date.now()
    });

    return scoredResults;
  }

  /**
   * Quick text-based search across multiple fields
   */
  async quickSearch(query: string, viewerUserId?: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerms = query.trim().toLowerCase().split(/\s+/);
    
    const results = await db
      .select()
      .from(candidateProfiles)
      .where(
        and(
          // Privacy filters
          or(
            eq(candidateProfiles.privacyLevel, PrivacyLevel.PUBLIC),
            and(
              eq(candidateProfiles.privacyLevel, PrivacyLevel.SEMI_PRIVATE),
              viewerUserId ? sql`true` : sql`false`
            )
          ),
          // Text search across multiple fields
          or(
            ...searchTerms.map(term => 
              or(
                ilike(candidateProfiles.headline, `%${term}%`),
                ilike(candidateProfiles.summary, `%${term}%`),
                ilike(candidateProfiles.location, `%${term}%`),
                sql`${candidateProfiles.skills}::text ILIKE ${'%' + term + '%'}`,
                sql`${candidateProfiles.industries}::text ILIKE ${'%' + term + '%'}`
              )
            )
          )
        )
      )
      .limit(50);

    return this.scoreAndRankResults(
      results.map(profile => ({ profile, workExp: null, edu: null, portfolio: null })),
      { query },
      viewerUserId
    );
  }

  /**
   * Find profiles similar to a given profile
   */
  async similarProfiles(profileId: string, limit = 10): Promise<SearchResult[]> {
    // Get the reference profile
    const [refProfile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.id, profileId))
      .limit(1);

    if (!refProfile) {
      throw new Error('Reference profile not found');
    }

    // Search for similar profiles based on skills, industries, and location
    const criteria: AdvancedSearchCriteria = {
      skills: refProfile.skills,
      industries: refProfile.industries,
      location: refProfile.location,
      remotePreference: refProfile.remotePreference,
      limit,
      rankBy: 'relevance'
    };

    const results = await this.searchProfiles(criteria);
    
    // Remove the reference profile from results
    return results.filter(result => result.id !== profileId);
  }

  /**
   * Search with detailed analytics
   */
  async searchWithAnalytics(criteria: AdvancedSearchCriteria, viewerUserId?: string): Promise<{
    results: SearchResult[];
    analytics: SearchAnalytics;
  }> {
    const startTime = Date.now();
    const results = await this.searchProfiles(criteria, viewerUserId);
    const searchDuration = Date.now() - startTime;

    // Calculate analytics
    const analytics: SearchAnalytics = {
      totalResults: results.length,
      filteredResults: results.length,
      averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length || 0,
      topSkills: this.calculateTopSkills(results),
      locationDistribution: this.calculateLocationDistribution(results),
      experienceDistribution: [], // TODO: Implement
      searchDuration,
      cacheHit: this.searchCache.has(this.generateCacheKey(criteria, viewerUserId))
    };

    return { results, analytics };
  }

  /**
   * Suggest skills based on partial query
   */
  async suggestSkills(query: string, limit = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results = await db
      .select({
        skills: candidateProfiles.skills
      })
      .from(candidateProfiles)
      .where(
        sql`${candidateProfiles.skills}::text ILIKE ${'%' + query.toLowerCase() + '%'}`
      )
      .limit(100);

    // Extract and count skills
    const skillCounts = new Map<string, number>();
    results.forEach(row => {
      if (row.skills) {
        row.skills.forEach(skill => {
          if (skill.toLowerCase().includes(query.toLowerCase())) {
            skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
          }
        });
      }
    });

    // Return top suggestions
    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([skill]) => skill);
  }

  /**
   * Suggest locations based on partial query
   */
  async suggestLocations(query: string, limit = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results = await db
      .selectDistinct({
        location: candidateProfiles.location
      })
      .from(candidateProfiles)
      .where(
        and(
          ilike(candidateProfiles.location, `%${query}%`),
          sql`${candidateProfiles.location} IS NOT NULL`
        )
      )
      .limit(limit);

    return results.map(r => r.location).filter(Boolean);
  }

  /**
   * Suggest companies from work experience
   */
  async suggestCompanies(query: string, limit = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results = await db
      .selectDistinct({
        company: workExperience.companyName
      })
      .from(workExperience)
      .where(
        and(
          ilike(workExperience.companyName, `%${query}%`),
          sql`${workExperience.companyName} IS NOT NULL`
        )
      )
      .limit(limit);

    return results.map(r => r.company).filter(Boolean);
  }

  /**
   * Save a search for later use
   */
  async saveSearch(userId: string, name: string, criteria: AdvancedSearchCriteria): Promise<SavedSearch> {
    // TODO: Implement saved searches table
    // For now, return mock object
    return {
      id: 'mock-id',
      userId,
      name,
      criteria,
      alertsEnabled: false,
      lastExecuted: null,
      resultCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get saved searches for user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    // TODO: Implement saved searches retrieval
    return [];
  }

  /**
   * Execute a saved search
   */
  async executeSavedSearch(searchId: string, userId: string): Promise<SearchResult[]> {
    // TODO: Implement saved search execution
    return [];
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string, userId: string): Promise<boolean> {
    // TODO: Implement saved search deletion
    return true;
  }

  /**
   * Enable search alerts
   */
  async enableSearchAlerts(searchId: string, userId: string): Promise<SavedSearch> {
    // TODO: Implement search alerts
    throw new Error('Not implemented');
  }

  /**
   * Disable search alerts
   */
  async disableSearchAlerts(searchId: string, userId: string): Promise<SavedSearch> {
    // TODO: Implement search alerts
    throw new Error('Not implemented');
  }

  /**
   * Process search alerts (batch job)
   */
  async processSearchAlerts(): Promise<number> {
    // TODO: Implement search alerts processing
    return 0;
  }

  /**
   * Get search analytics for user
   */
  async getSearchAnalytics(userId: string, days = 30): Promise<any> {
    // TODO: Implement search analytics
    return {};
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit = 10): Promise<Array<{ term: string; count: number }>> {
    // TODO: Implement popular search terms tracking
    return [];
  }

  /**
   * Score and rank search results
   */
  private async scoreAndRankResults(
    rawResults: any[],
    criteria: any,
    viewerUserId?: string
  ): Promise<SearchResult[]> {
    const scoredResults: SearchResult[] = [];

    for (const result of rawResults) {
      const profile = result.profile;
      if (!profile) continue;

      let score = 0;
      const matchReasons: string[] = [];

      // Base score from completion percentage
      score += profile.completionPercentage * 0.3;

      // Skills matching
      if (criteria.skills && profile.skills) {
        const matchingSkills = criteria.skills.filter(skill => 
          profile.skills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()))
        );
        if (matchingSkills.length > 0) {
          score += (matchingSkills.length / criteria.skills.length) * 30;
          matchReasons.push(`${matchingSkills.length} matching skills`);
        }
      }

      // Industry matching
      if (criteria.industries && profile.industries) {
        const matchingIndustries = criteria.industries.filter(industry => 
          profile.industries.includes(industry)
        );
        if (matchingIndustries.length > 0) {
          score += (matchingIndustries.length / criteria.industries.length) * 20;
          matchReasons.push(`${matchingIndustries.length} matching industries`);
        }
      }

      // Location matching
      if (criteria.location && profile.location) {
        if (profile.location.toLowerCase().includes(criteria.location.toLowerCase())) {
          score += 15;
          matchReasons.push('Location match');
        }
      }

      // Verification bonus
      if (profile.isVerified) {
        score += 10;
        matchReasons.push('Verified profile');
      }

      // Recent activity bonus
      const daysSinceUpdate = (Date.now() - new Date(profile.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 5;
        matchReasons.push('Recently updated');
      }

      // Apply boost factors
      if (criteria.boost) {
        // Apply boost multipliers
        // TODO: Implement boost logic
      }

      scoredResults.push({
        id: profile.id,
        userId: profile.userId,
        headline: profile.headline,
        summary: profile.summary,
        location: profile.location,
        skills: profile.skills,
        industries: profile.industries,
        salaryExpectationMin: profile.salaryExpectationMin,
        salaryExpectationMax: profile.salaryExpectationMax,
        remotePreference: profile.remotePreference,
        isVerified: profile.isVerified,
        completionPercentage: profile.completionPercentage,
        updatedAt: profile.updatedAt,
        score: Math.min(score, 100), // Cap at 100
        matchReasons,
        contactable: true, // TODO: Check contact permissions
        lastActivity: profile.updatedAt
      });
    }

    // Sort by score descending
    return scoredResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate cache key for search criteria
   */
  private generateCacheKey(criteria: any, viewerUserId?: string): string {
    return `search:${JSON.stringify(criteria)}:${viewerUserId || 'anonymous'}`;
  }

  /**
   * Calculate top skills from results
   */
  private calculateTopSkills(results: SearchResult[]): Array<{ skill: string; count: number }> {
    const skillCounts = new Map<string, number>();
    
    results.forEach(result => {
      if (result.skills) {
        result.skills.forEach(skill => {
          skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        });
      }
    });

    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
  }

  /**
   * Calculate location distribution from results
   */
  private calculateLocationDistribution(results: SearchResult[]): Array<{ location: string; count: number }> {
    const locationCounts = new Map<string, number>();
    
    results.forEach(result => {
      if (result.location) {
        locationCounts.set(result.location, (locationCounts.get(result.location) || 0) + 1);
      }
    });

    return Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  }
}

// Export singleton instance
export const profileSearchService = new ProfileSearchService();