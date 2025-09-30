/**
 * PortfolioService - Comprehensive portfolio management
 * 
 * Handles portfolio item creation, management, validation, and organization
 * with support for various content types, privacy controls, and validation.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
import { db } from '@openrole/database';
import { 
  portfolioItems,
  candidateProfiles,
  InsertPortfolioItem,
  SelectPortfolioItem,
  PortfolioType,
  PortfolioValidationStatus
} from '@openrole/database/models/candidate-profile';
import { 
  cvSchemas,
  validateCVData,
  PortfolioItemCreateRequest,
  PortfolioItemUpdateRequest
} from '@openrole/validation';
import { fileUploadService } from './file-upload-service';

export interface PortfolioItemWithStats extends SelectPortfolioItem {
  viewCount?: number;
  likeCount?: number;
  shareCount?: number;
  isOwner?: boolean;
  canEdit?: boolean;
}

export interface PortfolioCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  items: SelectPortfolioItem[];
  isPublic: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioStats {
  totalItems: number;
  publicItems: number;
  privateItems: number;
  totalViews: number;
  totalLikes: number;
  typeDistribution: Array<{ type: PortfolioType; count: number }>;
  recentActivity: Date | null;
  completionScore: number; // 0-100 based on portfolio quality
}

export interface PortfolioValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    field: string;
    message: string;
  }>;
  suggestions: string[];
}

export interface IPortfolioService {
  // Core CRUD operations
  createPortfolioItem(userId: string, data: PortfolioItemCreateRequest): Promise<SelectPortfolioItem>;
  getPortfolioItem(itemId: string, viewerUserId?: string): Promise<SelectPortfolioItem | null>;
  updatePortfolioItem(userId: string, itemId: string, data: PortfolioItemUpdateRequest): Promise<SelectPortfolioItem>;
  deletePortfolioItem(userId: string, itemId: string): Promise<boolean>;
  
  // Portfolio management
  getPortfolioItems(userId: string, viewerUserId?: string): Promise<PortfolioItemWithStats[]>;
  getPublicPortfolioItems(userId: string, limit?: number): Promise<SelectPortfolioItem[]>;
  reorderPortfolioItems(userId: string, itemIds: string[]): Promise<boolean>;
  
  // File management
  uploadPortfolioFile(userId: string, itemId: string, file: Express.Multer.File): Promise<SelectPortfolioItem>;
  removePortfolioFile(userId: string, itemId: string): Promise<SelectPortfolioItem>;
  
  // URL validation and previews
  validateExternalUrl(url: string): Promise<{
    isValid: boolean;
    isAccessible: boolean;
    title?: string;
    description?: string;
    imageUrl?: string;
    statusCode?: number;
  }>;
  
  generateUrlPreview(url: string): Promise<{
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
  }>;
  
  // Collections and organization
  createCollection(userId: string, name: string, description?: string): Promise<PortfolioCollection>;
  getCollections(userId: string): Promise<PortfolioCollection[]>;
  addItemToCollection(userId: string, collectionId: string, itemId: string): Promise<boolean>;
  removeItemFromCollection(userId: string, collectionId: string, itemId: string): Promise<boolean>;
  
  // Validation and quality scoring
  validatePortfolioItem(data: PortfolioItemCreateRequest | PortfolioItemUpdateRequest): Promise<PortfolioValidationResult>;
  calculatePortfolioScore(userId: string): Promise<number>;
  getPortfolioSuggestions(userId: string): Promise<string[]>;
  
  // Analytics and stats
  getPortfolioStats(userId: string): Promise<PortfolioStats>;
  trackPortfolioView(itemId: string, viewerUserId?: string): Promise<void>;
  getPortfolioAnalytics(userId: string, days?: number): Promise<any>;
  
  // Search and discovery
  searchPortfolioItems(query: string, filters?: any): Promise<SelectPortfolioItem[]>;
  getRelatedPortfolioItems(itemId: string, limit?: number): Promise<SelectPortfolioItem[]>;
  getTrendingPortfolioItems(limit?: number): Promise<SelectPortfolioItem[]>;
  
  // Import and export
  importFromLinkedIn(userId: string, linkedInData: any): Promise<SelectPortfolioItem[]>;
  importFromGitHub(userId: string, githubUsername: string): Promise<SelectPortfolioItem[]>;
  exportPortfolio(userId: string, format: 'json' | 'pdf' | 'html'): Promise<string | Buffer>;
}

export class PortfolioService implements IPortfolioService {
  /**
   * Create a new portfolio item
   */
  async createPortfolioItem(userId: string, data: PortfolioItemCreateRequest): Promise<SelectPortfolioItem> {
    // Validate input data
    const validation = await this.validatePortfolioItem(data);
    if (!validation.isValid) {
      const errors = validation.issues.filter(i => i.type === 'error').map(i => i.message);
      throw new Error(`Portfolio item validation failed: ${errors.join(', ')}`);
    }

    // Validate with Zod schema
    const schemaValidation = validateCVData(cvSchemas.portfolioCreate, data);
    if (!schemaValidation.success) {
      throw new Error(`Schema validation failed: ${schemaValidation.errors?.map(e => e.message).join(', ')}`);
    }

    // Get next sort order
    const [lastItem] = await db
      .select({ sortOrder: portfolioItems.sortOrder })
      .from(portfolioItems)
      .where(eq(portfolioItems.userId, userId))
      .orderBy(desc(portfolioItems.sortOrder))
      .limit(1);

    const nextSortOrder = (lastItem?.sortOrder || 0) + 1;

    // Prepare portfolio item data
    const portfolioData: InsertPortfolioItem = {
      userId,
      title: schemaValidation.data.title,
      description: schemaValidation.data.description || null,
      type: schemaValidation.data.type,
      externalUrl: schemaValidation.data.externalUrl || null,
      technologies: schemaValidation.data.technologies || [],
      projectDate: schemaValidation.data.projectDate ? new Date(schemaValidation.data.projectDate) : null,
      role: schemaValidation.data.role || null,
      isPublic: schemaValidation.data.isPublic !== false, // Default to true
      sortOrder: schemaValidation.data.sortOrder || nextSortOrder,
      validationStatus: PortfolioValidationStatus.PENDING,
      fileName: null,
      filePath: null,
      fileSize: null,
      mimeType: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert portfolio item
    const [portfolioItem] = await db
      .insert(portfolioItems)
      .values(portfolioData)
      .returning();

    // If external URL provided, validate it asynchronously
    if (portfolioItem.externalUrl) {
      this.validateAndUpdateUrl(portfolioItem.id, portfolioItem.externalUrl)
        .catch(error => console.error('URL validation failed:', error));
    } else {
      // If no external URL, mark as valid
      await db
        .update(portfolioItems)
        .set({ 
          validationStatus: PortfolioValidationStatus.VALID,
          updatedAt: new Date()
        })
        .where(eq(portfolioItems.id, portfolioItem.id));
    }

    return portfolioItem;
  }

  /**
   * Get portfolio item by ID with permission checks
   */
  async getPortfolioItem(itemId: string, viewerUserId?: string): Promise<SelectPortfolioItem | null> {
    const [item] = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.id, itemId))
      .limit(1);

    if (!item) {
      return null;
    }

    // Check permissions
    if (!item.isPublic && item.userId !== viewerUserId) {
      return null; // Private item, not owned by viewer
    }

    // Track view if different user
    if (viewerUserId && item.userId !== viewerUserId) {
      await this.trackPortfolioView(itemId, viewerUserId);
    }

    return item;
  }

  /**
   * Update portfolio item
   */
  async updatePortfolioItem(userId: string, itemId: string, data: PortfolioItemUpdateRequest): Promise<SelectPortfolioItem> {
    // Check ownership
    const [existingItem] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, itemId),
          eq(portfolioItems.userId, userId)
        )
      )
      .limit(1);

    if (!existingItem) {
      throw new Error('Portfolio item not found or access denied');
    }

    // Validate update data
    const validation = await this.validatePortfolioItem(data);
    if (!validation.isValid) {
      const errors = validation.issues.filter(i => i.type === 'error').map(i => i.message);
      throw new Error(`Portfolio update validation failed: ${errors.join(', ')}`);
    }

    // Validate with Zod schema
    const schemaValidation = validateCVData(cvSchemas.portfolioUpdate, data);
    if (!schemaValidation.success) {
      throw new Error(`Schema validation failed: ${schemaValidation.errors?.map(e => e.message).join(', ')}`);
    }

    // Prepare update data (only include provided fields)
    const updateData: Partial<InsertPortfolioItem> = {
      updatedAt: new Date()
    };

    if (schemaValidation.data.title !== undefined) updateData.title = schemaValidation.data.title;
    if (schemaValidation.data.description !== undefined) updateData.description = schemaValidation.data.description;
    if (schemaValidation.data.externalUrl !== undefined) updateData.externalUrl = schemaValidation.data.externalUrl;
    if (schemaValidation.data.technologies !== undefined) updateData.technologies = schemaValidation.data.technologies;
    if (schemaValidation.data.projectDate !== undefined) {
      updateData.projectDate = schemaValidation.data.projectDate ? new Date(schemaValidation.data.projectDate) : null;
    }
    if (schemaValidation.data.role !== undefined) updateData.role = schemaValidation.data.role;
    if (schemaValidation.data.isPublic !== undefined) updateData.isPublic = schemaValidation.data.isPublic;
    if (schemaValidation.data.sortOrder !== undefined) updateData.sortOrder = schemaValidation.data.sortOrder;

    // If URL changed, re-validate
    if (updateData.externalUrl !== undefined && updateData.externalUrl !== existingItem.externalUrl) {
      updateData.validationStatus = PortfolioValidationStatus.PENDING;
    }

    // Update portfolio item
    const [updatedItem] = await db
      .update(portfolioItems)
      .set(updateData)
      .where(eq(portfolioItems.id, itemId))
      .returning();

    // Re-validate URL if changed
    if (updateData.externalUrl && updateData.validationStatus === PortfolioValidationStatus.PENDING) {
      this.validateAndUpdateUrl(itemId, updateData.externalUrl)
        .catch(error => console.error('URL validation failed:', error));
    }

    return updatedItem;
  }

  /**
   * Delete portfolio item
   */
  async deletePortfolioItem(userId: string, itemId: string): Promise<boolean> {
    // Check ownership
    const [existingItem] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, itemId),
          eq(portfolioItems.userId, userId)
        )
      )
      .limit(1);

    if (!existingItem) {
      return false;
    }

    // Delete associated file if exists
    if (existingItem.filePath) {
      try {
        await fileUploadService.deletePortfolioFile(itemId, userId);
      } catch (error) {
        console.error('Failed to delete portfolio file:', error);
      }
    }

    // Delete from database
    await db
      .delete(portfolioItems)
      .where(eq(portfolioItems.id, itemId));

    return true;
  }

  /**
   * Get all portfolio items for user
   */
  async getPortfolioItems(userId: string, viewerUserId?: string): Promise<PortfolioItemWithStats[]> {
    let query = db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.userId, userId));

    // If viewer is not the owner, only show public items
    if (viewerUserId !== userId) {
      query = query.where(
        and(
          eq(portfolioItems.userId, userId),
          eq(portfolioItems.isPublic, true)
        )
      );
    }

    const items = await query.orderBy(portfolioItems.sortOrder);

    // Add stats and permission flags
    return items.map(item => ({
      ...item,
      viewCount: 0, // TODO: Implement view tracking
      likeCount: 0, // TODO: Implement like tracking
      shareCount: 0, // TODO: Implement share tracking
      isOwner: item.userId === viewerUserId,
      canEdit: item.userId === viewerUserId
    }));
  }

  /**
   * Get public portfolio items for user
   */
  async getPublicPortfolioItems(userId: string, limit = 10): Promise<SelectPortfolioItem[]> {
    return await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.userId, userId),
          eq(portfolioItems.isPublic, true)
        )
      )
      .orderBy(portfolioItems.sortOrder)
      .limit(limit);
  }

  /**
   * Reorder portfolio items
   */
  async reorderPortfolioItems(userId: string, itemIds: string[]): Promise<boolean> {
    try {
      // Update sort order for each item
      for (let i = 0; i < itemIds.length; i++) {
        await db
          .update(portfolioItems)
          .set({ 
            sortOrder: i + 1,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(portfolioItems.id, itemIds[i]),
              eq(portfolioItems.userId, userId)
            )
          );
      }
      return true;
    } catch (error) {
      console.error('Failed to reorder portfolio items:', error);
      return false;
    }
  }

  /**
   * Upload file for portfolio item
   */
  async uploadPortfolioFile(userId: string, itemId: string, file: Express.Multer.File): Promise<SelectPortfolioItem> {
    // Check ownership
    const [item] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, itemId),
          eq(portfolioItems.userId, userId)
        )
      )
      .limit(1);

    if (!item) {
      throw new Error('Portfolio item not found or access denied');
    }

    // Upload file
    const uploadResult = await fileUploadService.uploadPortfolioFile(
      userId,
      file,
      itemId,
      item.type
    );

    // Get updated item
    const [updatedItem] = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.id, itemId))
      .limit(1);

    return updatedItem;
  }

  /**
   * Remove file from portfolio item
   */
  async removePortfolioFile(userId: string, itemId: string): Promise<SelectPortfolioItem> {
    await fileUploadService.deletePortfolioFile(itemId, userId);

    const [updatedItem] = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.id, itemId))
      .limit(1);

    return updatedItem;
  }

  /**
   * Validate external URL
   */
  async validateExternalUrl(url: string): Promise<{
    isValid: boolean;
    isAccessible: boolean;
    title?: string;
    description?: string;
    imageUrl?: string;
    statusCode?: number;
  }> {
    try {
      // Basic URL validation
      new URL(url);

      // Check accessibility
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'OpenRole-Portfolio-Validator/1.0'
        }
      });

      return {
        isValid: true,
        isAccessible: response.ok,
        statusCode: response.status
      };

    } catch (error) {
      return {
        isValid: false,
        isAccessible: false
      };
    }
  }

  /**
   * Generate URL preview with metadata
   */
  async generateUrlPreview(url: string): Promise<{
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
  }> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'OpenRole-Portfolio-Previewer/1.0'
        }
      });

      if (!response.ok) {
        return {};
      }

      const html = await response.text();
      
      // Extract meta tags (simplified parsing)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      const siteNameMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i);

      return {
        title: ogTitleMatch?.[1] || titleMatch?.[1] || undefined,
        description: ogDescMatch?.[1] || descMatch?.[1] || undefined,
        imageUrl: ogImageMatch?.[1] || undefined,
        siteName: siteNameMatch?.[1] || undefined
      };

    } catch (error) {
      console.error('Failed to generate URL preview:', error);
      return {};
    }
  }

  /**
   * Create portfolio collection
   */
  async createCollection(userId: string, name: string, description?: string): Promise<PortfolioCollection> {
    // TODO: Implement collections table and logic
    throw new Error('Collections not yet implemented');
  }

  /**
   * Get portfolio collections
   */
  async getCollections(userId: string): Promise<PortfolioCollection[]> {
    // TODO: Implement collections retrieval
    return [];
  }

  /**
   * Add item to collection
   */
  async addItemToCollection(userId: string, collectionId: string, itemId: string): Promise<boolean> {
    // TODO: Implement collection item management
    return false;
  }

  /**
   * Remove item from collection
   */
  async removeItemFromCollection(userId: string, collectionId: string, itemId: string): Promise<boolean> {
    // TODO: Implement collection item management
    return false;
  }

  /**
   * Validate portfolio item data
   */
  async validatePortfolioItem(data: PortfolioItemCreateRequest | PortfolioItemUpdateRequest): Promise<PortfolioValidationResult> {
    const issues: Array<{ type: 'error' | 'warning' | 'suggestion'; field: string; message: string }> = [];
    const suggestions: string[] = [];
    let score = 100;

    // Title validation
    if ('title' in data && data.title) {
      if (data.title.length < 5) {
        issues.push({
          type: 'warning',
          field: 'title',
          message: 'Title should be more descriptive (at least 5 characters)'
        });
        score -= 10;
      }
      if (data.title.length > 200) {
        issues.push({
          type: 'error',
          field: 'title',
          message: 'Title too long (max 200 characters)'
        });
        score -= 20;
      }
    }

    // Description validation
    if ('description' in data && data.description) {
      if (data.description.length < 20) {
        issues.push({
          type: 'suggestion',
          field: 'description',
          message: 'Consider adding a more detailed description'
        });
        suggestions.push('Add more detail to your project description to help viewers understand your work');
        score -= 5;
      }
    } else {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Description is recommended for better portfolio quality'
      });
      score -= 15;
    }

    // Technologies validation
    if ('technologies' in data && data.technologies) {
      if (data.technologies.length === 0) {
        suggestions.push('Add technologies used to help showcase your technical skills');
        score -= 10;
      }
      if (data.technologies.length > 20) {
        issues.push({
          type: 'warning',
          field: 'technologies',
          message: 'Too many technologies listed (consider focusing on key ones)'
        });
        score -= 5;
      }
    }

    // URL validation
    if ('externalUrl' in data && data.externalUrl) {
      try {
        new URL(data.externalUrl);
      } catch {
        issues.push({
          type: 'error',
          field: 'externalUrl',
          message: 'Invalid URL format'
        });
        score -= 25;
      }
    }

    // Type-specific validation
    if ('type' in data) {
      switch (data.type) {
        case PortfolioType.LINK:
          if (!('externalUrl' in data) || !data.externalUrl) {
            issues.push({
              type: 'error',
              field: 'externalUrl',
              message: 'External URL is required for link type items'
            });
            score -= 30;
          }
          break;
        
        case PortfolioType.PROJECT:
          if (!('projectDate' in data) || !data.projectDate) {
            suggestions.push('Add project date to show when this work was completed');
            score -= 5;
          }
          if (!('role' in data) || !data.role) {
            suggestions.push('Describe your role in this project');
            score -= 5;
          }
          break;
      }
    }

    // General suggestions
    if (score > 80) {
      suggestions.push('Great portfolio item! Consider adding more details to make it stand out even more.');
    } else if (score > 60) {
      suggestions.push('Good portfolio item. Add more description and context to improve quality.');
    } else {
      suggestions.push('This portfolio item needs more information to be effective.');
    }

    return {
      isValid: !issues.some(i => i.type === 'error'),
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  /**
   * Calculate overall portfolio score
   */
  async calculatePortfolioScore(userId: string): Promise<number> {
    const items = await this.getPortfolioItems(userId, userId);
    
    if (items.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let itemCount = 0;

    for (const item of items) {
      const validation = await this.validatePortfolioItem(item);
      totalScore += validation.score;
      itemCount++;
    }

    // Base score from individual items
    let portfolioScore = totalScore / itemCount;

    // Bonus for having multiple items
    if (items.length >= 3) portfolioScore += 10;
    if (items.length >= 5) portfolioScore += 5;

    // Bonus for variety in types
    const types = new Set(items.map(item => item.type));
    if (types.size >= 2) portfolioScore += 5;
    if (types.size >= 3) portfolioScore += 5;

    return Math.min(100, Math.round(portfolioScore));
  }

  /**
   * Get portfolio improvement suggestions
   */
  async getPortfolioSuggestions(userId: string): Promise<string[]> {
    const items = await this.getPortfolioItems(userId, userId);
    const suggestions: string[] = [];

    if (items.length === 0) {
      suggestions.push('Add your first portfolio item to showcase your work');
      return suggestions;
    }

    if (items.length < 3) {
      suggestions.push('Add more portfolio items to create a comprehensive showcase (aim for 3-5 items)');
    }

    const types = new Set(items.map(item => item.type));
    if (types.size === 1) {
      suggestions.push('Diversify your portfolio with different types of content (projects, articles, designs, etc.)');
    }

    const itemsWithoutDescription = items.filter(item => !item.description || item.description.length < 20);
    if (itemsWithoutDescription.length > 0) {
      suggestions.push('Add detailed descriptions to your portfolio items to provide more context');
    }

    const itemsWithoutTechnologies = items.filter(item => !item.technologies || item.technologies.length === 0);
    if (itemsWithoutTechnologies.length > 0) {
      suggestions.push('Tag your projects with technologies used to improve discoverability');
    }

    return suggestions;
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(userId: string): Promise<PortfolioStats> {
    const items = await this.getPortfolioItems(userId, userId);
    
    const typeDistribution = new Map<PortfolioType, number>();
    let totalViews = 0;
    let totalLikes = 0;
    let recentActivity: Date | null = null;

    items.forEach(item => {
      // Count types
      typeDistribution.set(item.type, (typeDistribution.get(item.type) || 0) + 1);
      
      // Track recent activity
      if (!recentActivity || item.updatedAt > recentActivity) {
        recentActivity = item.updatedAt;
      }
      
      // TODO: Add actual view and like counts
    });

    const portfolioScore = await this.calculatePortfolioScore(userId);

    return {
      totalItems: items.length,
      publicItems: items.filter(item => item.isPublic).length,
      privateItems: items.filter(item => !item.isPublic).length,
      totalViews,
      totalLikes,
      typeDistribution: Array.from(typeDistribution.entries()).map(([type, count]) => ({ type, count })),
      recentActivity,
      completionScore: portfolioScore
    };
  }

  /**
   * Track portfolio item view
   */
  async trackPortfolioView(itemId: string, viewerUserId?: string): Promise<void> {
    // TODO: Implement view tracking table and logic
    console.log('Portfolio view tracked:', { itemId, viewerUserId });
  }

  /**
   * Get portfolio analytics
   */
  async getPortfolioAnalytics(userId: string, days = 30): Promise<any> {
    // TODO: Implement portfolio analytics
    return {
      views: 0,
      likes: 0,
      shares: 0,
      topItems: [],
      viewsOverTime: []
    };
  }

  /**
   * Search portfolio items
   */
  async searchPortfolioItems(query: string, filters: any = {}): Promise<SelectPortfolioItem[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerms = query.trim().toLowerCase().split(/\s+/);
    
    let dbQuery = db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.isPublic, true),
          or(
            ...searchTerms.map(term => 
              or(
                sql`${portfolioItems.title} ILIKE ${'%' + term + '%'}`,
                sql`${portfolioItems.description} ILIKE ${'%' + term + '%'}`,
                sql`${portfolioItems.technologies}::text ILIKE ${'%' + term + '%'}`
              )
            )
          )
        )
      );

    // Apply filters
    if (filters.type) {
      dbQuery = dbQuery.where(
        and(
          eq(portfolioItems.isPublic, true),
          eq(portfolioItems.type, filters.type)
        )
      );
    }

    const results = await dbQuery
      .orderBy(portfolioItems.updatedAt)
      .limit(50);

    return results;
  }

  /**
   * Get related portfolio items
   */
  async getRelatedPortfolioItems(itemId: string, limit = 5): Promise<SelectPortfolioItem[]> {
    const [targetItem] = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.id, itemId))
      .limit(1);

    if (!targetItem) {
      return [];
    }

    // Find items with similar technologies or same type
    const relatedItems = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.isPublic, true),
          sql`${portfolioItems.id} != ${itemId}`,
          or(
            eq(portfolioItems.type, targetItem.type),
            sql`${portfolioItems.technologies} && ${JSON.stringify(targetItem.technologies)}`
          )
        )
      )
      .orderBy(portfolioItems.updatedAt)
      .limit(limit);

    return relatedItems;
  }

  /**
   * Get trending portfolio items
   */
  async getTrendingPortfolioItems(limit = 10): Promise<SelectPortfolioItem[]> {
    // TODO: Implement trending algorithm based on views, likes, recent activity
    // For now, return recent public items
    return await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.isPublic, true))
      .orderBy(desc(portfolioItems.updatedAt))
      .limit(limit);
  }

  /**
   * Import portfolio items from LinkedIn
   */
  async importFromLinkedIn(userId: string, linkedInData: any): Promise<SelectPortfolioItem[]> {
    // TODO: Implement LinkedIn import logic
    // This would parse LinkedIn profile data and create portfolio items
    throw new Error('LinkedIn import not yet implemented');
  }

  /**
   * Import portfolio items from GitHub
   */
  async importFromGitHub(userId: string, githubUsername: string): Promise<SelectPortfolioItem[]> {
    try {
      // Fetch GitHub repositories
      const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=10`, {
        headers: {
          'User-Agent': 'OpenRole-Portfolio-Importer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub repositories');
      }

      const repos = await response.json();
      const importedItems: SelectPortfolioItem[] = [];

      for (const repo of repos) {
        if (repo.private) continue; // Skip private repos

        try {
          const portfolioData: PortfolioItemCreateRequest = {
            title: repo.name,
            description: repo.description || `GitHub repository: ${repo.name}`,
            type: PortfolioType.CODE,
            externalUrl: repo.html_url,
            technologies: repo.language ? [repo.language] : [],
            projectDate: repo.created_at ? new Date(repo.created_at).toISOString().split('T')[0] : undefined,
            isPublic: true
          };

          const item = await this.createPortfolioItem(userId, portfolioData);
          importedItems.push(item);

        } catch (error) {
          console.error(`Failed to import repository ${repo.name}:`, error);
        }
      }

      return importedItems;

    } catch (error) {
      console.error('GitHub import failed:', error);
      throw new Error('Failed to import from GitHub');
    }
  }

  /**
   * Export portfolio in various formats
   */
  async exportPortfolio(userId: string, format: 'json' | 'pdf' | 'html'): Promise<string | Buffer> {
    const items = await this.getPortfolioItems(userId, userId);
    const stats = await this.getPortfolioStats(userId);

    switch (format) {
      case 'json':
        return JSON.stringify({
          exportDate: new Date(),
          userId,
          stats,
          items
        }, null, 2);
      
      case 'html':
        // TODO: Generate HTML portfolio page
        return `
          <html>
            <head><title>Portfolio Export</title></head>
            <body>
              <h1>Portfolio</h1>
              <p>Items: ${items.length}</p>
              <!-- TODO: Add portfolio items HTML -->
            </body>
          </html>
        `;
      
      case 'pdf':
        // TODO: Generate PDF using puppeteer
        throw new Error('PDF export not yet implemented');
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Validate and update URL status (internal helper)
   */
  private async validateAndUpdateUrl(itemId: string, url: string): Promise<void> {
    try {
      const validation = await this.validateExternalUrl(url);
      
      const status = validation.isValid && validation.isAccessible 
        ? PortfolioValidationStatus.VALID 
        : PortfolioValidationStatus.INVALID;

      await db
        .update(portfolioItems)
        .set({ 
          validationStatus: status,
          updatedAt: new Date()
        })
        .where(eq(portfolioItems.id, itemId));

    } catch (error) {
      console.error('URL validation failed:', error);
      
      await db
        .update(portfolioItems)
        .set({ 
          validationStatus: PortfolioValidationStatus.UNREACHABLE,
          updatedAt: new Date()
        })
        .where(eq(portfolioItems.id, itemId));
    }
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();