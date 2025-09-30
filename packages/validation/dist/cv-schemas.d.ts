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
/**
 * UUID validation with custom error message
 */
export declare const cvUuidSchema: z.ZodString;
/**
 * File size validation (10MB max for CV uploads)
 */
export declare const fileSizeSchema: z.ZodNumber;
/**
 * CV label validation (1-100 characters)
 */
export declare const cvLabelSchema: z.ZodString;
/**
 * Portfolio title validation (1-200 characters)
 */
export declare const portfolioTitleSchema: z.ZodString;
/**
 * Portfolio description validation (max 1000 characters)
 */
export declare const portfolioDescriptionSchema: z.ZodString;
/**
 * URL validation with protocol requirement
 */
export declare const cvUrlSchema: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
/**
 * External URL validation for portfolio links with accessibility checks
 */
export declare const externalUrlSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Date string validation (YYYY-MM-DD format)
 */
export declare const cvDateStringSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Hex color validation for template customizations
 */
export declare const hexColorSchema: z.ZodString;
/**
 * CV document MIME types
 */
export declare const cvMimeTypeSchema: z.ZodEnum<["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]>;
/**
 * CV document status
 */
export declare const cvStatusSchema: z.ZodEnum<["processing", "active", "archived", "failed"]>;
/**
 * Portfolio item types
 */
export declare const portfolioTypeSchema: z.ZodEnum<["project", "article", "design", "code", "document", "link"]>;
/**
 * Portfolio link validation status
 */
export declare const portfolioValidationStatusSchema: z.ZodEnum<["pending", "valid", "invalid", "unreachable"]>;
/**
 * CV template categories
 */
export declare const templateCategorySchema: z.ZodEnum<["ats-safe", "modern", "classic", "creative"]>;
/**
 * Font size options for CV templates
 */
export declare const fontSizeSchema: z.ZodEnum<["small", "medium", "large"]>;
/**
 * Technologies array validation for portfolio items
 */
export declare const technologiesArraySchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
/**
 * Custom sections array for CV generation
 */
export declare const customSectionsArraySchema: z.ZodOptional<z.ZodArray<z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    order: number;
}, {
    title: string;
    content: string;
    order: number;
}>, "many">>;
/**
 * File MIME type validation
 */
export declare function validateFileMimeType(file: File, expectedMimeTypes: string[]): boolean;
/**
 * File extension validation (matches MIME type)
 */
export declare function validateFileExtension(filename: string, mimeType: string): boolean;
/**
 * File size validation (browser File object)
 */
export declare function validateFileSize(file: File, maxSizeBytes?: number): boolean;
/**
 * Comprehensive file validation for CV uploads
 */
export declare function validateCVFile(file: File): {
    isValid: boolean;
    errors: string[];
};
/**
 * Portfolio file validation (more lenient MIME types)
 */
export declare function validatePortfolioFile(file: File): {
    isValid: boolean;
    errors: string[];
};
/**
 * CV upload request validation (multipart/form-data)
 * Matches the /cv POST endpoint from cv-api.yaml
 */
export declare const cvUploadRequestSchema: z.ZodObject<{
    file: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>, import("buffer").File, import("buffer").File>, import("buffer").File, import("buffer").File>, import("buffer").File, import("buffer").File>;
    label: z.ZodString;
    isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    file: import("buffer").File;
    label: string;
    isDefault: boolean;
}, {
    file: import("buffer").File;
    label: string;
    isDefault?: boolean | undefined;
}>;
/**
 * CV upload request validation for form data (string-based)
 * Alternative schema for when file is validated separately
 */
export declare const cvUploadFormDataSchema: z.ZodObject<{
    label: z.ZodString;
    isDefault: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, boolean, string | undefined>, z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    label: string;
    isDefault: boolean;
}, {
    label: string;
    isDefault?: string | undefined;
}>;
/**
 * CV update request validation
 * Matches CVUpdateRequest from cv-api.yaml
 */
export declare const cvUpdateRequestSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    label?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    label?: string | undefined;
    isDefault?: boolean | undefined;
}>;
/**
 * Access token generation request validation
 */
export declare const accessTokenRequestSchema: z.ZodObject<{
    expiresInHours: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    expiresInHours: number;
}, {
    expiresInHours?: number | undefined;
}>;
/**
 * CV generation sections configuration
 */
