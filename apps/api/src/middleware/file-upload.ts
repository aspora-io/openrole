/**
 * File Upload Middleware
 * 
 * Handles file upload validation, security checks, and processing
 * for CV documents, portfolio files, and profile images.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { ErrorFactory } from './errors';

// File upload configuration
export const UPLOAD_CONFIG = {
  // Maximum file sizes (in bytes)
  maxSizes: {
    cv: 10 * 1024 * 1024,      // 10MB for CV documents
    portfolio: 50 * 1024 * 1024, // 50MB for portfolio files
    avatar: 5 * 1024 * 1024,    // 5MB for profile images
    general: 25 * 1024 * 1024   // 25MB general limit
  },
  
  // Allowed MIME types
  allowedTypes: {
    cv: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    portfolio: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/zip',
      'video/mp4',
      'video/webm'
    ],
    avatar: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ],
    general: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain'
    ]
  },

  // Dangerous file extensions to block
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', 
    '.js', '.jar', '.sh', '.ps1', '.php', '.asp', '.jsp'
  ]
};

/**
 * File validation schema
 */
const fileValidationSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().positive(),
  type: z.string().min(1)
});

/**
 * Check if file extension is dangerous
 */
function isDangerousExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return UPLOAD_CONFIG.blockedExtensions.includes(extension);
}

/**
 * Validate file against security rules
 */
function validateFileSecurity(file: File): void {
  // Check for dangerous extensions
  if (isDangerousExtension(file.name)) {
    throw ErrorFactory.validationError(
      'File type not allowed for security reasons',
      { filename: file.name }
    );
  }

  // Check for null bytes (security issue)
  if (file.name.includes('\0')) {
    throw ErrorFactory.validationError(
      'Invalid filename detected',
      { filename: file.name }
    );
  }

  // Check for path traversal attempts
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw ErrorFactory.validationError(
      'Invalid filename: path traversal detected',
      { filename: file.name }
    );
  }
}

/**
 * File upload middleware factory
 */
export function createFileUploadMiddleware(
  fileType: keyof typeof UPLOAD_CONFIG.maxSizes,
  options: {
    required?: boolean;
    fieldName?: string;
    multiple?: boolean;
  } = {}
) {
  const {
    required = true,
    fieldName = 'file',
    multiple = false
  } = options;

  return async (c: Context, next: Next) => {
    try {
      // Get form data
      const formData = await c.req.formData();
      
      if (multiple) {
        const files = formData.getAll(fieldName) as File[];
        
        if (required && files.length === 0) {
          throw ErrorFactory.validationError(`${fieldName} is required`);
        }

        // Validate each file
        const validatedFiles: File[] = [];
        
        for (const file of files) {
          if (file && file.size > 0) {
            await validateFile(file, fileType);
            validatedFiles.push(file);
          }
        }

        // Set validated files in context
        c.set('uploadedFiles', validatedFiles);
        
      } else {
        const file = formData.get(fieldName) as File;
        
        if (required && (!file || file.size === 0)) {
          throw ErrorFactory.validationError(`${fieldName} is required`);
        }

        if (file && file.size > 0) {
          await validateFile(file, fileType);
          c.set('uploadedFile', file);
        }
      }

      await next();
      
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      throw ErrorFactory.validationError(
        'File upload validation failed',
        { error: error.message }
      );
    }
  };
}

/**
 * Validate individual file
 */
