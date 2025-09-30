/**
 * Portfolio Management API Routes
 * 
 * Handles portfolio item CRUD operations, file uploads,
 * validation, and portfolio organization features.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { 
  authPatterns,
  optionalAuthMiddleware,
  requireOwnership,
  type AuthContext 
} from '../middleware/auth';
import { 
  validate,
  commonSchemas,
  validationHelpers 
} from '../middleware/validation';
import { asyncHandler, ErrorFactory } from '../middleware/errors';
import { portfolioService } from '../services/portfolio.service';

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * Portfolio item creation schema
 */
const portfolioCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK']),
  externalUrl: z.string().url('Invalid URL format').optional(),
  technologies: z.array(z.string().max(50)).max(20).optional(),
  projectDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  role: z.string().max(100).optional(),
  isPublic: z.boolean().optional().default(true),
  sortOrder: z.number().min(0).optional()
});

/**
 * Portfolio item update schema (partial)
 */
const portfolioUpdateSchema = portfolioCreateSchema.partial();

/**
 * GET /api/portfolio/user/:userId
 * Get portfolio items for a user
 */
app.get(
  '/user/:userId',
  optionalAuthMiddleware,
  validate({
    params: commonSchemas.userId,
    query: z.object({
      type: z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK']).optional(),
      public: z.string().transform(val => val === 'true').optional(),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 50).optional().default('20')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { type, public: publicOnly, limit } = validationHelpers.getValidated(c).query;
    const viewerUserId = c.userId;

    let items;

    if (publicOnly || viewerUserId !== userId) {
      // Get public items only
      items = await portfolioService.getPublicPortfolioItems(userId, limit);
    } else {
      // Get all items for owner
      items = await portfolioService.getPortfolioItems(userId, viewerUserId);
    }

    // Filter by type if specified
    if (type) {
      items = items.filter(item => item.type === type);
    }

    return c.json({
      success: true,
      data: {
        items: items.slice(0, limit),
        total: items.length,
        userId
      }
    });
  })
);

/**
 * POST /api/portfolio
 * Create new portfolio item
 */
app.post(
  '/',
  ...authPatterns.verifiedUser,
  validate({
    body: portfolioCreateSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const portfolioData = validationHelpers.getValidated(c).body;

    const portfolioItem = await portfolioService.createPortfolioItem(userId, portfolioData);

    return c.json({
      success: true,
      data: portfolioItem,
      message: 'Portfolio item created successfully'
    }, 201);
  })
);

/**
 * GET /api/portfolio/:itemId
 * Get specific portfolio item
 */
app.get(
  '/:itemId',
  optionalAuthMiddleware,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const viewerUserId = c.userId;

    const portfolioItem = await portfolioService.getPortfolioItem(itemId, viewerUserId);

    if (!portfolioItem) {
      throw ErrorFactory.notFoundError('Portfolio item');
    }

    return c.json({
      success: true,
      data: portfolioItem
    });
  })
);

/**
 * PUT /api/portfolio/:itemId
 * Update portfolio item
 */
app.put(
  '/:itemId',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    }),
    body: portfolioUpdateSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const updateData = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    const portfolioItem = await portfolioService.updatePortfolioItem(userId, itemId, updateData);

    return c.json({
      success: true,
      data: portfolioItem,
      message: 'Portfolio item updated successfully'
    });
  })
);

/**
 * DELETE /api/portfolio/:itemId
 * Delete portfolio item
 */
app.delete(
  '/:itemId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const success = await portfolioService.deletePortfolioItem(userId, itemId);

    if (!success) {
      throw ErrorFactory.notFoundError('Portfolio item');
    }

    return c.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });
  })
);

/**
 * POST /api/portfolio/:itemId/reorder
 * Reorder portfolio items
 */
app.post(
  '/reorder',
  ...authPatterns.authenticated,
  validate({
    body: z.object({
      itemIds: z.array(z.string().uuid()).min(1, 'At least one item ID required').max(50)
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemIds } = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    const success = await portfolioService.reorderPortfolioItems(userId, itemIds);

    if (!success) {
      throw ErrorFactory.businessLogicError('Failed to reorder portfolio items');
    }

    return c.json({
      success: true,
      message: 'Portfolio items reordered successfully'
    });
  })
);

/**
 * POST /api/portfolio/:itemId/upload-file
 * Upload file for portfolio item
 */
app.post(
  '/:itemId/upload-file',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw ErrorFactory.validationError('File is required');
    }

    // Convert File to Express.Multer.File format
    const buffer = await file.arrayBuffer();
    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      size: file.size,
      buffer: Buffer.from(buffer),
      stream: null as any,
      destination: '',
      filename: '',
      path: ''
    };

    const portfolioItem = await portfolioService.uploadPortfolioFile(userId, itemId, multerFile);

    return c.json({
      success: true,
      data: portfolioItem,
      message: 'File uploaded successfully'
    });
  })
);

/**
 * DELETE /api/portfolio/:itemId/file
 * Remove file from portfolio item
 */
app.delete(
  '/:itemId/file',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const portfolioItem = await portfolioService.removePortfolioFile(userId, itemId);

    return c.json({
      success: true,
      data: portfolioItem,
      message: 'File removed successfully'
    });
  })
);

/**
 * POST /api/portfolio/:itemId/validate
 * Validate portfolio item data and get suggestions
 */
app.post(
  '/:itemId/validate',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    // Get the portfolio item first
    const portfolioItem = await portfolioService.getPortfolioItem(itemId, userId);
    
    if (!portfolioItem) {
      throw ErrorFactory.notFoundError('Portfolio item');
    }

    // Validate the portfolio item
    const validation = await portfolioService.validatePortfolioItem(portfolioItem);

    return c.json({
      success: true,
      data: validation
    });
  })
);

