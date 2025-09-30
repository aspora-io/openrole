"use strict";
/**
 * CV Validation Schemas
 *
 * Comprehensive Zod validation schemas for OpenRole CV & Portfolio Tools
 * Based on CV API contracts (cv-api.yaml) and data model specifications
 *
 * @author OpenRole.net
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cvSchemas = exports.templateQuerySchema = exports.portfolioItemUpdateRequestSchema = exports.portfolioItemCreateFormDataSchema = exports.portfolioItemCreateRequestSchema = exports.cvGenerationRequestSchema = exports.cvCustomizationsSchema = exports.cvSectionsSchema = exports.accessTokenRequestSchema = exports.cvUpdateRequestSchema = exports.cvUploadFormDataSchema = exports.cvUploadRequestSchema = exports.customSectionsArraySchema = exports.technologiesArraySchema = exports.fontSizeSchema = exports.templateCategorySchema = exports.portfolioValidationStatusSchema = exports.portfolioTypeSchema = exports.cvStatusSchema = exports.cvMimeTypeSchema = exports.hexColorSchema = exports.cvDateStringSchema = exports.externalUrlSchema = exports.cvUrlSchema = exports.portfolioDescriptionSchema = exports.portfolioTitleSchema = exports.cvLabelSchema = exports.fileSizeSchema = exports.cvUuidSchema = void 0;
exports.validateFileMimeType = validateFileMimeType;
exports.validateFileExtension = validateFileExtension;
exports.validateFileSize = validateFileSize;
exports.validateCVFile = validateCVFile;
exports.validatePortfolioFile = validatePortfolioFile;
exports.validateCVStatusTransition = validateCVStatusTransition;
exports.validatePortfolioTypeSpecific = validatePortfolioTypeSpecific;
exports.validateTemplateCustomizations = validateTemplateCustomizations;
exports.validateCVData = validateCVData;
exports.validateExternalUrlAccessibility = validateExternalUrlAccessibility;
exports.sanitizeTechnologies = sanitizeTechnologies;
exports.validateCVGenerationLogic = validateCVGenerationLogic;
const zod_1 = require("zod");
// =============================================================================
// COMMON FIELD VALIDATORS
// =============================================================================
/**
 * UUID validation with custom error message
 */
exports.cvUuidSchema = zod_1.z
    .string()
    .uuid({ message: 'Must be a valid UUID' });
/**
 * File size validation (10MB max for CV uploads)
 */
exports.fileSizeSchema = zod_1.z
    .number()
    .int({ message: 'File size must be a whole number' })
    .min(1, { message: 'File cannot be empty' })
    .max(10 * 1024 * 1024, { message: 'File size cannot exceed 10MB' });
/**
 * CV label validation (1-100 characters)
 */
exports.cvLabelSchema = zod_1.z
    .string()
    .min(1, { message: 'CV label is required' })
    .max(100, { message: 'CV label must not exceed 100 characters' })
    .regex(/^[a-zA-Z0-9\s\.\-\,\(\)\&]+$/, {
    message: 'CV label can only contain letters, numbers, spaces, and basic punctuation'
});
/**
 * Portfolio title validation (1-200 characters)
 */
exports.portfolioTitleSchema = zod_1.z
    .string()
    .min(1, { message: 'Portfolio title is required' })
    .max(200, { message: 'Portfolio title must not exceed 200 characters' });
/**
 * Portfolio description validation (max 1000 characters)
 */
exports.portfolioDescriptionSchema = zod_1.z
    .string()
    .max(1000, { message: 'Portfolio description must not exceed 1000 characters' });
/**
 * URL validation with protocol requirement
 */
exports.cvUrlSchema = zod_1.z
    .string()
    .url({ message: 'Must be a valid URL with protocol (http/https)' })
    .optional()
    .or(zod_1.z.literal(''));
/**
 * External URL validation for portfolio links with accessibility checks
 */
exports.externalUrlSchema = zod_1.z
    .string()
    .url({ message: 'Must be a valid URL with protocol (http/https)' })
    .refine((url) => {
    // Prevent localhost/private IP access for security
    const privateUrlPattern = /(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1)/i;
    return !privateUrlPattern.test(url);
}, { message: 'Private/localhost URLs are not allowed for portfolio links' })
    .refine((url) => {
    // Ensure reasonable URL length
    return url.length <= 2000;
}, { message: 'URL must not exceed 2000 characters' });
/**
 * Date string validation (YYYY-MM-DD format)
 */