async function validateFile(file: File, fileType: keyof typeof UPLOAD_CONFIG.maxSizes): Promise<void> {
  // Basic validation
  const validation = fileValidationSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type
  });

  if (!validation.success) {
    throw ErrorFactory.validationError(
      'Invalid file format',
      { errors: validation.error.errors }
    );
  }

  // Security validation
  validateFileSecurity(file);

  // Size validation
  const maxSize = UPLOAD_CONFIG.maxSizes[fileType];
  if (file.size > maxSize) {
    throw ErrorFactory.validationError(
      `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      { 
        fileSize: file.size,
        maxSize,
        filename: file.name
      }
    );
  }

  // MIME type validation
  const allowedTypes = UPLOAD_CONFIG.allowedTypes[fileType];
  if (!allowedTypes.includes(file.type)) {
    throw ErrorFactory.validationError(
      `File type '${file.type}' is not allowed for ${fileType} uploads`,
      { 
        fileType: file.type,
        allowedTypes,
        filename: file.name
      }
    );
  }

  // Additional file content validation
  await validateFileContent(file, fileType);
}

/**
 * Validate file content (beyond MIME type)
 */
async function validateFileContent(file: File, fileType: keyof typeof UPLOAD_CONFIG.maxSizes): Promise<void> {
  // For security, read first few bytes to verify file signature
  const buffer = await file.slice(0, 512).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Basic file signature validation
  if (file.type === 'application/pdf') {
    // PDF files should start with %PDF
    const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
    if (!arrayStartsWith(bytes, pdfSignature)) {
      throw ErrorFactory.validationError(
        'File appears to be corrupted or not a valid PDF',
        { filename: file.name }
      );
    }
  }

  if (file.type.startsWith('image/')) {
    // Basic image file validation
    const jpegSignature = [0xFF, 0xD8, 0xFF];
    const pngSignature = [0x89, 0x50, 0x4E, 0x47];
    const webpSignature = [0x52, 0x49, 0x46, 0x46]; // RIFF (WebP container)
    
    const isValidImage = 
      arrayStartsWith(bytes, jpegSignature) ||
      arrayStartsWith(bytes, pngSignature) ||
      arrayStartsWith(bytes, webpSignature);

    if (!isValidImage) {
      throw ErrorFactory.validationError(
        'File appears to be corrupted or not a valid image',
        { filename: file.name, fileType: file.type }
      );
    }
  }
}

/**
 * Helper function to check if array starts with specific bytes
 */
function arrayStartsWith(array: Uint8Array, signature: number[]): boolean {
  if (array.length < signature.length) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (array[i] !== signature[i]) return false;
  }
  
  return true;
}

/**
 * Virus scanning middleware (placeholder for integration with external service)
 */
export async function virusScanMiddleware(c: Context, next: Next) {
  // TODO: Integrate with virus scanning service (ClamAV, VirusTotal, etc.)
  // For now, just log that scanning would happen here
  
  const file = c.get('uploadedFile') as File;
  const files = c.get('uploadedFiles') as File[];
  
  if (file) {
    console.log(`[SECURITY] Virus scan placeholder for file: ${file.name}`);
    // In production, implement actual virus scanning here
  }
  
  if (files && files.length > 0) {
    for (const f of files) {
      console.log(`[SECURITY] Virus scan placeholder for file: ${f.name}`);
      // In production, implement actual virus scanning here
    }
  }
  
  await next();
}

/**
 * File upload rate limiting middleware
 */
export function createFileUploadRateLimit(options: {
  maxUploadsPerHour?: number;
  maxSizePerHour?: number; // in bytes
} = {}) {
  const {
    maxUploadsPerHour = 50,
    maxSizePerHour = 500 * 1024 * 1024 // 500MB
  } = options;

  // In-memory store (in production, use Redis)
  const userUploadTracking = new Map<string, {
    count: number;
    totalSize: number;
    resetTime: number;
  }>();

  return async (c: Context, next: Next) => {
    const userId = c.get('userId') as string;
    
    if (!userId) {
      throw ErrorFactory.authenticationError('Authentication required for file uploads');
    }

    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    
    // Get or create tracking entry
    let tracking = userUploadTracking.get(userId);
    
    if (!tracking || now > tracking.resetTime) {
      tracking = {
        count: 0,
        totalSize: 0,
        resetTime: now + hourInMs
      };
      userUploadTracking.set(userId, tracking);
    }

    // Check upload count limit
    if (tracking.count >= maxUploadsPerHour) {
      throw ErrorFactory.rateLimitError(
        'Upload limit exceeded. Please try again later.',
        { limit: maxUploadsPerHour, resetTime: tracking.resetTime }
      );
    }

    // Calculate upload size
    const file = c.get('uploadedFile') as File;
    const files = c.get('uploadedFiles') as File[];
    
    let uploadSize = 0;
    if (file) uploadSize = file.size;
    if (files) uploadSize = files.reduce((sum, f) => sum + f.size, 0);

    // Check size limit
    if (tracking.totalSize + uploadSize > maxSizePerHour) {
      throw ErrorFactory.rateLimitError(
        'Upload size limit exceeded. Please try again later.',
        { 
          sizeLimit: maxSizePerHour,
          currentSize: tracking.totalSize,
          requestSize: uploadSize,
          resetTime: tracking.resetTime
        }
      );
    }

    // Update tracking
    tracking.count += 1;
    tracking.totalSize += uploadSize;

    await next();
  };
}

/**
 * Pre-configured middleware exports
 */
export const fileUploadMiddleware = {
  cv: createFileUploadMiddleware('cv'),
  portfolio: createFileUploadMiddleware('portfolio'),
  avatar: createFileUploadMiddleware('avatar'),
  general: createFileUploadMiddleware('general'),
  
  // Multiple file uploads
  portfolioMultiple: createFileUploadMiddleware('portfolio', { multiple: true }),
  
  // Optional uploads
  cvOptional: createFileUploadMiddleware('cv', { required: false }),
  portfolioOptional: createFileUploadMiddleware('portfolio', { required: false }),
  
  // With virus scanning
  cvSecure: [createFileUploadMiddleware('cv'), virusScanMiddleware],
  portfolioSecure: [createFileUploadMiddleware('portfolio'), virusScanMiddleware],
  
  // With rate limiting
  cvWithRateLimit: [
    createFileUploadRateLimit({ maxUploadsPerHour: 20, maxSizePerHour: 200 * 1024 * 1024 }),
    createFileUploadMiddleware('cv')
  ],
  portfolioWithRateLimit: [
    createFileUploadRateLimit({ maxUploadsPerHour: 30, maxSizePerHour: 300 * 1024 * 1024 }),
    createFileUploadMiddleware('portfolio')
  ]
};

export default fileUploadMiddleware;