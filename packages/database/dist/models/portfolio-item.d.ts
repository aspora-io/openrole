/**
 * PortfolioItem Drizzle ORM Model
 *
 * Work samples and project showcases with external URL validation.
 * Based on migration 005-portfolio-items.sql and data-model.md specifications.
 *
 * Features:
 * - Portfolio item management (projects, articles, designs, code, documents, links)
 * - External URL validation system (FR-010)
 * - File upload support with metadata
 * - Technology tagging with JSONB
 * - Privacy controls and display ordering
 * - View tracking and validation status
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
import { z } from 'zod';
export type TechnologiesArray = string[];
export declare const PortfolioItemType: {
    readonly PROJECT: "project";
    readonly ARTICLE: "article";
    readonly DESIGN: "design";
    readonly CODE: "code";
    readonly DOCUMENT: "document";
    readonly LINK: "link";
};
export declare const ValidationStatus: {
    readonly PENDING: "pending";
    readonly VALID: "valid";
    readonly INVALID: "invalid";
    readonly UNREACHABLE: "unreachable";
};
export type PortfolioItemTypeEnum = typeof PortfolioItemType[keyof typeof PortfolioItemType];
export type ValidationStatusEnum = typeof ValidationStatus[keyof typeof ValidationStatus];
/**
 * PortfolioItem table schema
 *
 * Stores work samples and project showcases with comprehensive metadata,
 * file management, and external URL validation capabilities.
 */
export declare const portfolioItems: any;
/**
 * Relations for PortfolioItem
 */
export declare const portfolioItemsRelations: any;
export declare const insertPortfolioItemSchema: any;
export declare const selectPortfolioItemSchema: any;
export declare const updatePortfolioItemSchema: any;
/**
 * TypeScript types derived from schemas
 */
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type SelectPortfolioItem = z.infer<typeof selectPortfolioItemSchema>;
export type UpdatePortfolioItem = z.infer<typeof updatePortfolioItemSchema>;
/**
 * Extended types for API responses
 */
export type PortfolioItemWithValidation = SelectPortfolioItem & {
    /**
     * Whether the item needs validation
     */
    needsValidation: boolean;
    /**
     * Last validation attempt information
     */
    validationInfo?: {
        lastChecked: Date | null;
        status: ValidationStatusEnum;
        isValidated: boolean;
    };
    /**
     * File information if applicable
     */
    fileInfo?: {
        name: string;
        size: number;
        type: string;
        downloadUrl?: string;
    };
    /**
     * URL information if applicable
     */
    urlInfo?: {
        url: string;
        isValidated: boolean;
        lastChecked: Date | null;
        status: ValidationStatusEnum;
    };
};
/**
 * Portfolio organization and filtering helpers
 */
export declare const portfolioHelpers: {
    /**
     * Check if a portfolio item needs URL validation
     */
    needsValidation: (item: SelectPortfolioItem) => boolean;
    /**
     * Validate file type based on MIME type
     */
    validateFileType: (mimeType: string) => {
        valid: boolean;
        category: string;
        error?: string;
    };
    /**
     * Filter and sort portfolio items
     */
    filterAndSort: (items: SelectPortfolioItem[], filters?: {
        type?: PortfolioItemTypeEnum[];
        technologies?: string[];
        hasFile?: boolean;
        hasUrl?: boolean;
        isPublic?: boolean;
        validationStatus?: ValidationStatusEnum[];
    }, sort?: {
        field: "sortOrder" | "createdAt" | "updatedAt" | "title" | "projectDate" | "viewCount";
        direction: "asc" | "desc";
    }) => SelectPortfolioItem[];
    /**
     * Get portfolio statistics
     */
    getStatistics: (items: SelectPortfolioItem[]) => {
        technologiesUsed: string[];
        total: number;
        byType: Record<PortfolioItemTypeEnum, number>;
        byValidationStatus: Record<ValidationStatusEnum, number>;
        totalViews: number;
        hasFiles: number;
        hasUrls: number;
        needsValidation: number;
    };
    /**
     * Generate next sort order for a profile
     */
    getNextSortOrder: (existingItems: SelectPortfolioItem[]) => number;
    /**
     * Reorder portfolio items
     */
    reorderItems: (items: SelectPortfolioItem[], targetId: string, newSortOrder: number) => Array<{
        id: string;
        sortOrder: number;
    }>;
};
/**
 * URL validation and status management helpers (FR-010)
 */
export declare const urlValidationHelpers: {
    /**
     * Validate URL format
     */
    validateUrlFormat: (url: string) => {
        valid: boolean;
        error?: string;
    };
    /**
     * Update validation status
     */
    updateValidationStatus: (validationResult: {
        isValid: boolean;
        responseCode?: number;
        responseTime?: number;
        error?: string;
    }) => {
        validationStatus: ValidationStatusEnum;
        linkValidated: boolean;
    };
    /**
     * Get validation priority based on portfolio item characteristics
     */
    getValidationPriority: (item: SelectPortfolioItem) => "low" | "normal" | "high";
    /**
     * Create validation queue entry
     */
    createValidationQueueEntry: (item: SelectPortfolioItem) => {
        portfolioItemId: any;
        url: any;
        priority: "low" | "normal" | "high";
        attempts: number;
        maxAttempts: number;
        nextAttemptAt: Date;
    } | null;
};
/**
 * Technology tagging helpers
 */
export declare const technologyHelpers: {
    /**
     * Normalize technology names for consistency
     */
    normalizeTechnology: (tech: string) => string;
    /**
     * Extract technologies from text (basic implementation)
     */
    extractTechnologiesFromText: (text: string) => string[];
    /**
     * Get technology suggestions based on existing technologies
     */
    getTechnologySuggestions: (existingTech: string[], allPortfolioTech: string[]) => string[];
};
/**
 * View tracking helpers
 */
export declare const viewTrackingHelpers: {
    /**
     * Increment view count for a portfolio item
     */
    incrementViewCount: (currentCount: number) => number;
    /**
     * Get view statistics for a collection of portfolio items
     */
    getViewStatistics: (items: SelectPortfolioItem[]) => {
        totalViews: z.infer<any>;
        averageViews: number;
        mostViewed: any;
        viewsByType: z.infer<any>;
    };
};
/**
 * Database query helpers
 */
export declare const portfolioQueries: {
    /**
     * Common select fields for public portfolio items
     */
    readonly publicSelectFields: {
        id: any;
        profileId: any;
        title: any;
        description: any;
        type: any;
        externalUrl: any;
        technologies: any;
        projectDate: any;
        role: any;
        sortOrder: any;
        viewCount: any;
        createdAt: any;
        updatedAt: any;
    };
    /**
     * Fields for portfolio management (includes private data)
     */
    readonly managementSelectFields: {
        fileName: any;
        filePath: any;
        fileSize: any;
        mimeType: any;
        linkValidated: any;
        lastValidationCheck: any;
        validationStatus: any;
        isPublic: any;
        id: any;
        profileId: any;
        title: any;
        description: any;
        type: any;
        externalUrl: any;
        technologies: any;
        projectDate: any;
        role: any;
        sortOrder: any;
        viewCount: any;
        createdAt: any;
        updatedAt: any;
    };
};
/**
 * Export the table and all related types/helpers
 */
export default portfolioItems;
//# sourceMappingURL=portfolio-item.d.ts.map