/**
 * CV Validation Schemas
 * 
 * Comprehensive Zod validation schemas for OpenRole CV & Portfolio Tools
 * Based on CV API contracts (cv-api.yaml) and data model specifications
 * 
 * @author OpenRole.net
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// COMMON FIELD VALIDATORS
// =============================================================================

/**
 * UUID validation with custom error message
 */
export const cvUuidSchema = z
  .string()
  .uuid({ message: 'Must be a valid UUID' });

/**
 * File size validation (10MB max for CV uploads)
 */
export const fileSizeSchema = z
  .number()
  .int({ message: 'File size must be a whole number' })
  .min(1, { message: 'File cannot be empty' })
  .max(10 * 1024 * 1024, { message: 'File size cannot exceed 10MB' });

/**
 * CV label validation (1-100 characters)
 */
export const cvLabelSchema = z
  .string()
  .min(1, { message: 'CV label is required' })
  .max(100, { message: 'CV label must not exceed 100 characters' })
  .regex(/^[a-zA-Z0-9\s\.\-\,\(\)\&]+$/, { 
    message: 'CV label can only contain letters, numbers, spaces, and basic punctuation' 
  });

/**
 * Portfolio title validation (1-200 characters)
 */
export const portfolioTitleSchema = z
  .string()
  .min(1, { message: 'Portfolio title is required' })
  .max(200, { message: 'Portfolio title must not exceed 200 characters' });

/**
 * Portfolio description validation (max 1000 characters)
 */
export const portfolioDescriptionSchema = z
  .string()
  .max(1000, { message: 'Portfolio description must not exceed 1000 characters' });

/**
 * URL validation with protocol requirement
 */
export const cvUrlSchema = z
  .string()
  .url({ message: 'Must be a valid URL with protocol (http/https)' })
  .optional()
  .or(z.literal(''));

/**
 * External URL validation for portfolio links with accessibility checks
 */
export const externalUrlSchema = z
  .string()
  .url({ message: 'Must be a valid URL with protocol (http/https)' })
  .refine((url: string) => {
    // Prevent localhost/private IP access for security
    const privateUrlPattern = /(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1)/i;
    return !privateUrlPattern.test(url);
  }, { message: 'Private/localhost URLs are not allowed for portfolio links' })
  .refine((url: string) => {
    // Ensure reasonable URL length
    return url.length <= 2000;
  }, { message: 'URL must not exceed 2000 characters' });

/**
 * Date string validation (YYYY-MM-DD format)
 */
export const cvDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Must be a valid date in YYYY-MM-DD format' 
  })
  .refine((date: string) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, { message: 'Must be a valid date' });

/**
 * Hex color validation for template customizations
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { 
    message: 'Must be a valid hex color (e.g., #2563eb)' 
  });

// =============================================================================
// ENUM VALIDATORS
// =============================================================================

/**
 * CV document MIME types
 */
export const cvMimeTypeSchema = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
], {
  errorMap: () => ({ message: 'File must be PDF, DOC, or DOCX format' })
});

/**
 * CV document status
 */
export const cvStatusSchema = z.enum(['processing', 'active', 'archived', 'failed'], {
  errorMap: () => ({ message: 'CV status must be processing, active, archived, or failed' })
});

/**
 * Portfolio item types
 */
export const portfolioTypeSchema = z.enum([
  'project', 'article', 'design', 'code', 'document', 'link'
], {
  errorMap: () => ({ message: 'Portfolio type must be project, article, design, code, document, or link' })
});

/**
 * Portfolio link validation status
 */
export const portfolioValidationStatusSchema = z.enum([
  'pending', 'valid', 'invalid', 'unreachable'
], {
  errorMap: () => ({ message: 'Validation status must be pending, valid, invalid, or unreachable' })
});

/**
 * CV template categories
 */
export const templateCategorySchema = z.enum([
  'ats-safe', 'modern', 'classic', 'creative'
], {
  errorMap: () => ({ message: 'Template category must be ats-safe, modern, classic, or creative' })
});

/**
 * Font size options for CV templates
 */
export const fontSizeSchema = z.enum(['small', 'medium', 'large'], {
  errorMap: () => ({ message: 'Font size must be small, medium, or large' })
});

