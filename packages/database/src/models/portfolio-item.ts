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

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  boolean, 
  date,
  timestamp,
  jsonb,
  index,
  unique,
  check
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { candidateProfiles } from './candidate-profile';

// Type definitions for JSONB fields
export type TechnologiesArray = string[];

// Enum types based on database constraints
export const PortfolioItemType = {
  PROJECT: 'project',
  ARTICLE: 'article',
  DESIGN: 'design',
  CODE: 'code',
  DOCUMENT: 'document',
  LINK: 'link'
} as const;

export const ValidationStatus = {
  PENDING: 'pending',
  VALID: 'valid',
  INVALID: 'invalid',
  UNREACHABLE: 'unreachable'
} as const;

export type PortfolioItemTypeEnum = typeof PortfolioItemType[keyof typeof PortfolioItemType];
export type ValidationStatusEnum = typeof ValidationStatus[keyof typeof ValidationStatus];

/**
 * PortfolioItem table schema
 * 
 * Stores work samples and project showcases with comprehensive metadata,
 * file management, and external URL validation capabilities.
 */
export const portfolioItems = pgTable('portfolio_items', {
  // Primary Key
  id: uuid('id')
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  
  // Foreign Key to candidate_profiles table
  profileId: uuid('profile_id')
    .notNull()
    .references(() => candidateProfiles.id, { onDelete: 'cascade' }),
  
  // Item Details
  title: varchar('title', { length: 200 })
    .notNull(),
  
  description: text('description'),
  
  type: varchar('type', { length: 20 })
    .notNull()
    .$type<PortfolioItemTypeEnum>(),
  
  // File/Link Information
  fileName: varchar('file_name', { length: 255 }),
  
  filePath: text('file_path'),
  
  fileSize: integer('file_size'),
  
  mimeType: varchar('mime_type', { length: 100 }),
  
  externalUrl: text('external_url'),
  
  // Project Metadata
  technologies: jsonb('technologies')
    .$type<TechnologiesArray>()
    .default(sql`'[]'::jsonb`),
  
  projectDate: date('project_date'),
  
  role: varchar('role', { length: 200 }),
  
  // Validation Status (FR-010)
  linkValidated: boolean('link_validated')
    .default(false),
  
  lastValidationCheck: timestamp('last_validation_check', { withTimezone: true }),
  
  validationStatus: varchar('validation_status', { length: 20 })
    .default('pending')
    .$type<ValidationStatusEnum>(),
  
  // Display
  sortOrder: integer('sort_order')
    .default(0),
  
  isPublic: boolean('is_public')
    .default(true),
  
  // Metadata
  viewCount: integer('view_count')
    .default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => {
  return {
    // Indexes based on migration
    profileIdIdx: index('idx_portfolio_items_profile_id').on(table.profileId),
    typeIdx: index('idx_portfolio_items_type').on(table.type),
    publicIdx: index('idx_portfolio_items_public').on(table.isPublic),
    sortOrderIdx: index('idx_portfolio_items_sort_order').on(table.profileId, table.sortOrder),
    technologiesIdx: index('idx_portfolio_items_technologies').on(table.technologies),
    validationStatusIdx: index('idx_portfolio_items_validation_status').on(table.validationStatus),
    projectDateIdx: index('idx_portfolio_items_project_date').on(table.projectDate),
    externalUrlIdx: index('idx_portfolio_items_external_url').on(table.externalUrl),
    
    // Check constraints (these are handled by database migration)
    // Including here for documentation/type safety
    titleLength: check('portfolio_items_title_length', sql`char_length(${table.title}) >= 1`),
    descriptionLength: check('portfolio_items_description_length', sql`char_length(${table.description}) <= 1000`),
    typeValid: check('portfolio_items_type_valid', 
      sql`${table.type} IN ('project', 'article', 'design', 'code', 'document', 'link')`),
    fileSizePositive: check('portfolio_items_file_size_positive', sql`${table.fileSize} > 0`),
    validationStatusValid: check('portfolio_items_validation_status_valid',
      sql`${table.validationStatus} IN ('pending', 'valid', 'invalid', 'unreachable')`),
    fileOrUrl: check('portfolio_items_file_or_url', sql`
      (${table.filePath} IS NOT NULL AND ${table.externalUrl} IS NULL) OR
      (${table.filePath} IS NULL AND ${table.externalUrl} IS NOT NULL) OR
      (${table.filePath} IS NULL AND ${table.externalUrl} IS NULL AND ${table.type} = 'document')
    `),
    fileMetadataConsistency: check('portfolio_items_file_metadata_consistency', sql`
      (${table.filePath} IS NOT NULL AND ${table.fileName} IS NOT NULL AND ${table.fileSize} IS NOT NULL AND ${table.mimeType} IS NOT NULL) OR
      (${table.filePath} IS NULL)
    `),
    externalUrlValidation: check('portfolio_items_external_url_validation', sql`
      ${table.externalUrl} IS NULL OR
      ${table.externalUrl} ~ '^https?://[^\\s/$.?#].[^\\s]*$'
    `),
    projectDateReasonable: check('portfolio_items_project_date_reasonable', sql`
      ${table.projectDate} IS NULL OR 
      (${table.projectDate} >= '1990-01-01' AND ${table.projectDate} <= CURRENT_DATE + INTERVAL '1 year')
    `),
  };
});

/**
 * Relations for PortfolioItem
 */
export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  // Relation to candidate_profiles table
  profile: one(candidateProfiles, {
    fields: [portfolioItems.profileId],
    references: [candidateProfiles.id],
  }),
}));

