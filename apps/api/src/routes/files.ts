/**
 * File Upload and Management API Routes
 * 
 * Handles file uploads, downloads, and management for CVs,
 * portfolio items, and profile images with security validation.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Hono } from 'hono';
import { z } from 'zod';
import multer from 'multer';
import { 
  authPatterns,
  requireOwnership,
  type AuthContext 
} from '../middleware/auth';
import { 
  validate,
  commonSchemas,
  validateRequestSize,
  validateContentType,
  validationHelpers 
} from '../middleware/validation';
import { asyncHandler, ErrorFactory } from '../middleware/errors';
import { fileUploadService } from '../services/file-upload-service';

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1 // Single file per request
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation - more detailed validation in service
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

/**
 * POST /api/files/cv/upload
 * Upload CV document
 */
app.post(
  '/cv/upload',
  ...authPatterns.verifiedUser,
  validateRequestSize(10 * 1024 * 1024), // 10MB limit for CVs
  validateContentType(['multipart/form-data']),
  // Note: In Hono, we need to handle multer differently
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const label = formData.get('label') as string;
    const isDefault = formData.get('isDefault') === 'true';

    if (!file) {
      throw ErrorFactory.validationError('File is required');
    }

    if (!label) {
      throw ErrorFactory.validationError('Label is required');
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

    const result = await fileUploadService.uploadCV(userId, multerFile, label, isDefault);

    return c.json({
      success: true,
      data: result,
      message: 'CV uploaded successfully'
    }, 201);
  })
);

/**
 * GET /api/files/cv/:cvId/download
 * Download CV document
 */
app.get(
  '/cv/:cvId/download',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const { filePath, fileName } = await fileUploadService.downloadCV(cvId, userId);

    // Read file and send as response
    const fs = await import('fs');
    const fileBuffer = await fs.promises.readFile(filePath);

    return c.body(fileBuffer, 200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileBuffer.length.toString()
    });
  })
);

/**
 * PUT /api/files/cv/:cvId/replace
 * Replace existing CV with new file
 */
app.put(
  '/cv/:cvId/replace',
  ...authPatterns.verifiedUser,
  validateRequestSize(10 * 1024 * 1024),
  validateContentType(['multipart/form-data']),
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
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

    const result = await fileUploadService.replaceCV(cvId, userId, multerFile);

    return c.json({
      success: true,
      data: result,
      message: 'CV replaced successfully'
    });
  })
);

/**
 * DELETE /api/files/cv/:cvId
 * Delete CV document
 */
app.delete(
  '/cv/:cvId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      cvId: z.string().uuid('Invalid CV ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { cvId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const success = await fileUploadService.deleteCV(cvId, userId);

    if (!success) {
      throw ErrorFactory.notFoundError('CV');
    }

    return c.json({
      success: true,
      message: 'CV deleted successfully'
    });
  })
);

/**
 * POST /api/files/portfolio/upload
 * Upload portfolio file
 */
app.post(
  '/portfolio/upload',
  ...authPatterns.verifiedUser,
  validateRequestSize(20 * 1024 * 1024), // 20MB limit for portfolio files
  validateContentType(['multipart/form-data']),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;

    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const portfolioId = formData.get('portfolioId') as string;
    const portfolioType = formData.get('portfolioType') as string;

    if (!file) {
      throw ErrorFactory.validationError('File is required');
    }

    if (!portfolioId) {
      throw ErrorFactory.validationError('Portfolio ID is required');
    }

    if (!portfolioType) {
      throw ErrorFactory.validationError('Portfolio type is required');
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

    const result = await fileUploadService.uploadPortfolioFile(
      userId,
      multerFile,
      portfolioId,
      portfolioType
    );

    return c.json({
      success: true,
      data: result,
      message: 'Portfolio file uploaded successfully'
    }, 201);
  })
);

/**
 * GET /api/files/portfolio/:portfolioId/download
 * Download portfolio file
 */