// =============================================================================
// ARRAY VALIDATORS
// =============================================================================

/**
 * Technologies array validation for portfolio items
 */
export const technologiesArraySchema = z
  .array(
    z.string()
      .min(1, { message: 'Each technology must be at least 1 character' })
      .max(50, { message: 'Each technology must not exceed 50 characters' })
      .regex(/^[a-zA-Z0-9\s\.\-\+\#\@]+$/, { 
        message: 'Technologies can only contain letters, numbers, spaces, dots, hyphens, plus signs, hashtags, and @ symbols' 
      })
  )
  .max(20, { message: 'Cannot have more than 20 technologies per portfolio item' })
  .optional();

/**
 * Custom sections array for CV generation
 */
export const customSectionsArraySchema = z
  .array(
    z.object({
      title: z
        .string()
        .min(1, { message: 'Section title is required' })
        .max(100, { message: 'Section title must not exceed 100 characters' }),
      content: z
        .string()
        .min(1, { message: 'Section content is required' })
        .max(2000, { message: 'Section content must not exceed 2000 characters' }),
      order: z
        .number()
        .int({ message: 'Section order must be a whole number' })
        .min(0, { message: 'Section order cannot be negative' })
    })
  )
  .max(5, { message: 'Cannot have more than 5 custom sections' })
  .optional();

// =============================================================================
// FILE VALIDATION HELPERS
// =============================================================================

/**
 * File MIME type validation
 */
export function validateFileMimeType(file: File, expectedMimeTypes: string[]): boolean {
  return expectedMimeTypes.includes(file.type);
}

/**
 * File extension validation (matches MIME type)
 */
export function validateFileExtension(filename: string, mimeType: string): boolean {
  const extensionMap = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };
  
  const allowedExtensions = extensionMap[mimeType as keyof typeof extensionMap] || [];
  const fileExtension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  
  return allowedExtensions.includes(fileExtension);
}

/**
 * File size validation (browser File object)
 */
export function validateFileSize(file: File, maxSizeBytes: number = 10 * 1024 * 1024): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Comprehensive file validation for CV uploads
 */