export declare const cvSectionsSchema: z.ZodObject<{
    includePersonalDetails: z.ZodDefault<z.ZodBoolean>;
    includeWorkExperience: z.ZodDefault<z.ZodBoolean>;
    includeEducation: z.ZodDefault<z.ZodBoolean>;
    includeSkills: z.ZodDefault<z.ZodBoolean>;
    includePortfolio: z.ZodDefault<z.ZodBoolean>;
    customSections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        order: number;
    }, {
        title: string;
        content: string;
        order: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    includePersonalDetails: boolean;
    includeWorkExperience: boolean;
    includeEducation: boolean;
    includeSkills: boolean;
    includePortfolio: boolean;
    customSections?: {
        title: string;
        content: string;
        order: number;
    }[] | undefined;
}, {
    includePersonalDetails?: boolean | undefined;
    includeWorkExperience?: boolean | undefined;
    includeEducation?: boolean | undefined;
    includeSkills?: boolean | undefined;
    includePortfolio?: boolean | undefined;
    customSections?: {
        title: string;
        content: string;
        order: number;
    }[] | undefined;
}>;
/**
 * CV template customizations
 */
export declare const cvCustomizationsSchema: z.ZodObject<{
    primaryColor: z.ZodOptional<z.ZodString>;
    fontSize: z.ZodDefault<z.ZodEnum<["small", "medium", "large"]>>;
    showPhoto: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fontSize: "small" | "medium" | "large";
    showPhoto: boolean;
    primaryColor?: string | undefined;
}, {
    primaryColor?: string | undefined;
    fontSize?: "small" | "medium" | "large" | undefined;
    showPhoto?: boolean | undefined;
}>;
/**
 * CV generation request validation
 * Matches CVGenerationRequest from cv-api.yaml
 */
export declare const cvGenerationRequestSchema: z.ZodObject<{
    templateId: z.ZodString;
    label: z.ZodString;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    sections: z.ZodOptional<z.ZodObject<{
        includePersonalDetails: z.ZodDefault<z.ZodBoolean>;
        includeWorkExperience: z.ZodDefault<z.ZodBoolean>;
        includeEducation: z.ZodDefault<z.ZodBoolean>;
        includeSkills: z.ZodDefault<z.ZodBoolean>;
        includePortfolio: z.ZodDefault<z.ZodBoolean>;
        customSections: z.ZodOptional<z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
            order: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            title: string;
            content: string;
            order: number;
        }, {
            title: string;
            content: string;
            order: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        includePersonalDetails: boolean;
        includeWorkExperience: boolean;
        includeEducation: boolean;
        includeSkills: boolean;
        includePortfolio: boolean;
        customSections?: {
            title: string;
            content: string;
            order: number;
        }[] | undefined;
    }, {
        includePersonalDetails?: boolean | undefined;
        includeWorkExperience?: boolean | undefined;
        includeEducation?: boolean | undefined;
        includeSkills?: boolean | undefined;
        includePortfolio?: boolean | undefined;
        customSections?: {
            title: string;
            content: string;
            order: number;
        }[] | undefined;
    }>>;
    customizations: z.ZodOptional<z.ZodObject<{
        primaryColor: z.ZodOptional<z.ZodString>;
        fontSize: z.ZodDefault<z.ZodEnum<["small", "medium", "large"]>>;
        showPhoto: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        fontSize: "small" | "medium" | "large";
        showPhoto: boolean;
        primaryColor?: string | undefined;
    }, {
        primaryColor?: string | undefined;
        fontSize?: "small" | "medium" | "large" | undefined;
        showPhoto?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    label: string;
    isDefault: boolean;
    templateId: string;
    sections?: {
        includePersonalDetails: boolean;
        includeWorkExperience: boolean;
        includeEducation: boolean;
        includeSkills: boolean;
        includePortfolio: boolean;
        customSections?: {
            title: string;
            content: string;
            order: number;
        }[] | undefined;
    } | undefined;
    customizations?: {
        fontSize: "small" | "medium" | "large";
        showPhoto: boolean;
        primaryColor?: string | undefined;
    } | undefined;
}, {
    label: string;
    templateId: string;
    isDefault?: boolean | undefined;
    sections?: {
        includePersonalDetails?: boolean | undefined;
        includeWorkExperience?: boolean | undefined;
        includeEducation?: boolean | undefined;
        includeSkills?: boolean | undefined;
        includePortfolio?: boolean | undefined;
        customSections?: {
            title: string;
            content: string;
            order: number;
        }[] | undefined;
    } | undefined;
    customizations?: {
        primaryColor?: string | undefined;
        fontSize?: "small" | "medium" | "large" | undefined;
        showPhoto?: boolean | undefined;
    } | undefined;
}>;
/**
 * Portfolio item creation request validation (multipart/form-data)
 * Matches the /portfolio POST endpoint from cv-api.yaml
 */
export declare const portfolioItemCreateRequestSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    file: z.ZodEffects<z.ZodOptional<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>>, import("buffer").File | undefined, import("buffer").File | undefined>;
    title: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["project", "article", "design", "code", "document", "link"]>;
    externalUrl: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    role: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    isPublic: boolean;
    file?: import("buffer").File | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    sortOrder?: number | undefined;
}, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    file?: import("buffer").File | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    isPublic?: boolean | undefined;
    sortOrder?: number | undefined;
}>, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    isPublic: boolean;
    file?: import("buffer").File | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    sortOrder?: number | undefined;
}, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    file?: import("buffer").File | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    isPublic?: boolean | undefined;
    sortOrder?: number | undefined;
}>, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    isPublic: boolean;
    file?: import("buffer").File | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    sortOrder?: number | undefined;
}, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    file?: import("buffer").File | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    isPublic?: boolean | undefined;
    sortOrder?: number | undefined;
}>;
/**
 * Portfolio item creation for form data (string-based)
 */
export declare const portfolioItemCreateFormDataSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["project", "article", "design", "code", "document", "link"]>;
    externalUrl: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    technologies: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, any, string | undefined>, z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    projectDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    role: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, boolean, string | undefined>, z.ZodDefault<z.ZodBoolean>>;
    sortOrder: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>, z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    technologies: string[];
    isPublic: boolean;
    externalUrl?: string | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    sortOrder?: number | undefined;
}, {
    type: "code" | "project" | "article" | "design" | "document" | "link";
    title: string;
    description: string;
    externalUrl?: string | undefined;
    technologies?: string | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    isPublic?: string | undefined;
    sortOrder?: string | undefined;
}>;
/**
 * Portfolio item update request validation
 * Matches PortfolioItemUpdateRequest from cv-api.yaml
 */
export declare const portfolioItemUpdateRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    externalUrl: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    role: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    isPublic?: boolean | undefined;
    sortOrder?: number | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    externalUrl?: string | undefined;
    technologies?: string[] | undefined;
    projectDate?: string | undefined;
    role?: string | undefined;
    isPublic?: boolean | undefined;
    sortOrder?: number | undefined;
}>;
/**
 * CV template query filters
 */
export declare const templateQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["ats-safe", "modern", "classic", "creative"]>>;
    includePreview: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    includePreview: boolean;
    category?: "ats-safe" | "modern" | "classic" | "creative" | undefined;
}, {
    category?: "ats-safe" | "modern" | "classic" | "creative" | undefined;
    includePreview?: boolean | undefined;
}>;
/**
 * CV status transition validation
 */
export declare function validateCVStatusTransition(currentStatus: string, newStatus: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Portfolio type-specific validation
 */
export declare function validatePortfolioTypeSpecific(type: string, data: any): {
    isValid: boolean;
    errors: string[];
};
/**
 * Template customization validation
 */
export declare function validateTemplateCustomizations(templateId: string, customizations: any): {
    isValid: boolean;
    errors: string[];
};
/**
 * Helper function to validate CV data and return formatted errors
 */
export declare function validateCVData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
};
/**
 * Helper to validate external URL accessibility
 */
export declare function validateExternalUrlAccessibility(url: string): Promise<{
    isAccessible: boolean;
    status: 'valid' | 'invalid' | 'unreachable';
    statusCode?: number;
}>;
/**
 * Helper to sanitize technologies array
 */
export declare function sanitizeTechnologies(technologies: string[]): string[];
/**
 * Helper to validate CV generation business logic
 */
export declare function validateCVGenerationLogic(request: any): {
    isValid: boolean;
    errors: string[];
};
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
export type CVMimeType = z.infer<typeof cvMimeTypeSchema>;
export type CVStatus = z.infer<typeof cvStatusSchema>;
export type PortfolioType = z.infer<typeof portfolioTypeSchema>;
export type PortfolioValidationStatus = z.infer<typeof portfolioValidationStatusSchema>;
export type TemplateCategory = z.infer<typeof templateCategorySchema>;
export type FontSize = z.infer<typeof fontSizeSchema>;
export type TechnologiesArray = z.infer<typeof technologiesArraySchema>;
/**
 * Collection of all CV-related schemas for easy import
 */
