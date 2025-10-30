/**
 * FileUploadService - Secure file upload and management
 * 
 * Handles CV uploads, portfolio files, profile images with comprehensive
 * validation, security scanning, and storage management.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { eq, and } from 'drizzle-orm';
import { db, cvDocuments, portfolioItems } from '../lib/database';

// Type definitions - TODO: Add proper types from database schema
type InsertCVDocument = any;
type InsertPortfolioItem = any;

enum CVStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export interface FileUploadResult {
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  isValid: boolean;
  validationErrors?: string[];
  checksum: string;
}

export interface CVUploadResult extends FileUploadResult {
  cvId: string;
  isDefault: boolean;
  status: CVStatus;
  documentId?: string; // For tracking in database
}

export interface PortfolioUploadResult extends FileUploadResult {
  portfolioId: string;
  portfolioType: string;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  performVirusScan?: boolean;
  extractMetadata?: boolean;
  generateThumbnail?: boolean;
}

export interface StorageQuota {
  used: number; // bytes
  limit: number; // bytes
  fileCount: number;
  remaining: number; // bytes
  percentUsed: number;
}

export interface IFileUploadService {
  // CV file operations
  uploadCV(
    userId: string, 
    file: Express.Multer.File, 
    label: string, 
    isDefault?: boolean
  ): Promise<CVUploadResult>;
  
  downloadCV(cvId: string, userId: string): Promise<{ filePath: string; fileName: string }>;
  deleteCV(cvId: string, userId: string): Promise<boolean>;
  replaceCV(cvId: string, userId: string, file: Express.Multer.File): Promise<CVUploadResult>;
  
  // Portfolio file operations
  uploadPortfolioFile(
    userId: string,
    file: Express.Multer.File,
    portfolioId: string,
    portfolioType: string
  ): Promise<PortfolioUploadResult>;
  
  downloadPortfolioFile(
    portfolioId: string, 
    userId: string
  ): Promise<{ filePath: string; fileName: string }>;
  
  deletePortfolioFile(portfolioId: string, userId: string): Promise<boolean>;
  
  // Profile image operations
  uploadProfileImage(userId: string, file: Express.Multer.File): Promise<FileUploadResult>;
  deleteProfileImage(userId: string): Promise<boolean>;
  
  // File validation and security
  validateFile(file: Express.Multer.File, options?: FileValidationOptions): Promise<{
    isValid: boolean;
    errors: string[];
    metadata?: any;
  }>;
  
  scanForViruses(filePath: string): Promise<{ isClean: boolean; threats?: string[] }>;
  extractFileMetadata(filePath: string): Promise<any>;
  generateChecksum(filePath: string): Promise<string>;
  
  // Storage management
  getStorageQuota(userId: string): Promise<StorageQuota>;
  cleanupExpiredFiles(): Promise<number>; // Returns number of files cleaned
  optimizeStorage(userId: string): Promise<{ savedBytes: number; filesOptimized: number }>;
  
  // Utility functions
  getFileInfo(fileId: string, userId: string): Promise<FileUploadResult | null>;
  listUserFiles(userId: string, fileType?: 'cv' | 'portfolio' | 'image'): Promise<FileUploadResult[]>;
  generateSecureFileName(originalName: string): string;
  ensureUploadDirectory(userId: string, fileType: string): Promise<string>;
}

export class FileUploadService implements IFileUploadService {
  private readonly uploadBasePath: string;
  private readonly maxCVSize = 10 * 1024 * 1024; // 10MB
  private readonly maxPortfolioSize = 20 * 1024 * 1024; // 20MB
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB
  private readonly storageQuotaPerUser = 100 * 1024 * 1024; // 100MB per user

  constructor() {
    this.uploadBasePath = process.env.UPLOAD_PATH || './uploads';
    this.ensureBaseDirectory();
  }

  /**
   * Upload CV file with validation and database storage
   */
  async uploadCV(
    userId: string,
    file: Express.Multer.File,
    label: string,
    isDefault = false
  ): Promise<CVUploadResult> {
    // TODO: Add proper Zod file validation
    // Simple validation for now
    if (!file || !file.originalname) {
      throw new Error('Invalid CV file');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('CV file too large (max 10MB)');
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only PDF and Word documents are allowed.');
    }

    // Check storage quota
    const quota = await this.getStorageQuota(userId);
    if (quota.remaining < file.size) {
      throw new Error('Storage quota exceeded. Please delete some files or upgrade your account.');
    }

    // Validate label
    if (!label || typeof label !== 'string' || label.length === 0) {
      throw new Error('CV label is required');
    }

    // Create secure file path
    const uploadDir = await this.ensureUploadDirectory(userId, 'cv');
    const secureFileName = this.generateSecureFileName(file.originalname);
    const filePath = path.join(uploadDir, secureFileName);

    try {
      // Write file to disk
      await writeFile(filePath, file.buffer);

      // Generate checksum
      const checksum = await this.generateChecksum(filePath);

      // Perform additional validation
      const advancedValidation = await this.validateFile(file, {
        maxSizeBytes: this.maxCVSize,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        performVirusScan: true,
        extractMetadata: true
      });

      if (!advancedValidation.isValid) {
        // Clean up file
        await unlink(filePath);
        throw new Error(`Advanced validation failed: ${advancedValidation.errors.join(', ')}`);
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db
          .update(cvDocuments)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(cvDocuments.userId, userId));
      }

      // Save to database
      const cvData: InsertCVDocument = {
        userId,
        fileName: file.originalname,
        filePath: secureFileName, // Store relative path for security
        fileSize: file.size,
        mimeType: file.mimetype,
        label: labelValidation.data,
        isDefault,
        status: CVStatus.PROCESSING,
        checksum,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [cvRecord] = await db
        .insert(cvDocuments)
        .values(cvData)
        .returning();

      // Update status to active after successful processing
      await db
        .update(cvDocuments)
        .set({ 
          status: CVStatus.ACTIVE,
          updatedAt: new Date()
        })
        .where(eq(cvDocuments.id, cvRecord.id));

      return {
        fileId: cvRecord.id,
        cvId: cvRecord.id,
        fileName: file.originalname,
        filePath: secureFileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: cvRecord.uploadedAt,
        isValid: true,
        checksum,
        isDefault,
        status: CVStatus.ACTIVE,
        documentId: cvRecord.id
      };

    } catch (error) {
      // Clean up file if database operation fails
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after error:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Download CV file for user
   */
  async downloadCV(cvId: string, userId: string): Promise<{ filePath: string; fileName: string }> {
    const [cv] = await db
      .select()
      .from(cvDocuments)
      .where(
        and(
          eq(cvDocuments.id, cvId),
          eq(cvDocuments.userId, userId)
        )
      )
      .limit(1);

    if (!cv) {
      throw new Error('CV not found or access denied');
    }

    const fullPath = path.join(this.uploadBasePath, userId, 'cv', cv.filePath);
    
    // Check if file exists
    try {
      await stat(fullPath);
    } catch (error) {
      throw new Error('CV file not found on disk');
    }

    return {
      filePath: fullPath,
      fileName: cv.fileName
    };
  }

  /**
   * Delete CV file and database record
   */
  async deleteCV(cvId: string, userId: string): Promise<boolean> {
    const [cv] = await db
      .select()
      .from(cvDocuments)
      .where(
        and(
          eq(cvDocuments.id, cvId),
          eq(cvDocuments.userId, userId)
        )
      )
      .limit(1);

    if (!cv) {
      return false;
    }

    try {
      // Delete file from disk
      const fullPath = path.join(this.uploadBasePath, userId, 'cv', cv.filePath);
      await unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db
      .delete(cvDocuments)
      .where(eq(cvDocuments.id, cvId));

    return true;
  }

  /**
   * Replace existing CV file
   */
  async replaceCV(cvId: string, userId: string, file: Express.Multer.File): Promise<CVUploadResult> {
    const [existingCV] = await db
      .select()
      .from(cvDocuments)
      .where(
        and(
          eq(cvDocuments.id, cvId),
          eq(cvDocuments.userId, userId)
        )
      )
      .limit(1);

    if (!existingCV) {
      throw new Error('CV not found or access denied');
    }

    // Delete old file
    try {
      const oldPath = path.join(this.uploadBasePath, userId, 'cv', existingCV.filePath);
      await unlink(oldPath);
    } catch (error) {
      console.error('Failed to delete old file:', error);
    }

    // Upload new file with same label and default status
    const uploadResult = await this.uploadCV(userId, file, existingCV.label, existingCV.isDefault);

    // Delete old database record
    await db
      .delete(cvDocuments)
      .where(eq(cvDocuments.id, cvId));

    return uploadResult;
  }

  /**
   * Upload portfolio file
   */
  async uploadPortfolioFile(
    userId: string,
    file: Express.Multer.File,
    portfolioId: string,
    portfolioType: string
  ): Promise<PortfolioUploadResult> {
    // TODO: Add proper Zod file validation
    // Simple validation for now
    if (!file || !file.originalname) {
      throw new Error('Invalid portfolio file');
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error('Portfolio file too large (max 20MB)');
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/webm'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type for portfolio');
    }

    // Check storage quota
    const quota = await this.getStorageQuota(userId);
    if (quota.remaining < file.size) {
      throw new Error('Storage quota exceeded');
    }

    // Create secure file path
    const uploadDir = await this.ensureUploadDirectory(userId, 'portfolio');
    const secureFileName = this.generateSecureFileName(file.originalname);
    const filePath = path.join(uploadDir, secureFileName);

    try {
      // Write file to disk
      await writeFile(filePath, file.buffer);

      // Generate checksum
      const checksum = await this.generateChecksum(filePath);

      // Update portfolio item with file info
      await db
        .update(portfolioItems)
        .set({
          fileName: file.originalname,
          filePath: secureFileName,
          fileSize: file.size,
          mimeType: file.mimetype,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(portfolioItems.id, portfolioId),
            eq(portfolioItems.userId, userId)
          )
        );

      return {
        fileId: portfolioId,
        portfolioId,
        portfolioType,
        fileName: file.originalname,
        filePath: secureFileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        isValid: true,
        checksum
      };

    } catch (error) {
      // Clean up file if operation fails
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after error:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Download portfolio file
   */
  async downloadPortfolioFile(
    portfolioId: string, 
    userId: string
  ): Promise<{ filePath: string; fileName: string }> {
    const [portfolio] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, portfolioId),
          eq(portfolioItems.userId, userId)
        )
      )
      .limit(1);

    if (!portfolio || !portfolio.filePath) {
      throw new Error('Portfolio file not found or access denied');
    }

    const fullPath = path.join(this.uploadBasePath, userId, 'portfolio', portfolio.filePath);
    
    // Check if file exists
    try {
      await stat(fullPath);
    } catch (error) {
      throw new Error('Portfolio file not found on disk');
    }

    return {
      filePath: fullPath,
      fileName: portfolio.fileName || 'portfolio-file'
    };
  }

  /**
   * Delete portfolio file
   */
  async deletePortfolioFile(portfolioId: string, userId: string): Promise<boolean> {
    const [portfolio] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, portfolioId),
          eq(portfolioItems.userId, userId)
        )
      )
      .limit(1);

    if (!portfolio || !portfolio.filePath) {
      return false;
    }

    try {
      // Delete file from disk
      const fullPath = path.join(this.uploadBasePath, userId, 'portfolio', portfolio.filePath);
      await unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete portfolio file from disk:', error);
    }

    // Clear file info from database
    await db
      .update(portfolioItems)
      .set({
        fileName: null,
        filePath: null,
        fileSize: null,
        mimeType: null,
        updatedAt: new Date()
      })
      .where(eq(portfolioItems.id, portfolioId));

    return true;
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(userId: string, file: Express.Multer.File): Promise<FileUploadResult> {
    // Validate image file
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      throw new Error('Invalid image type. Only JPEG, PNG, and WebP are allowed.');
    }

    if (file.size > this.maxImageSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    // Create secure file path
    const uploadDir = await this.ensureUploadDirectory(userId, 'images');
    const secureFileName = this.generateSecureFileName(file.originalname);
    const filePath = path.join(uploadDir, secureFileName);

    try {
      // Write file to disk
      await writeFile(filePath, file.buffer);

      // Generate checksum
      const checksum = await this.generateChecksum(filePath);

      // TODO: Update user profile with image info
      // This would require adding an image field to the candidate profile

      return {
        fileId: `img_${userId}_${Date.now()}`,
        fileName: file.originalname,
        filePath: secureFileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        isValid: true,
        checksum
      };

    } catch (error) {
      // Clean up file if operation fails
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after error:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Delete profile image
   */
  async deleteProfileImage(userId: string): Promise<boolean> {
    // TODO: Implement profile image deletion
    // This would require getting the image path from user profile
    return true;
  }

  /**
   * Comprehensive file validation
   */
  async validateFile(file: Express.Multer.File, options: FileValidationOptions = {}): Promise<{
    isValid: boolean;
    errors: string[];
    metadata?: any;
  }> {
    const errors: string[] = [];
    let metadata: any = {};

    // Size validation
    const maxSize = options.maxSizeBytes || this.maxCVSize;
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    // MIME type validation
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Extension validation
    if (options.allowedExtensions) {
      const extension = path.extname(file.originalname).toLowerCase();
      if (!options.allowedExtensions.includes(extension)) {
        errors.push(`File extension ${extension} is not allowed`);
      }
    }

    // File name validation
    if (file.originalname.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }

    // Check for suspicious file names
    const suspiciousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i];
    if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
      errors.push('Suspicious file type detected');
    }

    // Virus scanning (if enabled)
    if (options.performVirusScan && file.buffer) {
      // TODO: Implement virus scanning
      // For now, just check for common malicious signatures
      const maliciousSignatures = [
        Buffer.from('MZ'), // PE executable header
        Buffer.from('\x7fELF'), // ELF executable header
      ];

      for (const signature of maliciousSignatures) {
        if (file.buffer.indexOf(signature) === 0) {
          errors.push('Potentially malicious file detected');
          break;
        }
      }
    }

    // Extract metadata (if enabled)
    if (options.extractMetadata) {
      metadata = {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadDate: new Date(),
        // TODO: Add more detailed metadata extraction
      };
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata: options.extractMetadata ? metadata : undefined
    };
  }

  /**
   * Virus scanning (placeholder implementation)
   */
  async scanForViruses(filePath: string): Promise<{ isClean: boolean; threats?: string[] }> {
    // TODO: Implement actual virus scanning using ClamAV or similar
    // For now, return clean
    return { isClean: true };
  }

  /**
   * Extract file metadata
   */
  async extractFileMetadata(filePath: string): Promise<any> {
    try {
      const stats = await stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        // TODO: Add more metadata extraction (EXIF for images, PDF metadata, etc.)
      };
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      return {};
    }
  }

  /**
   * Generate file checksum
   */
  async generateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Get storage quota for user
   */
  async getStorageQuota(userId: string): Promise<StorageQuota> {
    // Calculate used storage from database
    const cvFiles = await db
      .select({ fileSize: cvDocuments.fileSize })
      .from(cvDocuments)
      .where(eq(cvDocuments.userId, userId));

    const portfolioFiles = await db
      .select({ fileSize: portfolioItems.fileSize })
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.userId, userId),
          sql`${portfolioItems.fileSize} IS NOT NULL`
        )
      );

    const usedBytes = [
      ...cvFiles.map(f => f.fileSize || 0),
      ...portfolioFiles.map(f => f.fileSize || 0)
    ].reduce((sum, size) => sum + size, 0);

    const fileCount = cvFiles.length + portfolioFiles.length;
    const remaining = Math.max(0, this.storageQuotaPerUser - usedBytes);
    const percentUsed = (usedBytes / this.storageQuotaPerUser) * 100;

    return {
      used: usedBytes,
      limit: this.storageQuotaPerUser,
      fileCount,
      remaining,
      percentUsed: Math.round(percentUsed * 100) / 100
    };
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    // TODO: Implement file cleanup logic
    // This would remove files that are older than a certain age or marked for deletion
    return 0;
  }

  /**
   * Optimize storage for user
   */
  async optimizeStorage(userId: string): Promise<{ savedBytes: number; filesOptimized: number }> {
    // TODO: Implement storage optimization (compression, duplicate removal, etc.)
    return { savedBytes: 0, filesOptimized: 0 };
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string, userId: string): Promise<FileUploadResult | null> {
    // Try CV files first
    const [cv] = await db
      .select()
      .from(cvDocuments)
      .where(
        and(
          eq(cvDocuments.id, fileId),
          eq(cvDocuments.userId, userId)
        )
      )
      .limit(1);

    if (cv) {
      return {
        fileId: cv.id,
        fileName: cv.fileName,
        filePath: cv.filePath,
        fileSize: cv.fileSize,
        mimeType: cv.mimeType,
        uploadedAt: cv.uploadedAt,
        isValid: cv.status === CVStatus.ACTIVE,
        checksum: cv.checksum
      };
    }

    // Try portfolio files
    const [portfolio] = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, fileId),
          eq(portfolioItems.userId, userId),
          sql`${portfolioItems.filePath} IS NOT NULL`
        )
      )
      .limit(1);

    if (portfolio && portfolio.filePath) {
      return {
        fileId: portfolio.id,
        fileName: portfolio.fileName || 'portfolio-file',
        filePath: portfolio.filePath,
        fileSize: portfolio.fileSize || 0,
        mimeType: portfolio.mimeType || 'application/octet-stream',
        uploadedAt: portfolio.updatedAt,
        isValid: true,
        checksum: ''
      };
    }

    return null;
  }

  /**
   * List all files for user
   */
  async listUserFiles(userId: string, fileType?: 'cv' | 'portfolio' | 'image'): Promise<FileUploadResult[]> {
    const files: FileUploadResult[] = [];

    if (!fileType || fileType === 'cv') {
      const cvFiles = await db
        .select()
        .from(cvDocuments)
        .where(eq(cvDocuments.userId, userId));

      files.push(...cvFiles.map(cv => ({
        fileId: cv.id,
        fileName: cv.fileName,
        filePath: cv.filePath,
        fileSize: cv.fileSize,
        mimeType: cv.mimeType,
        uploadedAt: cv.uploadedAt,
        isValid: cv.status === CVStatus.ACTIVE,
        checksum: cv.checksum
      })));
    }

    if (!fileType || fileType === 'portfolio') {
      const portfolioFiles = await db
        .select()
        .from(portfolioItems)
        .where(
          and(
            eq(portfolioItems.userId, userId),
            sql`${portfolioItems.filePath} IS NOT NULL`
          )
        );

      files.push(...portfolioFiles.map(portfolio => ({
        fileId: portfolio.id,
        fileName: portfolio.fileName || 'portfolio-file',
        filePath: portfolio.filePath || '',
        fileSize: portfolio.fileSize || 0,
        mimeType: portfolio.mimeType || 'application/octet-stream',
        uploadedAt: portfolio.updatedAt,
        isValid: true,
        checksum: ''
      })));
    }

    return files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  /**
   * Generate secure file name
   */
  generateSecureFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    // Sanitize the base name
    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .substring(0, 50); // Limit length

    return `${timestamp}_${random}_${sanitizedBaseName}${extension}`;
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDirectory(userId: string, fileType: string): Promise<string> {
    const userDir = path.join(this.uploadBasePath, userId);
    const typeDir = path.join(userDir, fileType);

    try {
      await mkdir(userDir, { recursive: true });
      await mkdir(typeDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create upload directory: ${error.message}`);
    }

    return typeDir;
  }

  /**
   * Ensure base upload directory exists
   */
  private async ensureBaseDirectory(): Promise<void> {
    try {
      await mkdir(this.uploadBasePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create base upload directory:', error);
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();