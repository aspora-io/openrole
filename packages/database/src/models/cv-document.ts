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

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  boolean, 
  timestamp,
  jsonb,
  index,
  unique,
  check,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
// Forward declaration for candidate profiles to avoid circular imports
// The actual relation will be defined in schema.ts or a relations file

// Type definitions for JSONB fields
export type ScanResults = {
  virusDetected?: boolean;
  threats?: string[];
  scanEngine?: string;
  scanDate?: string;
  fileHash?: string;
  metadata?: Record<string, any>;
};

// Enum types based on database constraints
export const CVDocumentStatus = {
  PROCESSING: 'processing',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  FAILED: 'failed'
} as const;

export const AllowedMimeTypes = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
} as const;

export type CVDocumentStatusType = typeof CVDocumentStatus[keyof typeof CVDocumentStatus];
export type AllowedMimeTypesType = typeof AllowedMimeTypes[keyof typeof AllowedMimeTypes];

// Define the status enum for Drizzle
export const cvDocumentStatusEnum = pgEnum('cv_document_status', [
  'processing', 
  'active', 
  'archived', 
  'failed'
]);

/**
 * CVDocument table schema
 * 
 * Stores CV files and metadata with comprehensive version control,
 * security features, and generation tracking capabilities.
 */
export const cvDocuments = pgTable('cv_documents', {
  // Primary Key
  id: uuid('id')
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  
  // Foreign Key to candidate_profiles table
  profileId: uuid('profile_id')
    .notNull(),
    // Reference will be added via foreign key constraint in migration
  
  // File Information
  filename: varchar('filename', { length: 255 })
    .notNull(),
  
  originalFilename: varchar('original_filename', { length: 255 })
    .notNull(),
  
  filePath: text('file_path')
    .notNull(),
  
  fileSize: integer('file_size')
    .notNull(),
  
  mimeType: varchar('mime_type', { length: 100 })
    .notNull()
    .$type<AllowedMimeTypesType>(),
  
  // Version Control (FR-006)
  version: integer('version')
    .notNull()
    .default(1),
  
  label: varchar('label', { length: 100 })
    .notNull(),
  
  isDefault: boolean('is_default')
    .default(false),
  
  // Generation Metadata (FR-008)
  generatedFromProfile: boolean('generated_from_profile')
    .default(false),
  
  templateUsed: varchar('template_used', { length: 255 }),
  
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  
  // Security
  accessToken: uuid('access_token')
    .default(sql`uuid_generate_v4()`),
  
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP + INTERVAL '24 hours'`),
  
  virusScanned: boolean('virus_scanned')
    .default(false),
  
  scanResults: jsonb('scan_results')
    .$type<ScanResults>()
    .default(sql`'{}'::jsonb`),
  
  // Status
  status: cvDocumentStatusEnum('status')
    .notNull()
    .default('processing'),
  
  // Metadata
  downloadCount: integer('download_count')
    .default(0),
  
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => {
  return {
    // Indexes based on migration
    profileIdIdx: index('idx_cv_document_profile_id').on(table.profileId),
    statusIdx: index('idx_cv_document_status').on(table.status),
    accessTokenIdx: index('idx_cv_document_access_token').on(table.accessToken),
    versionIdx: index('idx_cv_document_version').on(table.profileId, table.version),
    createdIdx: index('idx_cv_document_created').on(table.createdAt),
    generatedIdx: index('idx_cv_document_generated').on(table.generatedFromProfile),
    
    // Unique constraint for default CV (only one default per profile)
    defaultUnique: unique('unique_cv_document_default').on(table.profileId).where(sql`${table.isDefault} = true`),
    
    // Unique constraint for filename per profile
    filenameProfileUnique: unique('cv_documents_filename_profile_unique').on(table.profileId, table.filename),
    
    // Check constraints (these should be handled by database migration)
    // Including here for documentation/type safety
    fileSizeLimit: check('file_size_limit', sql`${table.fileSize} > 0 AND ${table.fileSize} <= 10485760`), // 10MB limit
    mimeTypeValid: check('mime_type_valid', sql`${table.mimeType} IN ('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`),
    labelLength: check('label_length', sql`char_length(${table.label}) >= 1`),
    tokenExpiryFuture: check('token_expiry_future', sql`${table.tokenExpiresAt} > ${table.createdAt}`),
  };
});

/**
 * Relations for CVDocument
 * Note: Relations are defined in the main schema.ts file to avoid circular imports
 */
