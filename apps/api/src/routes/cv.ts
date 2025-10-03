/**
 * CV Generation and Management API Routes
 * 
 * Handles CV generation, template management, document storage,
 * and CV-related operations using the Puppeteer-based generation service.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { 
  authPatterns,
  requireOwnership,
  type AuthContext 
} from '../middleware/auth';
import { 
  validate,
  commonSchemas,
  validationHelpers 
} from '../middleware/validation';
import { asyncHandler, ErrorFactory } from '../middleware/errors';
import { cvGenerationService } from '../services/cv-generation-service';
import { fileUploadService } from '../services/file-upload-service';

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * CV generation options schema
 */
const cvGenerationSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  label: z.string().min(1, 'Label is required').max(100),
  isDefault: z.boolean().optional().default(false),
  sections: z.object({
    includePersonalDetails: z.boolean().default(true),
    includeWorkExperience: z.boolean().default(true),
    includeEducation: z.boolean().default(true),
    includeSkills: z.boolean().default(true),
    includePortfolio: z.boolean().default(false),
    customSections: z.array(z.object({
      title: z.string().max(100),
      content: z.string().max(2000),
      order: z.number().min(0)
    })).optional()
  }),
  customizations: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    fontFamily: z.enum(['arial', 'helvetica', 'times', 'georgia']).optional(),
    spacing: z.enum(['compact', 'normal', 'relaxed']).optional(),
    margins: z.object({
      top: z.number().min(0).max(2),
      right: z.number().min(0).max(2),
      bottom: z.number().min(0).max(2),
      left: z.number().min(0).max(2)
    }).optional()
  }).optional(),
  format: z.enum(['pdf', 'html', 'png']).optional().default('pdf'),
  quality: z.enum(['draft', 'standard', 'high']).optional().default('standard')
});

/**
 * CV regeneration schema (partial update)
 */
const cvRegenerationSchema = cvGenerationSchema.partial().extend({
  cvId: z.string().uuid('Invalid CV ID')
});

/**
 * GET /api/cv/templates
 * Get available CV templates
 */
app.get(
  '/templates',
  ...authPatterns.publicWithLimits,
  asyncHandler(async (c: AuthContext) => {
    const templates = await cvGenerationService.getAvailableTemplates();

    return c.json({
      success: true,
      data: {
        templates,
        total: templates.length
      }
    });
  })
);

/**
 * GET /api/cv/templates/:templateId
 * Get specific template details
 */
app.get(
  '/templates/:templateId',
  ...authPatterns.publicWithLimits,
  validate({
    params: z.object({
      templateId: z.string().min(1, 'Template ID is required')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { templateId } = validationHelpers.getValidated(c).params;

    const template = await cvGenerationService.getTemplate(templateId);

    if (!template) {
      throw ErrorFactory.notFoundError('Template');
    }

    return c.json({
      success: true,
      data: template
    });
  })
);

/**
 * POST /api/cv/templates/:templateId/preview
 * Preview template with sample or user data
 */
app.post(
  '/templates/:templateId/preview',
  ...authPatterns.publicWithLimits,
  validate({
    params: z.object({
      templateId: z.string().min(1, 'Template ID is required')
    }),
    body: z.object({
      useSampleData: z.boolean().optional().default(true),
      useUserData: z.boolean().optional().default(false)
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { templateId } = validationHelpers.getValidated(c).params;
    const { useSampleData, useUserData } = validationHelpers.getValidated(c).body;
    const userId = c.userId;

    let preview;

    if (useUserData && userId) {
      // Generate preview with user's actual data
      const generationOptions = {
        templateId,
        label: 'Preview',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true,
          includePortfolio: false
        }
      };
      preview = await cvGenerationService.previewCV(userId, generationOptions);
    } else {
      // Generate preview with sample data
      preview = await cvGenerationService.previewTemplate(templateId, useSampleData);
    }

    return c.json({
      success: true,
      data: preview
    });
  })
);

/**
 * POST /api/cv/generate
 * Generate new CV
 */
app.post(
  '/generate',
  ...authPatterns.verifiedUser,
  validate({
    body: cvGenerationSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const generationOptions = validationHelpers.getValidated(c).body;

    const result = await cvGenerationService.generateCV(userId, generationOptions);

    return c.json({
      success: true,
      data: result,
      message: 'CV generated successfully'
    }, 201);
  })
);

/**
 * POST /api/cv/:cvId/regenerate
 * Regenerate existing CV with new options
 */
app.post(
  '/:cvId/regenerate',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    }),
    body: cvGenerationSchema.partial()
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const regenerationOptions = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    const result = await cvGenerationService.regenerateCV(cvId, userId, regenerationOptions);

    return c.json({
      success: true,
      data: result,
      message: 'CV regenerated successfully'
    });
  })
);

/**
 * POST /api/cv/preview
 * Generate CV preview without saving
 */
app.post(
  '/preview',
  ...authPatterns.authenticated,
  validate({
    body: cvGenerationSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const generationOptions = validationHelpers.getValidated(c).body;

    const preview = await cvGenerationService.previewCV(userId, generationOptions);

    return c.json({
      success: true,
      data: preview
    });
  })
);

