/**
 * CVDocument Drizzle ORM Model
 *
 * CV file management with version control, security, and generation metadata.
 * Based on migration 002-cv-documents.sql and data-model.md specifications.
 *
 * Features:
 * - File storage with size limits and MIME type validation
 * - Version control with automatic versioning per profile
 * - Secure access tokens with expiration
 * - Generation tracking for AI-generated CVs
 * - Virus scanning and security metadata
 * - Status tracking and download analytics
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
import { z } from 'zod';
export type ScanResults = {
    virusDetected?: boolean;
    threats?: string[];
    scanEngine?: string;
    scanDate?: string;
    fileHash?: string;
    metadata?: Record<string, any>;
};
export declare const CVDocumentStatus: {
    readonly PROCESSING: "processing";
    readonly ACTIVE: "active";
    readonly ARCHIVED: "archived";
    readonly FAILED: "failed";
};
export declare const AllowedMimeTypes: {
    readonly PDF: "application/pdf";
    readonly DOC: "application/msword";
    readonly DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
};
export type CVDocumentStatusType = typeof CVDocumentStatus[keyof typeof CVDocumentStatus];
export type AllowedMimeTypesType = typeof AllowedMimeTypes[keyof typeof AllowedMimeTypes];
export declare const cvDocumentStatusEnum: any;
/**
 * CVDocument table schema
 *
 * Stores CV files and metadata with comprehensive version control,
 * security features, and generation tracking capabilities.
 */
export declare const cvDocuments: any;
export declare const insertCVDocumentSchema: any;
export declare const selectCVDocumentSchema: any;
export declare const updateCVDocumentSchema: any;
/**
 * TypeScript types derived from schemas
 */
export type InsertCVDocument = z.infer<typeof insertCVDocumentSchema>;
export type SelectCVDocument = z.infer<typeof selectCVDocumentSchema>;
export type UpdateCVDocument = z.infer<typeof updateCVDocumentSchema>;
/**
 * Access control and security types
 */
export type CVDocumentWithAccess = SelectCVDocument & {
    /**
     * Secure download URL with access token
     */
    downloadUrl: string;
    /**
     * Whether the access token is still valid
     */
    isAccessible: boolean;
    /**
     * File extension for display purposes
     */
    fileExtension: string;
    /**
     * Human-readable file size
     */
    formattedFileSize: string;
};
/**
 * Helper functions for CV document management
 */
export declare const cvDocumentHelpers: {
    /**
     * Validate file type by MIME type
     */
    isValidFileType: (mimeType: string) => mimeType is AllowedMimeTypesType;
    /**
     * Validate file size (10MB limit)
     */
    isValidFileSize: (sizeInBytes: number) => boolean;
    /**
     * Check if access token is still valid
     */
    isTokenValid: (tokenExpiresAt: Date) => boolean;
    /**
     * Generate a secure filename to prevent path traversal attacks
     */
    generateSecureFilename: (originalFilename: string, profileId: string) => string;
    /**
     * Get file extension from filename
     */
    getFileExtension: (filename: string) => string;
    /**
     * Format file size in human-readable format
     */
    formatFileSize: (sizeInBytes: number) => string;
    /**
     * Generate download URL with access token
     */
    generateDownloadUrl: (cvDocument: SelectCVDocument, baseUrl?: string) => string;
    /**
     * Validate status transition
     */
    isValidStatusTransition: (currentStatus: CVDocumentStatusType, newStatus: CVDocumentStatusType) => boolean;
    /**
     * Check if CV document can be downloaded
     */
    canBeDownloaded: (cvDocument: SelectCVDocument) => boolean;
    /**
     * Extract MIME type from file extension (fallback)
     */
    getMimeTypeFromExtension: (filename: string) => AllowedMimeTypesType | null;
    /**
     * Validate scan results structure
     */
    validateScanResults: (scanResults: any) => scanResults is ScanResults;
};
/**
 * Database query helpers
 */
export declare const cvDocumentQueries: {
    publicSelectFields: {
        id: any;
        profileId: any;
        filename: any;
        fileSize: any;
        mimeType: any;
        version: any;
        label: any;
        isDefault: any;
        generatedFromProfile: any;
        templateUsed: any;
        generatedAt: any;
        status: any;
        downloadCount: any;
        lastAccessedAt: any;
        createdAt: any;
    };
    secureSelectFields: {
        accessToken: any;
        tokenExpiresAt: any;
        filePath: any;
        virusScanned: any;
        scanResults: any;
        id: any;
        profileId: any;
        filename: any;
        fileSize: any;
        mimeType: any;
        version: any;
        label: any;
        isDefault: any;
        generatedFromProfile: any;
        templateUsed: any;
        generatedAt: any;
        status: any;
        downloadCount: any;
        lastAccessedAt: any;
        createdAt: any;
    };
    /**
     * Build WHERE clause for active CV documents
     */
    activeDocumentsWhere: any;
    /**
     * Build WHERE clause for user's CV documents
     */
    userDocumentsWhere: (profileId: string) => any;
    /**
     * Build ORDER BY clause for version sorting (latest first)
     */
    versionOrder: any;
};
/**
 * Access token management functions
 */
export declare const accessTokenManager: {
    /**
     * Generate new access token with expiration
     */
    generateToken: (expiresInHours?: number) => {
        token: string;
        expiresAt: Date;
    };
    /**
     * Default token expiration (24 hours)
     */
    DEFAULT_EXPIRATION_HOURS: number;
    /**
     * Extended token expiration for special cases (7 days)
     */
    EXTENDED_EXPIRATION_HOURS: number;
    /**
     * Short token expiration for temporary access (1 hour)
     */
    SHORT_EXPIRATION_HOURS: number;
};
/**
 * File operation constants
 */
export declare const CVDocumentConstants: {
    readonly MAX_FILE_SIZE: 10485760;
    readonly ALLOWED_MIME_TYPES: ("application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document")[];
    readonly ALLOWED_EXTENSIONS: readonly ["pdf", "doc", "docx"];
    readonly DEFAULT_TOKEN_EXPIRATION: number;
    readonly MAX_FILENAME_LENGTH: 255;
    readonly MAX_LABEL_LENGTH: 100;
    readonly MAX_VERSIONS_PER_PROFILE: 50;
};
/**
 * Export the table and all related types/helpers
 */
export default cvDocuments;
//# sourceMappingURL=cv-document.d.ts.map