/**
 * POST /api/portfolio/validate-url
 * Validate external URL for portfolio item
 */
app.post(
  '/validate-url',
  ...authPatterns.authenticated,
  validate({
    body: z.object({
      url: z.string().url('Invalid URL format')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { url } = validationHelpers.getValidated(c).body;

    const validation = await portfolioService.validateExternalUrl(url);

    return c.json({
      success: true,
      data: validation
    });
  })
);

/**
 * POST /api/portfolio/generate-preview
 * Generate URL preview metadata
 */
app.post(
  '/generate-preview',
  ...authPatterns.authenticated,
  validate({
    body: z.object({
      url: z.string().url('Invalid URL format')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { url } = validationHelpers.getValidated(c).body;

    const preview = await portfolioService.generateUrlPreview(url);

    return c.json({
      success: true,
      data: preview
    });
  })
);

/**
 * GET /api/portfolio/search
 * Search portfolio items across all users
 */
app.get(
  '/search',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      q: z.string().min(2, 'Query must be at least 2 characters').max(200),
      type: z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK']).optional(),
      technologies: z.string().optional(), // Comma-separated list
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 50).optional().default('20')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { q: query, type, technologies, limit } = validationHelpers.getValidated(c).query;

    const filters: any = {};
    if (type) filters.type = type;
    if (technologies) filters.technologies = technologies.split(',').map(t => t.trim());

    const results = await portfolioService.searchPortfolioItems(query, filters);

    return c.json({
      success: true,
      data: {
        results: results.slice(0, limit),
        total: results.length,
        query,
        filters
      }
    });
  })
);

/**
 * GET /api/portfolio/:itemId/related
 * Get related portfolio items
 */
app.get(
  '/:itemId/related',
  optionalAuthMiddleware,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    }),
    query: z.object({
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('5')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const { limit } = validationHelpers.getValidated(c).query;

    const relatedItems = await portfolioService.getRelatedPortfolioItems(itemId, limit);

    return c.json({
      success: true,
      data: {
        items: relatedItems,
        referenceItemId: itemId
      }
    });
  })
);

/**
 * GET /api/portfolio/trending
 * Get trending portfolio items
 */
app.get(
  '/trending',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 50).optional().default('20'),
      timeframe: z.enum(['day', 'week', 'month']).optional().default('week')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { limit, timeframe } = validationHelpers.getValidated(c).query;

    const trendingItems = await portfolioService.getTrendingPortfolioItems(limit);

    return c.json({
      success: true,
      data: {
        items: trendingItems,
        timeframe,
        generatedAt: new Date()
      }
    });
  })
);

/**
 * GET /api/portfolio/user/:userId/stats
 * Get portfolio statistics for user
 */
app.get(
  '/user/:userId/stats',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const stats = await portfolioService.getPortfolioStats(userId);

    return c.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/portfolio/user/:userId/score
 * Get portfolio quality score
 */
app.get(
  '/user/:userId/score',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const score = await portfolioService.calculatePortfolioScore(userId);

    return c.json({
      success: true,
      data: {
        score,
        maxScore: 100,
        userId
      }
    });
  })
);

/**
 * GET /api/portfolio/user/:userId/suggestions
 * Get portfolio improvement suggestions
 */
app.get(
  '/user/:userId/suggestions',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const suggestions = await portfolioService.getPortfolioSuggestions(userId);

    return c.json({
      success: true,
      data: {
        suggestions,
        userId
      }
    });
  })
);

/**
 * POST /api/portfolio/import/github
 * Import portfolio items from GitHub
 */
app.post(
  '/import/github',
  ...authPatterns.verifiedUser,
  validate({
    body: z.object({
      githubUsername: z.string().min(1, 'GitHub username is required').max(100),
      selectRepos: z.array(z.string()).optional(), // Optional: specific repos to import
      makePrivate: z.boolean().optional().default(false)
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { githubUsername, selectRepos, makePrivate } = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    const importedItems = await portfolioService.importFromGitHub(userId, githubUsername);

    // TODO: Handle selectRepos and makePrivate options

    return c.json({
      success: true,
      data: {
        importedItems,
        count: importedItems.length,
        githubUsername
      },
      message: `Successfully imported ${importedItems.length} repositories from GitHub`
    }, 201);
  })
);

/**
 * POST /api/portfolio/export
 * Export portfolio data
 */
app.post(
  '/export',
  ...authPatterns.authenticated,
  validate({
    body: z.object({
      format: z.enum(['json', 'pdf', 'html']).default('json'),
      includePrivate: z.boolean().default(true),
      includeFiles: z.boolean().default(false)
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { format, includePrivate, includeFiles } = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    const exportData = await portfolioService.exportPortfolio(userId, format);

    if (format === 'json') {
      return c.json({
        success: true,
        data: JSON.parse(exportData as string)
      });
    } else {
      // For PDF/HTML, return as file download
      const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
      const filename = `portfolio-export.${format}`;

      return c.body(exportData as Buffer, 200, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      });
    }
  })
);

/**
 * POST /api/portfolio/:itemId/analytics/view
 * Track portfolio item view
 */
app.post(
  '/:itemId/analytics/view',
  optionalAuthMiddleware,
  validate({
    params: z.object({
      itemId: z.string().uuid('Invalid portfolio item ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { itemId } = validationHelpers.getValidated(c).params;
    const viewerUserId = c.userId;

    await portfolioService.trackPortfolioView(itemId, viewerUserId);

    return c.json({
      success: true,
      message: 'View tracked successfully'
    });
  })
);

export default app;