/**
 * Zod validation schemas
 */

// URL validation regex (same as database constraint)
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

// Base validation schema for portfolio fields
const portfolioValidation = {
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  
  type: z.enum(['project', 'article', 'design', 'code', 'document', 'link']),
  
  fileName: z.string()
    .max(255, 'File name must not exceed 255 characters')
    .optional(),
  
  filePath: z.string().optional(),
  
  fileSize: z.number()
    .int('File size must be an integer')
    .positive('File size must be positive')
    .optional(),
  
  mimeType: z.string()
    .max(100, 'MIME type must not exceed 100 characters')
    .optional(),
  
  externalUrl: z.string()
    .regex(URL_REGEX, 'External URL must be a valid HTTP/HTTPS URL')
    .optional(),
  
  technologies: z.array(z.string().min(1).max(100))
    .default([]),
  
  projectDate: z.date()
    .min(new Date('1990-01-01'), 'Project date cannot be before 1990')
    .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'Project date cannot be more than 1 year in the future')
    .optional(),
  
  role: z.string()
    .max(200, 'Role must not exceed 200 characters')
    .optional(),
  
  validationStatus: z.enum(['pending', 'valid', 'invalid', 'unreachable'])
    .default('pending'),
  
  sortOrder: z.number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order cannot be negative')
    .default(0),
  
  isPublic: z.boolean().default(true),
};

// Insert schema - for creating new portfolio items
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems, portfolioValidation)
  .refine((data) => {
    // Either file or URL or neither (for documents)
    const hasFile = data.filePath;
    const hasUrl = data.externalUrl;
    const isDocument = data.type === 'document';
    
    return (hasFile && !hasUrl) || (!hasFile && hasUrl) || (!hasFile && !hasUrl && isDocument);
  }, {
    message: 'Portfolio item must have either a file or an external URL, or be a document type with neither',
    path: ['externalUrl'],
  })
  .refine((data) => {
    // File metadata consistency
    const hasFile = data.filePath;
    const hasFileName = data.fileName;
    const hasFileSize = data.fileSize;
    const hasMimeType = data.mimeType;
    
    if (hasFile) {
      return hasFileName && hasFileSize && hasMimeType;
    }
    return true;
  }, {
    message: 'When file path is provided, file name, size, and MIME type are required',
    path: ['fileName'],
  });

// Select schema - for querying portfolio items
export const selectPortfolioItemSchema = createSelectSchema(portfolioItems);