exports.cvDateStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Must be a valid date in YYYY-MM-DD format'
})
    .refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
}, { message: 'Must be a valid date' });
/**
 * Hex color validation for template customizations
 */
exports.hexColorSchema = zod_1.z
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
exports.cvMimeTypeSchema = zod_1.z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
], {
    errorMap: () => ({ message: 'File must be PDF, DOC, or DOCX format' })
});
/**
 * CV document status
 */
exports.cvStatusSchema = zod_1.z.enum(['processing', 'active', 'archived', 'failed'], {
    errorMap: () => ({ message: 'CV status must be processing, active, archived, or failed' })
});
/**
 * Portfolio item types
 */
exports.portfolioTypeSchema = zod_1.z.enum([
    'project', 'article', 'design', 'code', 'document', 'link'
], {
    errorMap: () => ({ message: 'Portfolio type must be project, article, design, code, document, or link' })
});
/**
 * Portfolio link validation status
 */
exports.portfolioValidationStatusSchema = zod_1.z.enum([
    'pending', 'valid', 'invalid', 'unreachable'
], {
    errorMap: () => ({ message: 'Validation status must be pending, valid, invalid, or unreachable' })
});
/**
 * CV template categories
 */
exports.templateCategorySchema = zod_1.z.enum([
    'ats-safe', 'modern', 'classic', 'creative'
], {
    errorMap: () => ({ message: 'Template category must be ats-safe, modern, classic, or creative' })
});
/**
 * Font size options for CV templates
 */
exports.fontSizeSchema = zod_1.z.enum(['small', 'medium', 'large'], {
    errorMap: () => ({ message: 'Font size must be small, medium, or large' })
});
// =============================================================================
// ARRAY VALIDATORS
// =============================================================================
/**
 * Technologies array validation for portfolio items
 */
exports.technologiesArraySchema = zod_1.z
    .array(zod_1.z.string()
    .min(1, { message: 'Each technology must be at least 1 character' })
    .max(50, { message: 'Each technology must not exceed 50 characters' })
    .regex(/^[a-zA-Z0-9\s\.\-\+\#\@]+$/, {
    message: 'Technologies can only contain letters, numbers, spaces, dots, hyphens, plus signs, hashtags, and @ symbols'
}))
    .max(20, { message: 'Cannot have more than 20 technologies per portfolio item' })
    .optional();
/**
 * Custom sections array for CV generation
 */
exports.customSectionsArraySchema = zod_1.z
    .array(zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, { message: 'Section title is required' })
        .max(100, { message: 'Section title must not exceed 100 characters' }),
    content: zod_1.z
        .string()
        .min(1, { message: 'Section content is required' })
        .max(2000, { message: 'Section content must not exceed 2000 characters' }),
    order: zod_1.z
        .number()
        .int({ message: 'Section order must be a whole number' })
        .min(0, { message: 'Section order cannot be negative' })
}))
    .max(5, { message: 'Cannot have more than 5 custom sections' })
    .optional();
// =============================================================================
// FILE VALIDATION HELPERS
// =============================================================================
/**
 * File MIME type validation
 */
function validateFileMimeType(file, expectedMimeTypes) {
    return expectedMimeTypes.includes(file.type);
}
/**
 * File extension validation (matches MIME type)
 */
function validateFileExtension(filename, mimeType) {
    const extensionMap = {
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    };
    const allowedExtensions = extensionMap[mimeType] || [];
    const fileExtension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return allowedExtensions.includes(fileExtension);
}
/**
 * File size validation (browser File object)
 */
function validateFileSize(file, maxSizeBytes = 10 * 1024 * 1024) {
    return file.size <= maxSizeBytes;
}
/**
 * Comprehensive file validation for CV uploads
 */