export declare const cvSchemas: {
    cvUpload: z.ZodObject<{
        file: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>, import("buffer").File, import("buffer").File>, import("buffer").File, import("buffer").File>, import("buffer").File, import("buffer").File>;
        label: z.ZodString;
        isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        file: import("buffer").File;
        label: string;
        isDefault: boolean;
    }, {
        file: import("buffer").File;
        label: string;
        isDefault?: boolean | undefined;
    }>;
    cvUploadFormData: z.ZodObject<{
        label: z.ZodString;
        isDefault: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, boolean, string | undefined>, z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        isDefault: boolean;
    }, {
        label: string;
        isDefault?: string | undefined;
    }>;
    cvUpdate: z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        isDefault: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        isDefault?: boolean | undefined;
    }, {
        label?: string | undefined;
        isDefault?: boolean | undefined;
    }>;
    accessToken: z.ZodObject<{
        expiresInHours: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        expiresInHours: number;
    }, {
        expiresInHours?: number | undefined;
    }>;
    cvGeneration: z.ZodObject<{
        templateId: z.ZodString;
        label: z.ZodString;
        isDefault: z.ZodDefault<z.ZodBoolean>;
        sections: z.ZodOptional<z.ZodObject<{
            includePersonalDetails: z.ZodDefault<z.ZodBoolean>;
            includeWorkExperience: z.ZodDefault<z.ZodBoolean>;
            includeEducation: z.ZodDefault<z.ZodBoolean>;
            includeSkills: z.ZodDefault<z.ZodBoolean>;
            includePortfolio: z.ZodDefault<z.ZodBoolean>;
            customSections: z.ZodOptional<z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                content: z.ZodString;
                order: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                title: string;
                content: string;
                order: number;
            }, {
                title: string;
                content: string;
                order: number;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            includePersonalDetails: boolean;
            includeWorkExperience: boolean;
            includeEducation: boolean;
            includeSkills: boolean;
            includePortfolio: boolean;
            customSections?: {
                title: string;
                content: string;
                order: number;
            }[] | undefined;
        }, {
            includePersonalDetails?: boolean | undefined;
            includeWorkExperience?: boolean | undefined;
            includeEducation?: boolean | undefined;
            includeSkills?: boolean | undefined;
            includePortfolio?: boolean | undefined;
            customSections?: {
                title: string;
                content: string;
                order: number;
            }[] | undefined;
        }>>;
        customizations: z.ZodOptional<z.ZodObject<{
            primaryColor: z.ZodOptional<z.ZodString>;
            fontSize: z.ZodDefault<z.ZodEnum<["small", "medium", "large"]>>;
            showPhoto: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            fontSize: "small" | "medium" | "large";
            showPhoto: boolean;
            primaryColor?: string | undefined;
        }, {
            primaryColor?: string | undefined;
            fontSize?: "small" | "medium" | "large" | undefined;
            showPhoto?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        isDefault: boolean;
        templateId: string;
        sections?: {
            includePersonalDetails: boolean;
            includeWorkExperience: boolean;
            includeEducation: boolean;
            includeSkills: boolean;
            includePortfolio: boolean;
            customSections?: {
                title: string;
                content: string;
                order: number;
            }[] | undefined;
        } | undefined;
        customizations?: {
            fontSize: "small" | "medium" | "large";
            showPhoto: boolean;
            primaryColor?: string | undefined;
        } | undefined;
    }, {
        label: string;
        templateId: string;
        isDefault?: boolean | undefined;
        sections?: {
            includePersonalDetails?: boolean | undefined;
            includeWorkExperience?: boolean | undefined;
            includeEducation?: boolean | undefined;
            includeSkills?: boolean | undefined;
            includePortfolio?: boolean | undefined;
            customSections?: {
                title: string;
                content: string;
                order: number;
            }[] | undefined;
        } | undefined;
        customizations?: {
            primaryColor?: string | undefined;
            fontSize?: "small" | "medium" | "large" | undefined;
            showPhoto?: boolean | undefined;
        } | undefined;
    }>;
    cvSections: z.ZodObject<{
        includePersonalDetails: z.ZodDefault<z.ZodBoolean>;
        includeWorkExperience: z.ZodDefault<z.ZodBoolean>;
        includeEducation: z.ZodDefault<z.ZodBoolean>;
        includeSkills: z.ZodDefault<z.ZodBoolean>;
        includePortfolio: z.ZodDefault<z.ZodBoolean>;
        customSections: z.ZodOptional<z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
            order: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            title: string;
            content: string;
            order: number;
        }, {
            title: string;
            content: string;
            order: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        includePersonalDetails: boolean;
        includeWorkExperience: boolean;
        includeEducation: boolean;
        includeSkills: boolean;
        includePortfolio: boolean;
        customSections?: {
            title: string;
            content: string;
            order: number;
        }[] | undefined;
    }, {
        includePersonalDetails?: boolean | undefined;
        includeWorkExperience?: boolean | undefined;
        includeEducation?: boolean | undefined;
        includeSkills?: boolean | undefined;
        includePortfolio?: boolean | undefined;
        customSections?: {
            title: string;
            content: string;
            order: number;
        }[] | undefined;
    }>;
    cvCustomizations: z.ZodObject<{
        primaryColor: z.ZodOptional<z.ZodString>;
        fontSize: z.ZodDefault<z.ZodEnum<["small", "medium", "large"]>>;
        showPhoto: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        fontSize: "small" | "medium" | "large";
        showPhoto: boolean;
        primaryColor?: string | undefined;
    }, {
        primaryColor?: string | undefined;
        fontSize?: "small" | "medium" | "large" | undefined;
        showPhoto?: boolean | undefined;
    }>;
    templateQuery: z.ZodObject<{
        category: z.ZodOptional<z.ZodEnum<["ats-safe", "modern", "classic", "creative"]>>;
        includePreview: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        includePreview: boolean;
        category?: "ats-safe" | "modern" | "classic" | "creative" | undefined;
    }, {
        category?: "ats-safe" | "modern" | "classic" | "creative" | undefined;
        includePreview?: boolean | undefined;
    }>;
    portfolioCreate: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        file: z.ZodEffects<z.ZodOptional<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>>, import("buffer").File | undefined, import("buffer").File | undefined>;
        title: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<["project", "article", "design", "code", "document", "link"]>;
        externalUrl: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
        technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        projectDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        role: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodDefault<z.ZodBoolean>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        isPublic: boolean;
        file?: import("buffer").File | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        sortOrder?: number | undefined;
    }, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        file?: import("buffer").File | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        isPublic?: boolean | undefined;
        sortOrder?: number | undefined;
    }>, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        isPublic: boolean;
        file?: import("buffer").File | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        sortOrder?: number | undefined;
    }, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        file?: import("buffer").File | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        isPublic?: boolean | undefined;
        sortOrder?: number | undefined;
    }>, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        isPublic: boolean;
        file?: import("buffer").File | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        sortOrder?: number | undefined;
    }, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        file?: import("buffer").File | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        isPublic?: boolean | undefined;
        sortOrder?: number | undefined;
    }>;
    portfolioCreateFormData: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<["project", "article", "design", "code", "document", "link"]>;
        externalUrl: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
        technologies: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, any, string | undefined>, z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
        projectDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        role: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, boolean, string | undefined>, z.ZodDefault<z.ZodBoolean>>;
        sortOrder: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>, z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        technologies: string[];
        isPublic: boolean;
        externalUrl?: string | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        sortOrder?: number | undefined;
    }, {
        type: "code" | "project" | "article" | "design" | "document" | "link";
        title: string;
        description: string;
        externalUrl?: string | undefined;
        technologies?: string | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        isPublic?: string | undefined;
        sortOrder?: string | undefined;
    }>;
    portfolioUpdate: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        externalUrl: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
        technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        projectDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        role: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        isPublic?: boolean | undefined;
        sortOrder?: number | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        externalUrl?: string | undefined;
        technologies?: string[] | undefined;
        projectDate?: string | undefined;
        role?: string | undefined;
        isPublic?: boolean | undefined;
        sortOrder?: number | undefined;
    }>;
    uuid: z.ZodString;
    cvLabel: z.ZodString;
    portfolioTitle: z.ZodString;
    portfolioDescription: z.ZodString;
    url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    externalUrl: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    dateString: z.ZodEffects<z.ZodString, string, string>;
    hexColor: z.ZodString;
    fileSize: z.ZodNumber;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customSections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        order: number;
    }, {
        title: string;
        content: string;
        order: number;
    }>, "many">>;
    cvMimeType: z.ZodEnum<["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]>;
    cvStatus: z.ZodEnum<["processing", "active", "archived", "failed"]>;
    portfolioType: z.ZodEnum<["project", "article", "design", "code", "document", "link"]>;
    portfolioValidationStatus: z.ZodEnum<["pending", "valid", "invalid", "unreachable"]>;
    templateCategory: z.ZodEnum<["ats-safe", "modern", "classic", "creative"]>;
    fontSize: z.ZodEnum<["small", "medium", "large"]>;
};
/**
 * Default export for easy access to all schemas
 */
export default cvSchemas;
//# sourceMappingURL=cv-schemas.d.ts.map