// Update schema - for updating existing portfolio items (all fields optional except id)
export const updatePortfolioItemSchema = createSelectSchema(portfolioItems, {
  ...portfolioValidation,
  id: z.string().uuid(),
}).partial().required({ id: true })
  .refine((data) => {
    // File/URL validation for updates
    if (data.filePath !== undefined || data.externalUrl !== undefined || data.type !== undefined) {
      const hasFile = data.filePath;
      const hasUrl = data.externalUrl;
      const isDocument = data.type === 'document';
      
      // If any of these are being updated, apply the constraint
      if (hasFile !== undefined || hasUrl !== undefined) {
        return (hasFile && !hasUrl) || (!hasFile && hasUrl) || (!hasFile && !hasUrl && isDocument);
      }
    }
    return true;
  }, {
    message: 'Portfolio item must have either a file or an external URL, or be a document type with neither',
    path: ['externalUrl'],
  });

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
export const portfolioHelpers = {
  /**
   * Check if a portfolio item needs URL validation
   */
  needsValidation: (item: SelectPortfolioItem): boolean => {
    if (!item.externalUrl) return false;
    
    // Needs validation if:
    // 1. Never been validated
    // 2. Validation is older than 7 days
    // 3. Last validation failed
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return (
      !item.lastValidationCheck ||
      item.lastValidationCheck < sevenDaysAgo ||
      item.validationStatus === 'invalid' ||
      item.validationStatus === 'unreachable'
    );
  },
  
  /**
   * Validate file type based on MIME type
   */
  validateFileType: (mimeType: string): { valid: boolean; category: string; error?: string } => {
    const fileTypeMap: Record<string, string> = {
      // Images
      'image/jpeg': 'image',
      'image/jpg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'image/svg+xml': 'image',
      
      // Documents
      'application/pdf': 'document',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'text/plain': 'document',
      'text/markdown': 'document',
      
      // Code files
      'text/javascript': 'code',
      'text/typescript': 'code',
      'text/html': 'code',
      'text/css': 'code',
      'application/json': 'code',
      'text/xml': 'code',
      
      // Archives
      'application/zip': 'archive',
      'application/x-zip-compressed': 'archive',
      'application/x-rar-compressed': 'archive',
      
      // Media
      'video/mp4': 'video',
      'video/avi': 'video',
      'video/quicktime': 'video',
      'audio/mpeg': 'audio',
      'audio/wav': 'audio',
    };
    
    const category = fileTypeMap[mimeType.toLowerCase()];
    
    if (!category) {
      return {
        valid: false,
        category: 'unknown',
        error: `Unsupported file type: ${mimeType}`
      };
    }
    
    return {
      valid: true,
      category
    };
  },
  
  /**
   * Filter and sort portfolio items
   */
  filterAndSort: (
    items: SelectPortfolioItem[],
    filters: {
      type?: PortfolioItemTypeEnum[];
      technologies?: string[];
      hasFile?: boolean;
      hasUrl?: boolean;
      isPublic?: boolean;
      validationStatus?: ValidationStatusEnum[];
    } = {},
    sort: {
      field: 'sortOrder' | 'createdAt' | 'updatedAt' | 'title' | 'projectDate' | 'viewCount';
      direction: 'asc' | 'desc';
    } = { field: 'sortOrder', direction: 'asc' }
  ): SelectPortfolioItem[] => {
    let filtered = items;
    
    // Apply filters
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(item => filters.type!.includes(item.type));
    }
    
    if (filters.technologies && filters.technologies.length > 0) {
      filtered = filtered.filter(item => 
        item.technologies && 
        filters.technologies!.some(tech => 
          item.technologies!.some(itemTech => 
            itemTech.toLowerCase().includes(tech.toLowerCase())
          )
        )
      );
    }
    
    if (filters.hasFile !== undefined) {
      filtered = filtered.filter(item => 
        filters.hasFile ? !!item.filePath : !item.filePath
      );
    }
    
    if (filters.hasUrl !== undefined) {
      filtered = filtered.filter(item => 
        filters.hasUrl ? !!item.externalUrl : !item.externalUrl
      );
    }
    
    if (filters.isPublic !== undefined) {
      filtered = filtered.filter(item => item.isPublic === filters.isPublic);
    }
    
    if (filters.validationStatus && filters.validationStatus.length > 0) {
      filtered = filtered.filter(item => 
        filters.validationStatus!.includes(item.validationStatus)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sort.field) {
        case 'sortOrder':
          aValue = a.sortOrder;
          bValue = b.sortOrder;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'projectDate':
          aValue = a.projectDate || new Date(0);
          bValue = b.projectDate || new Date(0);
          break;
        case 'viewCount':
          aValue = a.viewCount;
          bValue = b.viewCount;
          break;
        default:
          aValue = a.sortOrder;
          bValue = b.sortOrder;
      }
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  },
  
  /**
   * Get portfolio statistics
   */
  getStatistics: (items: SelectPortfolioItem[]) => {
    const stats = {
      total: items.length,
      byType: {} as Record<PortfolioItemTypeEnum, number>,
      byValidationStatus: {} as Record<ValidationStatusEnum, number>,
      technologiesUsed: new Set<string>(),
      totalViews: 0,
      hasFiles: 0,
      hasUrls: 0,
      needsValidation: 0,
    };
    
    // Initialize counters
    Object.values(PortfolioItemType).forEach(type => {
      stats.byType[type] = 0;
    });
    
    Object.values(ValidationStatus).forEach(status => {
      stats.byValidationStatus[status] = 0;
    });
    
    items.forEach(item => {
      // Count by type
      stats.byType[item.type]++;
      
      // Count by validation status
      stats.byValidationStatus[item.validationStatus]++;
      
      // Collect technologies
      if (item.technologies) {
        item.technologies.forEach(tech => stats.technologiesUsed.add(tech));
      }
      
      // Sum views
      stats.totalViews += item.viewCount;
      
      // Count file/URL types
      if (item.filePath) stats.hasFiles++;
      if (item.externalUrl) stats.hasUrls++;
      
      // Count items needing validation
      if (portfolioHelpers.needsValidation(item)) {
        stats.needsValidation++;
      }
    });
    
    return {
      ...stats,
      technologiesUsed: Array.from(stats.technologiesUsed),
    };
  },
  
  /**
   * Generate next sort order for a profile
   */
  getNextSortOrder: (existingItems: SelectPortfolioItem[]): number => {
    if (existingItems.length === 0) return 1;
    
    const maxSortOrder = Math.max(...existingItems.map(item => item.sortOrder));
    return maxSortOrder + 1;
  },
  
  /**
   * Reorder portfolio items
   */
  reorderItems: (
    items: SelectPortfolioItem[],
    targetId: string,
    newSortOrder: number
  ): Array<{ id: string; sortOrder: number }> => {
    const updates: Array<{ id: string; sortOrder: number }> = [];
    const targetItem = items.find(item => item.id === targetId);
    
    if (!targetItem) return updates;
    
    const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetIndex = sortedItems.findIndex(item => item.id === targetId);
    const newIndex = Math.max(0, Math.min(newSortOrder - 1, sortedItems.length - 1));
    
    // Remove target item and insert at new position
    sortedItems.splice(targetIndex, 1);
    sortedItems.splice(newIndex, 0, targetItem);
    
    // Generate new sort orders
    sortedItems.forEach((item, index) => {
      const newOrder = index + 1;
      if (item.sortOrder !== newOrder) {
        updates.push({ id: item.id, sortOrder: newOrder });
      }
    });
    
    return updates;
  },
};