app.get(
  '/portfolio/:portfolioId/download',
  ...authPatterns.publicWithLimits,
  validate({
    params: z.object({
      portfolioId: z.string().uuid('Invalid portfolio ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { portfolioId } = validationHelpers.getValidated(c).params;
    const viewerUserId = c.userId;

    // For portfolio files, we need to check if the portfolio is public
    // or if the viewer is the owner
    try {
      const { filePath, fileName } = await fileUploadService.downloadPortfolioFile(
        portfolioId,
        viewerUserId || 'anonymous'
      );

      // Read file and send as response
      const fs = await import('fs');
      const fileBuffer = await fs.promises.readFile(filePath);

      return c.body(fileBuffer, 200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      });
    } catch (error) {
      throw ErrorFactory.notFoundError('Portfolio file');
    }
  })
);

/**
 * DELETE /api/files/portfolio/:portfolioId
 * Delete portfolio file
 */
app.delete(
  '/portfolio/:portfolioId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      portfolioId: z.string().uuid('Invalid portfolio ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { portfolioId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const success = await fileUploadService.deletePortfolioFile(portfolioId, userId);

    if (!success) {
      throw ErrorFactory.notFoundError('Portfolio file');
    }

    return c.json({
      success: true,
      message: 'Portfolio file deleted successfully'
    });
  })
);

/**
 * POST /api/files/profile-image/upload
 * Upload profile image
 */
app.post(
  '/profile-image/upload',
  ...authPatterns.verifiedUser,
  validateRequestSize(5 * 1024 * 1024), // 5MB limit for images
  validateContentType(['multipart/form-data']),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;

    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw ErrorFactory.validationError('File is required');
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
      throw ErrorFactory.validationError('File must be an image');
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

    const result = await fileUploadService.uploadProfileImage(userId, multerFile);

    return c.json({
      success: true,
      data: result,
      message: 'Profile image uploaded successfully'
    }, 201);
  })
);

/**
 * DELETE /api/files/profile-image
 * Delete profile image
 */
app.delete(
  '/profile-image',
  ...authPatterns.authenticated,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;

    const success = await fileUploadService.deleteProfileImage(userId);

    if (!success) {
      throw ErrorFactory.notFoundError('Profile image');
    }

    return c.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  })
);

/**
 * GET /api/files/storage-quota
 * Get user's storage quota and usage
 */
app.get(
  '/storage-quota',
  ...authPatterns.authenticated,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;

    const quota = await fileUploadService.getStorageQuota(userId);

    return c.json({
      success: true,
      data: quota
    });
  })
);

/**
 * GET /api/files/list
 * List user's files
 */
app.get(
  '/list',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      type: z.enum(['cv', 'portfolio', 'image']).optional(),
      page: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1).optional().default('1'),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 50).optional().default('20')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { type, page, limit } = validationHelpers.getValidated(c).query;

    const files = await fileUploadService.listUserFiles(userId, type);

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: {
        files: paginatedFiles,
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
 * GET /api/files/:fileId/info
 * Get file information
 */
app.get(
  '/:fileId/info',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      fileId: z.string().uuid('Invalid file ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { fileId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const fileInfo = await fileUploadService.getFileInfo(fileId, userId);

    if (!fileInfo) {
      throw ErrorFactory.notFoundError('File');
    }

    return c.json({
      success: true,
      data: fileInfo
    });
  })
);

/**
 * POST /api/files/validate
 * Validate file before upload (client-side validation support)
 */
app.post(
  '/validate',
  ...authPatterns.authenticated,
  validateContentType(['multipart/form-data']),
  asyncHandler(async (c: AuthContext) => {
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string; // 'cv', 'portfolio', 'image'

    if (!file) {
      throw ErrorFactory.validationError('File is required');
    }

    if (!fileType) {
      throw ErrorFactory.validationError('File type is required');
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

    // Determine validation options based on file type
    let validationOptions;
    switch (fileType) {
      case 'cv':
        validationOptions = {
          maxSizeBytes: 10 * 1024 * 1024,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ],
          performVirusScan: true,
          extractMetadata: true
        };
        break;
      case 'portfolio':
        validationOptions = {
          maxSizeBytes: 20 * 1024 * 1024,
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/zip',
            'text/plain'
          ],
          performVirusScan: true,
          extractMetadata: true
        };
        break;
      case 'image':
        validationOptions = {
          maxSizeBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          performVirusScan: false,
          extractMetadata: true
        };
        break;
      default:
        throw ErrorFactory.validationError('Invalid file type');
    }

    const validation = await fileUploadService.validateFile(multerFile, validationOptions);

    return c.json({
      success: true,
      data: {
        validation,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      }
    });
  })
);

export default app;