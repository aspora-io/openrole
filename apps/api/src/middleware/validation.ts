/**
 * Request Validation Middleware - Zod-based validation for API requests
 * 
 * Provides comprehensive request validation for body, query parameters,
 * and path parameters with detailed error reporting and sanitization.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z, ZodSchema, ZodError } from 'zod';
import { 
  profileSchemas,
  cvSchemas,
  portfolioSchemas,
  validateProfileData,
  validateCVData,
  validatePortfolioData,
  ValidationResult 
} from '@openrole/validation';

/**
 * Validation configuration interface
 */
export interface ValidationConfig {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
  headers?: ZodSchema<any>;
  sanitize?: boolean;
  stripUnknown?: boolean;
  allowPartial?: boolean;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validation middleware factory
 */
export const validate = (config: ValidationConfig) => {
  return async (c: Context, next: Next) => {
    const errors: ValidationError[] = [];
    const validatedData: any = {};

    try {
      // Validate request body
      if (config.body) {
        const body = await c.req.json().catch(() => ({}));
        const result = validateWithSchema(config.body, body, 'body', config);
        
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        } else {
          validatedData.body = result.data;
        }
      }

      // Validate query parameters
      if (config.query) {
        const query = Object.fromEntries(new URL(c.req.url).searchParams.entries());
        const result = validateWithSchema(config.query, query, 'query', config);
        
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        } else {
          validatedData.query = result.data;
        }
      }

      // Validate path parameters
      if (config.params) {
        const params = c.req.param();
        const result = validateWithSchema(config.params, params, 'params', config);
        
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        } else {
          validatedData.params = result.data;
        }
      }

      // Validate headers
      if (config.headers) {
        const headers = Object.fromEntries(
          Object.entries(c.req.header()).map(([key, value]) => [key.toLowerCase(), value])
        );
        const result = validateWithSchema(config.headers, headers, 'headers', config);
        
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        } else {
          validatedData.headers = result.data;
        }
      }

      // If validation errors, throw exception
      if (errors.length > 0) {
        throw new HTTPException(400, {
          message: 'Validation failed',
          cause: {
            errors,
            details: 'Request data does not match expected format'
          }
        });
      }

      // Add validated data to context
      (c as any).validated = validatedData;

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Validation middleware error:', error);
      throw new HTTPException(400, { message: 'Request validation failed' });
    }
  };
};

/**
 * Helper function to validate data with schema
 */
function validateWithSchema(
  schema: ZodSchema<any>, 
  data: any, 
  source: string, 
  config: ValidationConfig
): { data?: any; errors: ValidationError[] } {
  try {
    let processedSchema = schema;
    
    // Apply configuration options
    if (config.allowPartial && schema instanceof z.ZodObject) {
      processedSchema = schema.partial();
    }
    
    if (config.stripUnknown && schema instanceof z.ZodObject) {
      processedSchema = processedSchema.strip();
    }

    const result = processedSchema.parse(data);
    
    return { data: result, errors: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: `${source}.${err.path.join('.')}`,
        message: err.message,
        code: err.code,
        value: err.path.length > 0 ? getNestedValue(data, err.path) : data
      }));
      
      return { errors: validationErrors };
    }
    
    return { 
      errors: [{ 
        field: source, 
        message: 'Validation failed', 
        code: 'validation_error' 
      }] 
    };
  }
}

/**
 * Get nested value from object using path array
 */
function getNestedValue(obj: any, path: (string | number)[]): any {
  return path.reduce((current, key) => current?.[key], obj);
}

/**
 * Common validation schemas for frequent use cases
 */
export const commonSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1, {
      message: 'Page must be >= 1'
    }).optional().default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100'
    }).optional().default('20'),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
    sortBy: z.string().optional()
  }),

  // ID parameter
  id: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  // User ID parameter
  userId: z.object({
    userId: z.string().uuid('Invalid user ID format')
  }),

  // Search query
  search: z.object({
    q: z.string().min(1, 'Search query required').max(200, 'Search query too long'),
    filters: z.string().optional()
  }),

  // Date range
  dateRange: z.object({
    from: z.string().datetime('Invalid from date').optional(),
    to: z.string().datetime('Invalid to date').optional()
  }).refine(data => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  }, {
    message: 'From date must be before to date'
  }),

  // File upload
  fileUpload: z.object({
    file: z.any().refine(val => val instanceof File, {
      message: 'Valid file required'
    })
  }),

  // Common headers
  contentType: z.object({
    'content-type': z.enum(['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'])
  })
};