/**
 * URL validation and status management helpers (FR-010)
 */
export const urlValidationHelpers = {
  /**
   * Validate URL format
   */
  validateUrlFormat: (url: string): { valid: boolean; error?: string } => {
    if (!url) return { valid: false, error: 'URL is required' };
    
    if (!URL_REGEX.test(url)) {
      return { valid: false, error: 'URL must be a valid HTTP or HTTPS URL' };
    }
    
    // Additional checks
    try {
      const urlObj = new URL(url);
      
      // Check for common invalid patterns
      if (urlObj.hostname.includes('..') || urlObj.hostname.startsWith('.')) {
        return { valid: false, error: 'Invalid hostname in URL' };
      }
      
      // Check for localhost/internal IPs in production
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
        return { valid: false, error: 'Local and private network URLs are not allowed' };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  },
  
  /**
   * Update validation status
   */
  updateValidationStatus: (
    validationResult: {
      isValid: boolean;
      responseCode?: number;
      responseTime?: number;
      error?: string;
    }
  ): {
    validationStatus: ValidationStatusEnum;
    linkValidated: boolean;
  } => {
    let status: ValidationStatusEnum;
    
    if (validationResult.isValid) {
      status = ValidationStatus.VALID;
    } else if (validationResult.responseCode && validationResult.responseCode >= 400 && validationResult.responseCode <= 499) {
      status = ValidationStatus.INVALID;
    } else {
      status = ValidationStatus.UNREACHABLE;
    }
    
    return {
      validationStatus: status,
      linkValidated: validationResult.isValid,
    };
  },
  
  /**
   * Get validation priority based on portfolio item characteristics
   */
  getValidationPriority: (item: SelectPortfolioItem): 'low' | 'normal' | 'high' => {
    // High priority for public items that haven't been validated
    if (item.isPublic && !item.linkValidated) {
      return 'high';
    }
    
    // Normal priority for items that need re-validation
    if (portfolioHelpers.needsValidation(item)) {
      return 'normal';
    }
    
    // Low priority for everything else
    return 'low';
  },
  
  /**
   * Create validation queue entry
   */
  createValidationQueueEntry: (item: SelectPortfolioItem) => {
    if (!item.externalUrl) return null;
    
    return {
      portfolioItemId: item.id,
      url: item.externalUrl,
      priority: urlValidationHelpers.getValidationPriority(item),
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
    };
  },
};

/**
 * Technology tagging helpers
 */
export const technologyHelpers = {
  /**
   * Normalize technology names for consistency
   */
  normalizeTechnology: (tech: string): string => {
    const normalized = tech.trim().toLowerCase();
    
    // Common normalizations
    const normalizations: Record<string, string> = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'react.js': 'React',
      'reactjs': 'React',
      'vue.js': 'Vue.js',
      'vuejs': 'Vue.js',
      'angular.js': 'AngularJS',
      'angularjs': 'AngularJS',
      'node.js': 'Node.js',
      'nodejs': 'Node.js',
      'next.js': 'Next.js',
      'nextjs': 'Next.js',
      'express.js': 'Express.js',
      'expressjs': 'Express.js',
      'css3': 'CSS3',
      'html5': 'HTML5',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mysql': 'MySQL',
      'mongodb': 'MongoDB',
      'mongo': 'MongoDB',
      'redis': 'Redis',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'k8s': 'Kubernetes',
      'aws': 'AWS',
      'gcp': 'Google Cloud',
      'google cloud platform': 'Google Cloud',
      'azure': 'Azure',
      'microsoft azure': 'Azure',
    };
    
    return normalizations[normalized] || tech.trim();
  },
  
  /**
   * Extract technologies from text (basic implementation)
   */
  extractTechnologiesFromText: (text: string): string[] => {
    const techKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Express.js', 'Fastify',
      'Node.js', 'Deno', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
      'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify',
      'GraphQL', 'REST', 'API', 'Microservices', 'Serverless',
      'HTML', 'CSS', 'Sass', 'Less', 'Tailwind', 'Bootstrap', 'Material-UI',
      'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'GitHub Actions',
      'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'Keras',
      'Mobile', 'React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin',
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const found = new Set<string>();
    
    techKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        found.add(technologyHelpers.normalizeTechnology(keyword));
      }
    });
    
    return Array.from(found);
  },
  
  /**
   * Get technology suggestions based on existing technologies
   */
  getTechnologySuggestions: (existingTech: string[], allPortfolioTech: string[]): string[] => {
    // Get technology co-occurrence patterns
    const suggestions = new Set<string>();
    
    // Common technology combinations
    const combinations: Record<string, string[]> = {
      'React': ['TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js'],
      'Vue.js': ['TypeScript', 'Nuxt.js', 'Vuetify', 'Pinia'],
      'Angular': ['TypeScript', 'RxJS', 'Angular Material', 'NgRx'],
      'Node.js': ['Express.js', 'MongoDB', 'PostgreSQL', 'TypeScript'],
      'Python': ['Django', 'Flask', 'PostgreSQL', 'Redis'],
      'JavaScript': ['TypeScript', 'React', 'Node.js', 'Express.js'],
      'PostgreSQL': ['Node.js', 'Python', 'Drizzle ORM', 'Prisma'],
      'MongoDB': ['Node.js', 'Express.js', 'Mongoose'],
      'Docker': ['Kubernetes', 'AWS', 'CI/CD', 'Nginx'],
      'AWS': ['Docker', 'Terraform', 'Serverless', 'Lambda'],
    };
    
    existingTech.forEach(tech => {
      const related = combinations[tech];
      if (related) {
        related.forEach(relatedTech => {
          if (!existingTech.includes(relatedTech)) {
            suggestions.add(relatedTech);
          }
        });
      }
    });
    
    // Add frequently used technologies from user's portfolio
    const techCounts: Record<string, number> = {};
    allPortfolioTech.forEach(tech => {
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    });
    
    Object.entries(techCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([tech]) => {
        if (!existingTech.includes(tech)) {
          suggestions.add(tech);
        }
      });
    
    return Array.from(suggestions);
  },
};