function validateCVFile(file) {
    const errors = [];
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
function validatePortfolioFile(file) {
    const errors = [];
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
exports.cvUploadRequestSchema = zod_1.z.object({
    file: zod_1.z
        .instanceof(File, { message: 'File is required' })
        .refine((file) => validateFileSize(file), {
        message: 'File size cannot exceed 10MB'
    })
        .refine((file) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        return validateFileMimeType(file, allowedMimeTypes);
    }, {
        message: 'File must be PDF, DOC, or DOCX format'
    })
        .refine((file) => validateFileExtension(file.name, file.type), {
        message: 'File extension does not match file type'
    }),
    label: exports.cvLabelSchema,
    isDefault: zod_1.z
        .boolean()
        .optional()
        .default(false)
});
/**
 * CV upload request validation for form data (string-based)
 * Alternative schema for when file is validated separately
 */
exports.cvUploadFormDataSchema = zod_1.z.object({
    label: exports.cvLabelSchema,
    isDefault: zod_1.z
        .string()
        .optional()
        .transform((val) => val === 'true')
        .pipe(zod_1.z.boolean())
});
// =============================================================================
// CV METADATA VALIDATION SCHEMAS
// =============================================================================
/**
 * CV update request validation
 * Matches CVUpdateRequest from cv-api.yaml
 */
exports.cvUpdateRequestSchema = zod_1.z.object({
    label: exports.cvLabelSchema.optional(),
    isDefault: zod_1.z
        .boolean()
        .optional()
        .describe('Set this CV as the default (will unset others)')
});
/**
 * Access token generation request validation
 */
exports.accessTokenRequestSchema = zod_1.z.object({
    expiresInHours: zod_1.z
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
exports.cvSectionsSchema = zod_1.z.object({
    includePersonalDetails: zod_1.z.boolean().default(true),
    includeWorkExperience: zod_1.z.boolean().default(true),
    includeEducation: zod_1.z.boolean().default(true),
    includeSkills: zod_1.z.boolean().default(true),
    includePortfolio: zod_1.z.boolean().default(false),
    customSections: exports.customSectionsArraySchema
});
/**
 * CV template customizations
 */
exports.cvCustomizationsSchema = zod_1.z.object({
    primaryColor: exports.hexColorSchema.optional(),
    fontSize: exports.fontSizeSchema.default('medium'),
    showPhoto: zod_1.z.boolean().default(false)
});
/**
 * CV generation request validation
 * Matches CVGenerationRequest from cv-api.yaml
 */
exports.cvGenerationRequestSchema = zod_1.z.object({
    templateId: exports.cvUuidSchema.describe('ID of the template to use'),
    label: exports.cvLabelSchema.describe('Label for the generated CV'),
    isDefault: zod_1.z
        .boolean()
        .default(false)
        .describe('Set as default CV'),
    sections: exports.cvSectionsSchema.optional(),
    customizations: exports.cvCustomizationsSchema.optional()
});
// =============================================================================
// PORTFOLIO VALIDATION SCHEMAS
// =============================================================================
/**
 * Portfolio item creation request validation (multipart/form-data)
 * Matches the /portfolio POST endpoint from cv-api.yaml
 */
exports.portfolioItemCreateRequestSchema = zod_1.z.object({
    file: zod_1.z
        .instanceof(File)
        .optional()
        .refine((file) => {
        if (!file)
            return true;
        return validatePortfolioFile(file).isValid;
    }, {
        message: 'Invalid portfolio file'
    }),
    title: exports.portfolioTitleSchema,
    description: exports.portfolioDescriptionSchema,
    type: exports.portfolioTypeSchema,
    externalUrl: exports.externalUrlSchema.optional(),
    technologies: exports.technologiesArraySchema,
    projectDate: exports.cvDateStringSchema.optional(),
    role: zod_1.z
        .string()
        .max(200, { message: 'Role description must not exceed 200 characters' })
        .optional(),
    isPublic: zod_1.z
        .boolean()
        .default(true),
    sortOrder: zod_1.z
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
exports.portfolioItemCreateFormDataSchema = zod_1.z.object({
    title: exports.portfolioTitleSchema,
    description: exports.portfolioDescriptionSchema,
    type: exports.portfolioTypeSchema,
    externalUrl: exports.externalUrlSchema.optional(),
    technologies: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        if (!val)
            return [];
        try {
            return JSON.parse(val);
        }
        catch {
            return val.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
    })
        .pipe(exports.technologiesArraySchema.default([])),
    projectDate: exports.cvDateStringSchema.optional(),
    role: zod_1.z
        .string()
        .max(200, { message: 'Role description must not exceed 200 characters' })
        .optional(),
    isPublic: zod_1.z
        .string()
        .optional()
        .transform((val) => val !== 'false')
        .pipe(zod_1.z.boolean().default(true)),
    sortOrder: zod_1.z
        .string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : undefined)
        .pipe(zod_1.z.number().int().min(0).optional())
});
/**
 * Portfolio item update request validation
 * Matches PortfolioItemUpdateRequest from cv-api.yaml
 */
exports.portfolioItemUpdateRequestSchema = zod_1.z.object({
    title: exports.portfolioTitleSchema.optional(),
    description: exports.portfolioDescriptionSchema.optional(),
    externalUrl: exports.externalUrlSchema.optional(),
    technologies: exports.technologiesArraySchema,
    projectDate: exports.cvDateStringSchema.optional(),
    role: zod_1.z
        .string()
        .max(200, { message: 'Role description must not exceed 200 characters' })
        .optional(),
    isPublic: zod_1.z.boolean().optional(),
    sortOrder: zod_1.z
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
exports.templateQuerySchema = zod_1.z.object({
    category: exports.templateCategorySchema.optional(),
    includePreview: zod_1.z
        .boolean()
        .default(false)
});
// =============================================================================
// BUSINESS LOGIC VALIDATORS
// =============================================================================
/**
 * CV status transition validation
 */
function validateCVStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
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
function validatePortfolioTypeSpecific(type, data) {
    const errors = [];
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
function validateTemplateCustomizations(templateId, customizations) {
    const errors = [];
    // Template-specific validation could be added here
    // For now, we'll validate the basic structure
    if (customizations.primaryColor && !exports.hexColorSchema.safeParse(customizations.primaryColor).success) {
        errors.push('Primary color must be a valid hex color');
    }
    if (customizations.fontSize && !exports.fontSizeSchema.safeParse(customizations.fontSize).success) {
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
function validateCVData(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
    }));
    return { success: false, errors };
}
/**
 * Helper to validate external URL accessibility
 */
async function validateExternalUrlAccessibility(url) {
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
    }
    catch (error) {
        return {
            isAccessible: false,
            status: 'unreachable'
        };
    }
}
/**
 * Helper to sanitize technologies array
 */
function sanitizeTechnologies(technologies) {
    return Array.from(new Set(technologies
        .map(tech => tech.trim())
        .filter(tech => tech.length > 0)
        .map(tech => tech.charAt(0).toUpperCase() + tech.slice(1))));
}
/**
 * Helper to validate CV generation business logic
 */
function validateCVGenerationLogic(request) {
    const errors = [];
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
// SCHEMA COLLECTIONS
// =============================================================================
/**
 * Collection of all CV-related schemas for easy import
 */
exports.cvSchemas = {
    // CV Management schemas
    cvUpload: exports.cvUploadRequestSchema,
    cvUploadFormData: exports.cvUploadFormDataSchema,
    cvUpdate: exports.cvUpdateRequestSchema,
    accessToken: exports.accessTokenRequestSchema,
    // CV Generation schemas
    cvGeneration: exports.cvGenerationRequestSchema,
    cvSections: exports.cvSectionsSchema,
    cvCustomizations: exports.cvCustomizationsSchema,
    templateQuery: exports.templateQuerySchema,
    // Portfolio schemas
    portfolioCreate: exports.portfolioItemCreateRequestSchema,
    portfolioCreateFormData: exports.portfolioItemCreateFormDataSchema,
    portfolioUpdate: exports.portfolioItemUpdateRequestSchema,
    // Common field validators
    uuid: exports.cvUuidSchema,
    cvLabel: exports.cvLabelSchema,
    portfolioTitle: exports.portfolioTitleSchema,
    portfolioDescription: exports.portfolioDescriptionSchema,
    url: exports.cvUrlSchema,
    externalUrl: exports.externalUrlSchema,
    dateString: exports.cvDateStringSchema,
    hexColor: exports.hexColorSchema,
    fileSize: exports.fileSizeSchema,
    // Array validators
    technologies: exports.technologiesArraySchema,
    customSections: exports.customSectionsArraySchema,
    // Enum validators
    cvMimeType: exports.cvMimeTypeSchema,
    cvStatus: exports.cvStatusSchema,
    portfolioType: exports.portfolioTypeSchema,
    portfolioValidationStatus: exports.portfolioValidationStatusSchema,
    templateCategory: exports.templateCategorySchema,
    fontSize: exports.fontSizeSchema
};
/**
 * Default export for easy access to all schemas
 */
exports.default = exports.cvSchemas;
//# sourceMappingURL=cv-schemas.js.map