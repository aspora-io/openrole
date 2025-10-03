/**
 * Search and Discovery API Routes
 * 
 * Handles advanced profile search, discovery features,
 * and search analytics for the platform.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { 
  optionalAuthMiddleware,
  authPatterns,
  requireRole,
  type AuthContext 
} from '../middleware/auth';
import { 
  validate,
  commonSchemas,
  validationHelpers 
} from '../middleware/validation';
import { asyncHandler, ErrorFactory } from '../middleware/errors';
import { profileSearchService } from '../services/profile-search-service';

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * Advanced search criteria schema
 */
const advancedSearchSchema = z.object({
  // Basic search
  query: z.string().max(200).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
  industries: z.array(z.string().max(50)).max(10).optional(),
  location: z.string().max(100).optional(),
  remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ON_SITE', 'NO_PREFERENCE']).optional(),

  // Salary filters
  salaryMin: z.number().min(0).max(1000000).optional(),
  salaryMax: z.number().min(0).max(1000000).optional(),
  currency: z.string().length(3).optional().default('USD'),

  // Experience filters
  minYearsExperience: z.number().min(0).max(50).optional(),
  maxYearsExperience: z.number().min(0).max(50).optional(),
  companySizes: z.array(z.enum(['startup', 'small', 'medium', 'large', 'enterprise'])).optional(),

  // Education filters
  educationLevels: z.array(z.enum(['high_school', 'associate', 'bachelor', 'master', 'phd', 'certificate'])).optional(),
  universities: z.array(z.string().max(100)).max(10).optional(),
  graduationYearFrom: z.number().min(1950).max(new Date().getFullYear()).optional(),
  graduationYearTo: z.number().min(1950).max(new Date().getFullYear()).optional(),

  // Portfolio filters
  portfolioTypes: z.array(z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK'])).optional(),
  hasPortfolio: z.boolean().optional(),

  // Quality filters
  minCompletionPercentage: z.number().min(0).max(100).optional(),
  verifiedOnly: z.boolean().optional(),
  recentlyUpdated: z.boolean().optional(),

  // Availability filters
  availableImmediately: z.boolean().optional(),
  noticePeriod: z.number().min(0).max(52).optional(), // weeks

  // Location-based
  locationRadius: z.number().min(1).max(500).optional(), // kilometers
  locationCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),

  // Pagination and sorting
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(20),
  rankBy: z.enum(['relevance', 'experience', 'education', 'completion', 'recent']).optional().default('relevance'),
  
  // Boost factors
  boost: z.object({
    skills: z.number().min(0.1).max(10).optional(),
    location: z.number().min(0.1).max(10).optional(),
    experience: z.number().min(0.1).max(10).optional()
  }).optional()
}).refine(data => {
  // Validate salary range
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
}, {
  message: 'Minimum salary must be less than or equal to maximum salary'
}).refine(data => {
  // Validate experience range
  if (data.minYearsExperience && data.maxYearsExperience) {
    return data.minYearsExperience <= data.maxYearsExperience;
  }
  return true;
}, {
  message: 'Minimum experience must be less than or equal to maximum experience'
}).refine(data => {
  // Validate graduation year range
  if (data.graduationYearFrom && data.graduationYearTo) {
    return data.graduationYearFrom <= data.graduationYearTo;
  }
  return true;
}, {
  message: 'Graduation year from must be less than or equal to graduation year to'
});

/**
 * POST /api/search/profiles
 * Advanced profile search with detailed filtering
 */
app.post(
  '/profiles',
  ...authPatterns.publicWithLimits,
  validate({
    body: advancedSearchSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const searchCriteria = validationHelpers.getValidated(c).body;
    const viewerUserId = c.userId;

    const results = await profileSearchService.searchProfiles(searchCriteria, viewerUserId);

    return c.json({
      success: true,
      data: {
        results,
        pagination: {
          page: searchCriteria.page,
          limit: searchCriteria.limit,
          total: results.length,
          hasMore: results.length === searchCriteria.limit
        },
        criteria: searchCriteria
      }
    });
  })
);

/**
 * POST /api/search/profiles/analytics
 * Advanced search with detailed analytics
 */
app.post(
  '/profiles/analytics',
  ...authPatterns.candidateOrAdmin,
  validate({
    body: advancedSearchSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const searchCriteria = validationHelpers.getValidated(c).body;
    const viewerUserId = c.userId;

    const { results, analytics } = await profileSearchService.searchWithAnalytics(
      searchCriteria, 
      viewerUserId
    );

    return c.json({
      success: true,
      data: {
        results,
        analytics,
        pagination: {
          page: searchCriteria.page,
          limit: searchCriteria.limit,
          total: results.length,
          hasMore: results.length === searchCriteria.limit
        }
      }
    });
  })
);

/**
 * GET /api/search/quick
 * Quick text-based search across profiles
 */