/**
 * View tracking helpers
 */
export const viewTrackingHelpers = {
  /**
   * Increment view count for a portfolio item
   */
  incrementViewCount: (currentCount: number): number => {
    return currentCount + 1;
  },
  
  /**
   * Get view statistics for a collection of portfolio items
   */
  getViewStatistics: (items: SelectPortfolioItem[]) => {
    const totalViews = items.reduce((sum, item) => sum + item.viewCount, 0);
    const avgViews = items.length > 0 ? totalViews / items.length : 0;
    const mostViewed = items.reduce((max, item) => 
      item.viewCount > max.viewCount ? item : max, 
      items[0] || { viewCount: 0 }
    );
    
    return {
      totalViews,
      averageViews: Math.round(avgViews * 100) / 100,
      mostViewed: mostViewed?.viewCount > 0 ? mostViewed : null,
      viewsByType: items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + item.viewCount;
        return acc;
      }, {} as Record<PortfolioItemTypeEnum, number>),
    };
  },
};

/**
 * Database query helpers
 */
export const portfolioQueries = {
  /**
   * Common select fields for public portfolio items
   */
  get publicSelectFields() {
    return {
      id: portfolioItems.id,
      profileId: portfolioItems.profileId,
      title: portfolioItems.title,
      description: portfolioItems.description,
      type: portfolioItems.type,
      externalUrl: portfolioItems.externalUrl,
      technologies: portfolioItems.technologies,
      projectDate: portfolioItems.projectDate,
      role: portfolioItems.role,
      sortOrder: portfolioItems.sortOrder,
      viewCount: portfolioItems.viewCount,
      createdAt: portfolioItems.createdAt,
      updatedAt: portfolioItems.updatedAt,
    };
  },
  
  /**
   * Fields for portfolio management (includes private data)
   */
  get managementSelectFields() {
    return {
      ...this.publicSelectFields,
      fileName: portfolioItems.fileName,
      filePath: portfolioItems.filePath,
      fileSize: portfolioItems.fileSize,
      mimeType: portfolioItems.mimeType,
      linkValidated: portfolioItems.linkValidated,
      lastValidationCheck: portfolioItems.lastValidationCheck,
      validationStatus: portfolioItems.validationStatus,
      isPublic: portfolioItems.isPublic,
    };
  },
};

/**
 * Export the table and all related types/helpers
 */
export default portfolioItems;