// export const cvDocumentsRelations = relations(cvDocuments, ({ one }) => ({
//   // Relation to candidate_profiles table  
//   profile: one(candidateProfiles, {
//     fields: [cvDocuments.profileId],
//     references: [candidateProfiles.id],
//   }),
//   
//   // Future relations to other tables
//   // applicationAttachments: many(applicationAttachments),
//   // cvGenerationLogs: many(cvGenerationLogs),
// }));

/**
 * Zod validation schemas
 */

// Base validation schema for CV document fields
const cvDocumentValidation = {
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must not exceed 255 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  
  originalFilename: z.string()
    .min(1, 'Original filename is required')
    .max(255, 'Original filename must not exceed 255 characters'),
  
  filePath: z.string()
    .min(1, 'File path is required'),
  
  fileSize: z.number()
    .int('File size must be an integer')
    .min(1, 'File size must be greater than 0')
    .max(10485760, 'File size cannot exceed 10MB'),
  
  mimeType: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ], {
    errorMap: () => ({ message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' })
  }),
  
  label: z.string()
    .min(1, 'Label is required')
    .max(100, 'Label must not exceed 100 characters'),
  
  templateUsed: z.string()
    .max(255, 'Template name must not exceed 255 characters')
    .optional(),
  
  status: z.enum(['processing', 'active', 'archived', 'failed'])
    .default('processing'),
  
  scanResults: z.object({
    virusDetected: z.boolean().optional(),
    threats: z.array(z.string()).optional(),
    scanEngine: z.string().optional(),
    scanDate: z.string().optional(),
    fileHash: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }).default({}),
};

// Insert schema - for creating new CV documents
export const insertCVDocumentSchema = createInsertSchema(cvDocuments, cvDocumentValidation)
  .omit({
    id: true,
    version: true, // Auto-set by database trigger
    accessToken: true, // Auto-generated
    tokenExpiresAt: true, // Auto-set
    downloadCount: true, // Defaults to 0
    createdAt: true,
    updatedAt: true,
  });

// Select schema - for querying CV documents
export const selectCVDocumentSchema = createSelectSchema(cvDocuments);