app.get(
  '/quick',
  ...authPatterns.publicWithLimits,
  validate({
    query: z.object({
      q: z.string().min(2, 'Query must be at least 2 characters').max(200),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 50).optional().default('20')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { q: query, limit } = validationHelpers.getValidated(c).query;
    const viewerUserId = c.userId;

    const results = await profileSearchService.quickSearch(query, viewerUserId);

    return c.json({
      success: true,
      data: {
        results: results.slice(0, limit),
        query,
        total: results.length
      }
    });
  })
);

/**
 * GET /api/search/similar/:profileId
 * Find profiles similar to a given profile
 */
app.get(
  '/similar/:profileId',
  optionalAuthMiddleware,
  validate({
    params: z.object({
      profileId: z.string().uuid('Invalid profile ID')
    }),
    query: z.object({
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { profileId } = validationHelpers.getValidated(c).params;
    const { limit } = validationHelpers.getValidated(c).query;

    const results = await profileSearchService.similarProfiles(profileId, limit);

    return c.json({
      success: true,
      data: {
        results,
        referenceProfileId: profileId,
        total: results.length
      }
    });
  })
);

/**
 * GET /api/search/suggestions/skills
 * Get skill suggestions for auto-complete
 */
app.get(
  '/suggestions/skills',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      q: z.string().min(1).max(50),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { q: query, limit } = validationHelpers.getValidated(c).query;

    const suggestions = await profileSearchService.suggestSkills(query, limit);

    return c.json({
      success: true,
      data: {
        suggestions,
        query,
        type: 'skills'
      }
    });
  })
);

/**
 * GET /api/search/suggestions/locations
 * Get location suggestions for auto-complete
 */
app.get(
  '/suggestions/locations',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      q: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { q: query, limit } = validationHelpers.getValidated(c).query;

    const suggestions = await profileSearchService.suggestLocations(query, limit);

    return c.json({
      success: true,
      data: {
        suggestions,
        query,
        type: 'locations'
      }
    });
  })
);

/**
 * GET /api/search/suggestions/companies
 * Get company suggestions for auto-complete
 */
app.get(
  '/suggestions/companies',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      q: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { q: query, limit } = validationHelpers.getValidated(c).query;

    const suggestions = await profileSearchService.suggestCompanies(query, limit);

    return c.json({
      success: true,
      data: {
        suggestions,
        query,
        type: 'companies'
      }
    });
  })
);

/**
 * GET /api/search/trending
 * Get trending search terms and popular profiles
 */
app.get(
  '/trending',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      type: z.enum(['searches', 'profiles', 'skills']).optional().default('profiles'),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 50).optional().default('20'),
      timeframe: z.enum(['day', 'week', 'month']).optional().default('week')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { type, limit, timeframe } = validationHelpers.getValidated(c).query;

    let trendingData;

    switch (type) {
      case 'searches':
        trendingData = await profileSearchService.getPopularSearchTerms(limit);
        break;
      case 'profiles':
        trendingData = await profileSearchService.getTrendingPortfolioItems(limit);
        break;
      case 'skills':
        // TODO: Implement trending skills
        trendingData = [];
        break;
    }

    return c.json({
      success: true,
      data: {
        trending: trendingData,
        type,
        timeframe,
        generatedAt: new Date()
      }
    });
  })
);

/**
 * GET /api/search/saved
 * Get user's saved searches
 */
app.get(
  '/saved',
  ...authPatterns.authenticated,
  validate({
    query: commonSchemas.pagination
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const pagination = validationHelpers.getValidated(c).query;

    const savedSearches = await profileSearchService.getSavedSearches(userId);

    return c.json({
      success: true,
      data: {
        searches: savedSearches,
        pagination
      }
    });
  })
);

/**
 * POST /api/search/saved
 * Save a search for later use
 */
app.post(
  '/saved',
  ...authPatterns.authenticated,
  validate({
    body: z.object({
      name: z.string().min(1).max(100),
      criteria: advancedSearchSchema,
      enableAlerts: z.boolean().optional().default(false)
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { name, criteria, enableAlerts } = validationHelpers.getValidated(c).body;

    const savedSearch = await profileSearchService.saveSearch(userId, name, criteria);

    if (enableAlerts) {
      await profileSearchService.enableSearchAlerts(savedSearch.id, userId);
    }

    return c.json({
      success: true,
      data: savedSearch,
      message: 'Search saved successfully'
    }, 201);
  })
);

/**
 * POST /api/search/saved/:searchId/execute
 * Execute a saved search
 */
app.post(
  '/saved/:searchId/execute',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      searchId: z.string().uuid('Invalid search ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { searchId } = validationHelpers.getValidated(c).params;

    const results = await profileSearchService.executeSavedSearch(searchId, userId);

    return c.json({
      success: true,
      data: {
        results,
        searchId,
        executedAt: new Date()
      }
    });
  })
);

/**
 * DELETE /api/search/saved/:searchId
 * Delete a saved search
 */
app.delete(
  '/saved/:searchId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      searchId: z.string().uuid('Invalid search ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { searchId } = validationHelpers.getValidated(c).params;

    const success = await profileSearchService.deleteSavedSearch(searchId, userId);

    if (!success) {
      throw ErrorFactory.notFoundError('Saved search');
    }

    return c.json({
      success: true,
      message: 'Saved search deleted successfully'
    });
  })
);

/**
 * POST /api/search/saved/:searchId/alerts
 * Enable/disable alerts for a saved search
 */
app.post(
  '/saved/:searchId/alerts',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      searchId: z.string().uuid('Invalid search ID')
    }),
    body: z.object({
      enabled: z.boolean()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { searchId } = validationHelpers.getValidated(c).params;
    const { enabled } = validationHelpers.getValidated(c).body;

    const savedSearch = enabled 
      ? await profileSearchService.enableSearchAlerts(searchId, userId)
      : await profileSearchService.disableSearchAlerts(searchId, userId);

    return c.json({
      success: true,
      data: savedSearch,
      message: `Search alerts ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  })
);

/**
 * GET /api/search/analytics
 * Get search analytics and insights
 */
app.get(
  '/analytics',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      days: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 365).optional().default('30')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { days } = validationHelpers.getValidated(c).query;

    const analytics = await profileSearchService.getSearchAnalytics(userId, days);

    return c.json({
      success: true,
      data: analytics
    });
  })
);

export default app;