/**
 * Profile-specific validation middleware
 */
export const validateProfile = {
  create: validate({
    body: profileSchemas.profileCreate,
    stripUnknown: true,
    sanitize: true
  }),

  update: validate({
    body: profileSchemas.profileUpdate,
    params: commonSchemas.id,
    allowPartial: true,
    stripUnknown: true,
    sanitize: true
  }),

  search: validate({
    query: profileSchemas.profileSearch,
    stripUnknown: true
  }),

  list: validate({
    query: commonSchemas.pagination,
    stripUnknown: true
  })
};

/**
 * CV-specific validation middleware
 */
export const validateCV = {
  generate: validate({
    body: cvSchemas.cvGeneration,
    stripUnknown: true,
    sanitize: true
  }),

  upload: validate({
    params: commonSchemas.userId,
    // File validation handled separately in multer
    stripUnknown: true
  }),

  update: validate({
    body: cvSchemas.cvUpdate,
    params: commonSchemas.id,
    allowPartial: true,
    stripUnknown: true
  }),

  download: validate({
    params: z.object({
      id: z.string().uuid(),
      format: z.enum(['pdf', 'html', 'png']).optional()
    })
  })
};

/**
 * Portfolio-specific validation middleware
 */
export const validatePortfolio = {
  create: validate({
    body: portfolioSchemas.portfolioCreate,
    stripUnknown: true,
    sanitize: true
  }),

  update: validate({
    body: portfolioSchemas.portfolioUpdate,
    params: commonSchemas.id,
    allowPartial: true,
    stripUnknown: true
  }),

  list: validate({
    query: z.object({
      ...commonSchemas.pagination.shape,
      type: z.string().optional(),
      public: z.string().transform(val => val === 'true').optional()
    }),
    stripUnknown: true
  }),

  search: validate({
    query: z.object({
      q: z.string().min(1).max(200),
      type: z.string().optional(),
      technologies: z.string().optional()
    }),
    stripUnknown: true
  })
};

/**
 * File validation middleware
 */
export const validateFile = {
  upload: validate({
    headers: z.object({
      'content-type': z.string().refine(val => 
        val.startsWith('multipart/form-data') || 
        val.startsWith('application/octet-stream'),
        'Invalid content type for file upload'
      )
    }).partial(),
    stripUnknown: true
  }),

  download: validate({
    params: commonSchemas.id
  })
};

/**
 * Sanitization helper functions
 */
export const sanitizers = {
  /**
   * Remove potentially dangerous HTML/script content
   */
  sanitizeString: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },

  /**
   * Sanitize array of strings
   */
  sanitizeStringArray: (input: string[]): string[] => {
    return input.map(str => sanitizers.sanitizeString(str));
  },

  /**
   * Sanitize email
   */
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  /**
   * Sanitize URL
   */
  sanitizeUrl: (url: string): string => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json().catch(() => null);
    
    if (body && typeof body === 'object') {
      const sanitized = sanitizeObject(body);
      // Store sanitized body
      (c as any).sanitizedBody = sanitized;
    }

    await next();
  } catch (error) {
    console.error('Sanitization error:', error);
    await next(); // Continue without sanitization if it fails
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizers.sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSizeBytes: number) => {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new HTTPException(413, { 
        message: `Request too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB` 
      });
    }

    await next();
  };
};

/**
 * Content type validation middleware
 */
export const validateContentType = (allowedTypes: string[]) => {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.startsWith(type))) {
      throw new HTTPException(415, { 
        message: `Unsupported content type. Allowed: ${allowedTypes.join(', ')}` 
      });
    }

    await next();
  };
};

/**
 * Validation helper functions
 */
export const validationHelpers = {
  /**
   * Extract validated data from context
   */
  getValidated: (c: Context) => {
    return (c as any).validated || {};
  },

  /**
   * Extract sanitized body from context
   */
  getSanitizedBody: (c: Context) => {
    return (c as any).sanitizedBody || {};
  },

  /**
   * Check if request has valid JSON body
   */
  hasValidJsonBody: async (c: Context): Promise<boolean> => {
    try {
      await c.req.json();
      return true;
    } catch {
      return false;
    }
  }
};