// Update schema - for updating existing CV documents (limited fields)
export const updateCVDocumentSchema = createSelectSchema(cvDocuments, {
  ...cvDocumentValidation,
  id: z.string().uuid(),
}).partial().required({ id: true })
  .pick({
    id: true,
    label: true,
    isDefault: true,
    status: true,
    virusScanned: true,
    scanResults: true,
    lastAccessedAt: true,
  });

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
export const cvDocumentHelpers = {
  /**
   * Validate file type by MIME type
   */
  isValidFileType: (mimeType: string): mimeType is AllowedMimeTypesType => {
    return Object.values(AllowedMimeTypes).includes(mimeType as AllowedMimeTypesType);
  },
  
  /**
   * Validate file size (10MB limit)
   */
  isValidFileSize: (sizeInBytes: number): boolean => {
    return sizeInBytes > 0 && sizeInBytes <= 10485760; // 10MB
  },
  
  /**
   * Check if access token is still valid
   */
  isTokenValid: (tokenExpiresAt: Date): boolean => {
    return new Date() < new Date(tokenExpiresAt);
  },
  
  /**
   * Generate a secure filename to prevent path traversal attacks
   */
  generateSecureFilename: (originalFilename: string, profileId: string): string => {
    const timestamp = Date.now();
    const extension = originalFilename.split('.').pop()?.toLowerCase() || '';
    const sanitizedName = originalFilename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    
    return `${profileId}_${timestamp}_${sanitizedName}.${extension}`;
  },
  
  /**
   * Get file extension from filename
   */
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },
  
  /**
   * Format file size in human-readable format
   */
  formatFileSize: (sizeInBytes: number): string => {
    if (sizeInBytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    
    return `${parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },
  
  /**
   * Generate download URL with access token
   */
  generateDownloadUrl: (cvDocument: SelectCVDocument, baseUrl: string = ''): string => {
    return `${baseUrl}/api/cv/${cvDocument.id}/download?token=${cvDocument.accessToken}`;
  },
  
  /**
   * Validate status transition
   */
  isValidStatusTransition: (currentStatus: CVDocumentStatusType, newStatus: CVDocumentStatusType): boolean => {
    const validTransitions: Record<CVDocumentStatusType, CVDocumentStatusType[]> = {
      'processing': ['active', 'failed'],
      'active': ['archived'],
      'archived': [], // No transitions from archived
      'failed': ['processing'], // Can retry processing
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  },
  
  /**
   * Check if CV document can be downloaded
   */
  canBeDownloaded: (cvDocument: SelectCVDocument): boolean => {
    return cvDocument.status === 'active' && 
           cvDocument.virusScanned && 
           cvDocumentHelpers.isTokenValid(cvDocument.tokenExpiresAt);
  },
  
  /**
   * Extract MIME type from file extension (fallback)
   */
  getMimeTypeFromExtension: (filename: string): AllowedMimeTypesType | null => {
    const extension = cvDocumentHelpers.getFileExtension(filename);
    
    switch (extension) {
      case 'pdf':
        return AllowedMimeTypes.PDF;
      case 'doc':
        return AllowedMimeTypes.DOC;
      case 'docx':
        return AllowedMimeTypes.DOCX;
      default:
        return null;
    }
  },
  
  /**
   * Validate scan results structure
   */
  validateScanResults: (scanResults: any): scanResults is ScanResults => {
    if (typeof scanResults !== 'object' || scanResults === null) {
      return false;
    }
    
    const { virusDetected, threats, scanEngine, scanDate, fileHash, metadata } = scanResults;
    
    return (
      (virusDetected === undefined || typeof virusDetected === 'boolean') &&
      (threats === undefined || Array.isArray(threats)) &&
      (scanEngine === undefined || typeof scanEngine === 'string') &&
      (scanDate === undefined || typeof scanDate === 'string') &&
      (fileHash === undefined || typeof fileHash === 'string') &&
      (metadata === undefined || typeof metadata === 'object')
    );
  },
};

/**
 * Database query helpers
 */
export const cvDocumentQueries = (() => {
  /**
   * Common select fields for public CV documents
   */
  const publicSelectFields = {
    id: cvDocuments.id,
    profileId: cvDocuments.profileId,
    filename: cvDocuments.filename,
    fileSize: cvDocuments.fileSize,
    mimeType: cvDocuments.mimeType,
    version: cvDocuments.version,
    label: cvDocuments.label,
    isDefault: cvDocuments.isDefault,
    generatedFromProfile: cvDocuments.generatedFromProfile,
    templateUsed: cvDocuments.templateUsed,
    generatedAt: cvDocuments.generatedAt,
    status: cvDocuments.status,
    downloadCount: cvDocuments.downloadCount,
    lastAccessedAt: cvDocuments.lastAccessedAt,
    createdAt: cvDocuments.createdAt,
  };
  
  /**
   * Secure fields (including access token) for authorized access
   */
  const secureSelectFields = {
    ...publicSelectFields,
    accessToken: cvDocuments.accessToken,
    tokenExpiresAt: cvDocuments.tokenExpiresAt,
    filePath: cvDocuments.filePath,
    virusScanned: cvDocuments.virusScanned,
    scanResults: cvDocuments.scanResults,
  };

  return {
    publicSelectFields,
    secureSelectFields,
    /**
     * Build WHERE clause for active CV documents
     */
    activeDocumentsWhere: sql`${cvDocuments.status} = 'active' AND ${cvDocuments.virusScanned} = true`,
    
    /**
     * Build WHERE clause for user's CV documents
     */
    userDocumentsWhere: (profileId: string) => sql`${cvDocuments.profileId} = ${profileId}`,
    
    /**
     * Build ORDER BY clause for version sorting (latest first)
     */
    versionOrder: sql`${cvDocuments.version} DESC, ${cvDocuments.createdAt} DESC`,
  };
})();

/**
 * Access token management functions
 */
export const accessTokenManager = {
  /**
   * Generate new access token with expiration
   */
  generateToken: (expiresInHours: number = 24): { 
    token: string; 
    expiresAt: Date; 
  } => {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    return { token, expiresAt };
  },
  
  /**
   * Default token expiration (24 hours)
   */
  DEFAULT_EXPIRATION_HOURS: 24,
  
  /**
   * Extended token expiration for special cases (7 days)
   */
  EXTENDED_EXPIRATION_HOURS: 24 * 7,
  
  /**
   * Short token expiration for temporary access (1 hour)
   */
  SHORT_EXPIRATION_HOURS: 1,
};

/**
 * File operation constants
 */
export const CVDocumentConstants = {
  MAX_FILE_SIZE: 10485760, // 10MB in bytes
  ALLOWED_MIME_TYPES: Object.values(AllowedMimeTypes),
  ALLOWED_EXTENSIONS: ['pdf', 'doc', 'docx'],
  DEFAULT_TOKEN_EXPIRATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_FILENAME_LENGTH: 255,
  MAX_LABEL_LENGTH: 100,
  MAX_VERSIONS_PER_PROFILE: 50, // Reasonable limit for version history
} as const;

/**
 * Export the table and all related types/helpers
 */
export default cvDocuments;