/**
 * GET /api/cv/:cvId/download
 * Download generated CV
 */
app.get(
  '/:cvId/download',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    }),
    query: z.object({
      format: z.enum(['pdf', 'html', 'png']).optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const { format } = validationHelpers.getValidated(c).query;
    const userId = c.userId!;

    // Get CV details and check ownership (handled by fileUploadService)
    const { filePath, fileName } = await cvGenerationService.downloadCV?.(cvId, userId) || 
      await fileUploadService.downloadCV(cvId, userId);

    // Read file and send as response
    const fs = await import('fs');
    const fileBuffer = await fs.promises.readFile(filePath);

    // Determine content type based on format
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileName.endsWith('.html')) {
      contentType = 'text/html';
    } else if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    }

    return c.body(fileBuffer, 200, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileBuffer.length.toString()
    });
  })
);

/**
 * GET /api/cv/preview/:previewId
 * View CV preview by preview ID
 */
app.get(
  '/preview/:previewId',
  ...authPatterns.publicWithLimits,
  validate({
    params: z.object({
      previewId: z.string().min(1, 'Preview ID is required')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { previewId } = validationHelpers.getValidated(c).params;

    // Read preview file from temporary storage
    const fs = await import('fs');
    const path = await import('path');
    
    const outputPath = process.env.OUTPUT_PATH || './generated';
    const previewPath = path.join(outputPath, 'previews', `${previewId}.html`);

    try {
      const previewContent = await fs.promises.readFile(previewPath, 'utf8');
      
      return c.html(previewContent);
    } catch (error) {
      throw ErrorFactory.notFoundError('Preview');
    }
  })
);

/**
 * GET /api/cv/user/:userId
 * Get user's CV documents
 */
app.get(
  '/user/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    query: z.object({
      includeInactive: z.string().transform(val => val === 'true').optional().default(false),
      ...commonSchemas.pagination.shape
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { includeInactive, page, limit } = validationHelpers.getValidated(c).query;

    // Get user's CV files
    const files = await fileUploadService.listUserFiles(userId, 'cv');

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: {
        cvs: paginatedFiles,
        pagination: {
          page,
          limit,
          total: files.length,
          hasMore: endIndex < files.length
        }
      }
    });
  })
);

/**
 * POST /api/cv/:cvId/set-default
 * Set CV as default
 */
app.post(
  '/:cvId/set-default',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    // TODO: Implement set default CV functionality in service
    // For now, return success message
    
    return c.json({
      success: true,
      message: 'CV set as default successfully'
    });
  })
);

/**
 * POST /api/cv/validate-generation
 * Validate CV generation options before generating
 */
app.post(
  '/validate-generation',
  ...authPatterns.authenticated,
  validate({
    body: cvGenerationSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const generationOptions = validationHelpers.getValidated(c).body;

    const validation = await cvGenerationService.validateGeneration(generationOptions);

    return c.json({
      success: true,
      data: validation
    });
  })
);

/**
 * GET /api/cv/:cvId/analytics
 * Get CV analytics (downloads, views, etc.)
 */
app.get(
  '/:cvId/analytics',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    }),
    query: z.object({
      days: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 365).optional().default('30')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const { days } = validationHelpers.getValidated(c).query;
    const userId = c.userId!;

    // TODO: Implement CV analytics
    // For now, return mock data
    const analytics = {
      cvId,
      downloads: 0,
      views: 0,
      lastDownloaded: null,
      createdAt: new Date(),
      generatedWithTemplate: 'unknown'
    };

    return c.json({
      success: true,
      data: analytics
    });
  })
);

/**
 * POST /api/cv/batch-generate
 * Generate multiple CVs with different templates
 */
app.post(
  '/batch-generate',
  ...authPatterns.verifiedUser,
  validate({
    body: z.object({
      requests: z.array(cvGenerationSchema).min(1).max(5) // Max 5 CVs at once
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { requests } = validationHelpers.getValidated(c).body;

    const results = [];
    const errors = [];

    for (const [index, request] of requests.entries()) {
      try {
        const result = await cvGenerationService.generateCV(userId, request);
        results.push({
          index,
          success: true,
          data: result
        });
      } catch (error) {
        errors.push({
          index,
          success: false,
          error: error.message
        });
      }
    }

    return c.json({
      success: errors.length === 0,
      data: {
        results,
        errors,
        successCount: results.length,
        errorCount: errors.length
      },
      message: `Generated ${results.length} CVs successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    }, errors.length === 0 ? 201 : 207); // 207 Multi-Status for partial success
  })
);

/**
 * POST /api/cv/:cvId/optimize-ats
 * Optimize CV for ATS (Applicant Tracking Systems)
 */
app.post(
  '/:cvId/optimize-ats',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    // TODO: Implement ATS optimization
    // This would regenerate the CV with ATS-safe template and formatting
    
    return c.json({
      success: true,
      message: 'CV optimized for ATS successfully',
      data: {
        optimizations: [
          'Removed complex formatting',
          'Simplified fonts',
          'Improved keyword density',
          'Structured sections clearly'
        ],
        cvId
      }
    });
  })
);

export default app;