export function validateCVFile(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check file size
  if (!validateFileSize(file)) {
    errors.push('File size cannot exceed 10MB');
  }
  
  // Check MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!validateFileMimeType(file, allowedMimeTypes)) {
    errors.push('File must be PDF, DOC, or DOCX format');
  }
  
  // Check extension matches MIME type
  if (!validateFileExtension(file.name, file.type)) {
    errors.push('File extension does not match file type');
  }
  
  // Check filename length
  if (file.name.length > 255) {
    errors.push('Filename must not exceed 255 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Portfolio file validation (more lenient MIME types)
 */
export function validatePortfolioFile(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check file size (20MB for portfolio items)
  if (file.size > 20 * 1024 * 1024) {
    errors.push('Portfolio file size cannot exceed 20MB');
  }
  
  // Allow more file types for portfolio
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (!allowedMimeTypes.includes(file.type)) {
    errors.push('Portfolio file type not supported');
  }
  
  // Check filename length
  if (file.name.length > 255) {
    errors.push('Filename must not exceed 255 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================================================
// CV UPLOAD VALIDATION SCHEMAS
// =============================================================================

/**
 * CV upload request validation (multipart/form-data)
 * Matches the /cv POST endpoint from cv-api.yaml
 */
export const cvUploadRequestSchema = z.object({
  file: z
    .instanceof(File, { message: 'File is required' })
    .refine((file: File) => validateFileSize(file), {
      message: 'File size cannot exceed 10MB'
    })
    .refine((file: File) => {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return validateFileMimeType(file, allowedMimeTypes);
    }, {
      message: 'File must be PDF, DOC, or DOCX format'
    })
    .refine((file: File) => validateFileExtension(file.name, file.type), {
      message: 'File extension does not match file type'
    }),
  
  label: cvLabelSchema,
  
  isDefault: z
    .boolean()
    .optional()
    .default(false)
});

/**
 * CV upload request validation for form data (string-based)
 * Alternative schema for when file is validated separately
 */
export const cvUploadFormDataSchema = z.object({
  label: cvLabelSchema,
  isDefault: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
});

// =============================================================================
// CV METADATA VALIDATION SCHEMAS
// =============================================================================

/**
 * CV update request validation
 * Matches CVUpdateRequest from cv-api.yaml
 */
export const cvUpdateRequestSchema = z.object({
  label: cvLabelSchema.optional(),
  
  isDefault: z
    .boolean()
    .optional()
    .describe('Set this CV as the default (will unset others)')
});

/**
 * Access token generation request validation
 */
export const accessTokenRequestSchema = z.object({
  expiresInHours: z
    .number()
    .int({ message: 'Expiration time must be a whole number of hours' })
    .min(1, { message: 'Token must expire in at least 1 hour' })
    .max(168, { message: 'Token cannot be valid for more than 7 days (168 hours)' })
    .default(24)
});

// =============================================================================
// CV GENERATION VALIDATION SCHEMAS  
// =============================================================================

/**
 * CV generation sections configuration
 */
export const cvSectionsSchema = z.object({
  includePersonalDetails: z.boolean().default(true),
  includeWorkExperience: z.boolean().default(true),
  includeEducation: z.boolean().default(true),
  includeSkills: z.boolean().default(true),
  includePortfolio: z.boolean().default(false),
  customSections: customSectionsArraySchema
});

/**
 * CV template customizations
 */
export const cvCustomizationsSchema = z.object({
  primaryColor: hexColorSchema.optional(),
  fontSize: fontSizeSchema.default('medium'),
  showPhoto: z.boolean().default(false)
});

/**
 * CV generation request validation
 * Matches CVGenerationRequest from cv-api.yaml
 */
export const cvGenerationRequestSchema = z.object({
  templateId: cvUuidSchema.describe('ID of the template to use'),
  
  label: cvLabelSchema.describe('Label for the generated CV'),
  
  isDefault: z
    .boolean()
    .default(false)
    .describe('Set as default CV'),
  
  sections: cvSectionsSchema.optional(),
  
  customizations: cvCustomizationsSchema.optional()
});

// =============================================================================
// PORTFOLIO VALIDATION SCHEMAS
// =============================================================================

/**
 * Portfolio item creation request validation (multipart/form-data)
 * Matches the /portfolio POST endpoint from cv-api.yaml
 */
export const portfolioItemCreateRequestSchema = z.object({
  file: z
    .instanceof(File)
    .optional()
    .refine((file: File | undefined) => {
      if (!file) return true;
      return validatePortfolioFile(file).isValid;
    }, {
      message: 'Invalid portfolio file'
    }),
  
  title: portfolioTitleSchema,
  
  description: portfolioDescriptionSchema,
  
  type: portfolioTypeSchema,
  
  externalUrl: externalUrlSchema.optional(),
  
  technologies: technologiesArraySchema,
  
  projectDate: cvDateStringSchema.optional(),
  
  role: z
    .string()
    .max(200, { message: 'Role description must not exceed 200 characters' })
    .optional(),
  
  isPublic: z
    .boolean()
    .default(true),
  
  sortOrder: z
    .number()
    .int({ message: 'Sort order must be a whole number' })
    .min(0, { message: 'Sort order cannot be negative' })
    .optional()
}).refine((data) => {
  // Either file OR external URL must be provided (except for link type which requires external URL)
  if (data.type === 'link') {
    return !!data.externalUrl;
  }
  return !!(data.file || data.externalUrl);
}, {
  message: 'Either a file upload or external URL must be provided',
  path: ['file']
}).refine((data) => {
  // External URL is required for 'link' type
  if (data.type === 'link' && !data.externalUrl) {
    return false;
  }
  return true;
}, {
  message: 'External URL is required for link type portfolio items',
  path: ['externalUrl']
});

/**
 * Portfolio item creation for form data (string-based)
 */
export const portfolioItemCreateFormDataSchema = z.object({
  title: portfolioTitleSchema,
  description: portfolioDescriptionSchema,
  type: portfolioTypeSchema,
  externalUrl: externalUrlSchema.optional(),
  technologies: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      try {
        return JSON.parse(val);
      } catch {
        return val.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
    })
    .pipe(technologiesArraySchema.default([])),
  projectDate: cvDateStringSchema.optional(),
  role: z
    .string()
    .max(200, { message: 'Role description must not exceed 200 characters' })
    .optional(),
  isPublic: z
    .string()
    .optional()
    .transform((val) => val !== 'false')
    .pipe(z.boolean().default(true)),
  sortOrder: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .pipe(z.number().int().min(0).optional())
});

/**
 * Portfolio item update request validation
 * Matches PortfolioItemUpdateRequest from cv-api.yaml
 */
export const portfolioItemUpdateRequestSchema = z.object({
  title: portfolioTitleSchema.optional(),
  
  description: portfolioDescriptionSchema.optional(),
  
  externalUrl: externalUrlSchema.optional(),
  
  technologies: technologiesArraySchema,
  
  projectDate: cvDateStringSchema.optional(),
  
  role: z
    .string()
    .max(200, { message: 'Role description must not exceed 200 characters' })
    .optional(),
  
  isPublic: z.boolean().optional(),
  
  sortOrder: z
    .number()
    .int({ message: 'Sort order must be a whole number' })
    .min(0, { message: 'Sort order cannot be negative' })
    .optional()
});

// =============================================================================
// TEMPLATE VALIDATION SCHEMAS
// =============================================================================

/**
 * CV template query filters
 */
export const templateQuerySchema = z.object({
  category: templateCategorySchema.optional(),
  includePreview: z
    .boolean()
    .default(false)
});

// =============================================================================
// BUSINESS LOGIC VALIDATORS
// =============================================================================

/**
 * CV status transition validation
 */
export function validateCVStatusTransition(currentStatus: string, newStatus: string): {
  isValid: boolean;
  error?: string;
} {
  const allowedTransitions: Record<string, string[]> = {
    'processing': ['active', 'failed'],
    'active': ['archived'],
    'archived': ['active'],
    'failed': ['processing']
  };
  
  if (!allowedTransitions[currentStatus]) {
    return { isValid: false, error: 'Invalid current status' };
  }
  
  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    return { 
      isValid: false, 
      error: `Cannot transition from ${currentStatus} to ${newStatus}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Portfolio type-specific validation
 */
export function validatePortfolioTypeSpecific(type: string, data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  switch (type) {
    case 'link':
      if (!data.externalUrl) {
        errors.push('External URL is required for link type items');
      }
      break;
    
    case 'code':
      if (!data.externalUrl && !data.file) {
        errors.push('Code portfolio items should have either a file or repository link');
      }
      break;
    
    case 'project':
      if (!data.projectDate) {
        errors.push('Project date is recommended for project type items');
      }
      if (!data.role) {
        errors.push('Role description is recommended for project type items');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Template customization validation
 */
export function validateTemplateCustomizations(templateId: string, customizations: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Template-specific validation could be added here
  // For now, we'll validate the basic structure
  
  if (customizations.primaryColor && !hexColorSchema.safeParse(customizations.primaryColor).success) {
    errors.push('Primary color must be a valid hex color');
  }
  
  if (customizations.fontSize && !fontSizeSchema.safeParse(customizations.fontSize).success) {
    errors.push('Font size must be small, medium, or large');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Helper function to validate CV data and return formatted errors
 */
export function validateCVData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string; code: string }>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((error: any) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }));
  
  return { success: false, errors };
}

/**
 * Helper to validate external URL accessibility
 */
export async function validateExternalUrlAccessibility(url: string): Promise<{
  isAccessible: boolean;
  status: 'valid' | 'invalid' | 'unreachable';
  statusCode?: number;
}> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'OpenRole-URLValidator/1.0'
      }
    });
    
    return {
      isAccessible: response.ok,
      status: response.ok ? 'valid' : 'invalid',
      statusCode: response.status
    };
  } catch (error) {
    return {
      isAccessible: false,
      status: 'unreachable'
    };
  }
}

/**
 * Helper to sanitize technologies array
 */
export function sanitizeTechnologies(technologies: string[]): string[] {
  return Array.from(new Set(
    technologies
      .map(tech => tech.trim())
      .filter(tech => tech.length > 0)
      .map(tech => tech.charAt(0).toUpperCase() + tech.slice(1))
  ));
}

/**
 * Helper to validate CV generation business logic
 */
export function validateCVGenerationLogic(request: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if custom sections don't conflict with standard sections
  if (request.sections?.customSections) {
    const standardSectionTitles = [
      'Personal Details', 'Work Experience', 'Education', 
      'Skills', 'Portfolio'
    ];
    
    for (const customSection of request.sections.customSections) {
      if (standardSectionTitles.includes(customSection.title)) {
        errors.push(`Custom section title "${customSection.title}" conflicts with standard section`);
      }
    }
  }
  
  // Validate color scheme accessibility if provided
  if (request.customizations?.primaryColor) {
    // Basic contrast check could be added here
    const color = request.customizations.primaryColor;
    // Prevent very light colors that might not print well
    if (['#ffffff', '#f8f8f8', '#fafafa'].includes(color.toLowerCase())) {
      errors.push('Primary color is too light for good contrast');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Export TypeScript types inferred from schemas
export type CVUploadRequest = z.infer<typeof cvUploadRequestSchema>;
export type CVUploadFormData = z.infer<typeof cvUploadFormDataSchema>;
export type CVUpdateRequest = z.infer<typeof cvUpdateRequestSchema>;
export type CVGenerationRequest = z.infer<typeof cvGenerationRequestSchema>;
export type AccessTokenRequest = z.infer<typeof accessTokenRequestSchema>;
export type PortfolioItemCreateRequest = z.infer<typeof portfolioItemCreateRequestSchema>;
export type PortfolioItemCreateFormData = z.infer<typeof portfolioItemCreateFormDataSchema>;
export type PortfolioItemUpdateRequest = z.infer<typeof portfolioItemUpdateRequestSchema>;
export type TemplateQuery = z.infer<typeof templateQuerySchema>;
export type CVSections = z.infer<typeof cvSectionsSchema>;
export type CVCustomizations = z.infer<typeof cvCustomizationsSchema>;

// Export common validators for reuse
export type CVMimeType = z.infer<typeof cvMimeTypeSchema>;
export type CVStatus = z.infer<typeof cvStatusSchema>;
export type PortfolioType = z.infer<typeof portfolioTypeSchema>;
export type PortfolioValidationStatus = z.infer<typeof portfolioValidationStatusSchema>;
export type TemplateCategory = z.infer<typeof templateCategorySchema>;
export type FontSize = z.infer<typeof fontSizeSchema>;
export type TechnologiesArray = z.infer<typeof technologiesArraySchema>;

// =============================================================================
// SCHEMA COLLECTIONS
// =============================================================================

/**
 * Collection of all CV-related schemas for easy import
 */
export const cvSchemas = {
  // CV Management schemas
  cvUpload: cvUploadRequestSchema,
  cvUploadFormData: cvUploadFormDataSchema,
  cvUpdate: cvUpdateRequestSchema,
  accessToken: accessTokenRequestSchema,
  
  // CV Generation schemas
  cvGeneration: cvGenerationRequestSchema,
  cvSections: cvSectionsSchema,
  cvCustomizations: cvCustomizationsSchema,
  templateQuery: templateQuerySchema,
  
  // Portfolio schemas
  portfolioCreate: portfolioItemCreateRequestSchema,
  portfolioCreateFormData: portfolioItemCreateFormDataSchema,
  portfolioUpdate: portfolioItemUpdateRequestSchema,
  
  // Common field validators
  uuid: cvUuidSchema,
  cvLabel: cvLabelSchema,
  portfolioTitle: portfolioTitleSchema,
  portfolioDescription: portfolioDescriptionSchema,
  url: cvUrlSchema,
  externalUrl: externalUrlSchema,
  dateString: cvDateStringSchema,
  hexColor: hexColorSchema,
  fileSize: fileSizeSchema,
  
  // Array validators
  technologies: technologiesArraySchema,
  customSections: customSectionsArraySchema,
  
  // Enum validators
  cvMimeType: cvMimeTypeSchema,
  cvStatus: cvStatusSchema,
  portfolioType: portfolioTypeSchema,
  portfolioValidationStatus: portfolioValidationStatusSchema,
  templateCategory: templateCategorySchema,
  fontSize: fontSizeSchema
};

/**
 * Default export for easy access to all schemas
 */
export default cvSchemas;