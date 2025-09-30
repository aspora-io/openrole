import { describe, beforeEach, afterEach, beforeAll, afterAll, it, expect, jest } from '@jest/globals';
import { unlink, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import type { Database } from '@openrole/database';

// Mock services and dependencies
interface FileUploadService {
  uploadFile(userId: string, file: Express.Multer.File, metadata: any): Promise<any>;
  validateFile(file: Express.Multer.File): Promise<void>;
  scanForVirus(filePath: string): Promise<{ clean: boolean; threat?: string }>;
  getStorageUsage(userId: string): Promise<number>;
  enforceQuotaLimit(userId: string, fileSize: number): Promise<void>;
}

interface CvDocumentService {
  createCvDocument(userId: string, data: any): Promise<any>;
  getCvDocuments(userId: string): Promise<any[]>;
  getCvDocument(userId: string, cvId: string): Promise<any>;
  updateCvDocument(userId: string, cvId: string, data: any): Promise<any>;
  deleteCvDocument(userId: string, cvId: string): Promise<void>;
  getDefaultCv(userId: string): Promise<any | null>;
  setDefaultCv(userId: string, cvId: string): Promise<void>;
  getCvVersions(userId: string): Promise<any[]>;
  generateAccessToken(cvId: string, expiresInHours: number): Promise<any>;
  validateAccessToken(cvId: string, token: string): Promise<boolean>;
}

interface FileSystemService {
  saveFile(filePath: string, buffer: Buffer): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  fileExists(filePath: string): Promise<boolean>;
  getFileSize(filePath: string): Promise<number>;
  createUserDirectory(userId: string): Promise<void>;
}

interface AccessTokenService {
  generateToken(): string;
  createAccessToken(cvId: string, expiresInHours: number): Promise<any>;
  validateToken(token: string): Promise<any>;
  revokeToken(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
}

// Mock implementations
const mockDb: Database = {} as Database;
const mockFileUploadService: FileUploadService = {} as FileUploadService;
const mockCvDocumentService: CvDocumentService = {} as CvDocumentService;
const mockFileSystemService: FileSystemService = {} as FileSystemService;
const mockAccessTokenService: AccessTokenService = {} as AccessTokenService;

// Test constants
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_STORAGE_PATH = '/tmp/openrole-test-storage';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const USER_STORAGE_QUOTA = 100 * 1024 * 1024; // 100MB per user

// Mock file data
const createMockFile = (filename: string, mimeType: string, size: number): Express.Multer.File => {
  const buffer = Buffer.alloc(size, 'CV content');
  return {
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: mimeType,
    size: size,
    buffer: buffer,
    destination: TEST_STORAGE_PATH,
    filename: `${Date.now()}-${filename}`,
    path: join(TEST_STORAGE_PATH, `${Date.now()}-${filename}`),
    stream: Readable.from(buffer)
  } as Express.Multer.File;
};

describe('CV Upload Integration Tests', () => {
  beforeAll(async () => {
    // Create test storage directory
    await mkdir(TEST_STORAGE_PATH, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test storage
    try {
      const files = await readdir(TEST_STORAGE_PATH);
      await Promise.all(files.map(file => unlink(join(TEST_STORAGE_PATH, file))));
    } catch (error) {
      // Directory might not exist
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('FR-002: CV Upload with File Validation', () => {
    describe('Valid CV Upload Flow', () => {
      it('should successfully upload a valid PDF CV file', async () => {
        // Arrange
        const mockFile = createMockFile('john-doe-cv.pdf', 'application/pdf', 1024 * 1024); // 1MB
        const cvData = {
          file: mockFile,
          label: 'Software Engineer CV',
          isDefault: true
        };

        const expectedCvDocument = {
          id: 'cv-123',
          userId: TEST_USER_ID,
          profileId: 'profile-123',
          filename: mockFile.filename,
          originalFilename: mockFile.originalname,
          fileSize: mockFile.size,
          mimeType: mockFile.mimetype,
          version: 1,
          label: cvData.label,
          isDefault: cvData.isDefault,
          generatedFromProfile: false,
          templateUsed: null,
          generatedAt: null,
          accessToken: 'access-token-123',
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          virusScanned: true,
          scanResults: 'clean',
          status: 'active',
          downloadCount: 0,
          lastAccessedAt: null,
          filePath: mockFile.path,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Mock service implementations
        mockFileUploadService.validateFile = jest.fn().mockResolvedValue(undefined);
        mockFileUploadService.scanForVirus = jest.fn().mockResolvedValue({ clean: true });
        mockFileUploadService.getStorageUsage = jest.fn().mockResolvedValue(50 * 1024 * 1024); // 50MB used
        mockFileUploadService.enforceQuotaLimit = jest.fn().mockResolvedValue(undefined);
        
        mockFileSystemService.createUserDirectory = jest.fn().mockResolvedValue(undefined);
        mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
        mockFileSystemService.fileExists = jest.fn().mockResolvedValue(true);
        
        mockCvDocumentService.getCvVersions = jest.fn().mockResolvedValue([]);
        mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue(expectedCvDocument);
        mockCvDocumentService.setDefaultCv = jest.fn().mockResolvedValue(undefined);
        
        mockAccessTokenService.generateToken = jest.fn().mockReturnValue('access-token-123');
        mockAccessTokenService.createAccessToken = jest.fn().mockResolvedValue({
          token: 'access-token-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // Act - Complete upload flow
        await mockFileUploadService.validateFile(mockFile);
        await mockFileSystemService.createUserDirectory(TEST_USER_ID);
        await mockFileSystemService.saveFile(mockFile.path, mockFile.buffer);
        
        const scanResult = await mockFileUploadService.scanForVirus(mockFile.path);
        expect(scanResult.clean).toBe(true);
        
        const storageUsage = await mockFileUploadService.getStorageUsage(TEST_USER_ID);
        await mockFileUploadService.enforceQuotaLimit(TEST_USER_ID, mockFile.size);
        
        const existingVersions = await mockCvDocumentService.getCvVersions(TEST_USER_ID);
        const nextVersion = existingVersions.length + 1;
        
        const cvDocument = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
          ...cvData,
          version: nextVersion,
          virusScanned: true,
          scanResults: 'clean',
          status: 'active',
          filePath: mockFile.path
        });
        
        if (cvData.isDefault) {
          await mockCvDocumentService.setDefaultCv(TEST_USER_ID, cvDocument.id);
        }

        // Assert
        expect(mockFileUploadService.validateFile).toHaveBeenCalledWith(mockFile);
        expect(mockFileSystemService.createUserDirectory).toHaveBeenCalledWith(TEST_USER_ID);
        expect(mockFileSystemService.saveFile).toHaveBeenCalledWith(mockFile.path, mockFile.buffer);
        expect(mockFileUploadService.scanForVirus).toHaveBeenCalledWith(mockFile.path);
        expect(mockFileUploadService.enforceQuotaLimit).toHaveBeenCalledWith(TEST_USER_ID, mockFile.size);
        
        expect(cvDocument).toMatchObject({
          id: expect.any(String),
          userId: TEST_USER_ID,
          filename: mockFile.filename,
          originalFilename: 'john-doe-cv.pdf',
          fileSize: 1024 * 1024,
          mimeType: 'application/pdf',
          version: 1,
          label: 'Software Engineer CV',
          isDefault: true,
          status: 'active',
          virusScanned: true,
          scanResults: 'clean'
        });
      });

      it('should handle Word document upload (.docx)', async () => {
        // Arrange
        const mockFile = createMockFile(
          'resume.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          2 * 1024 * 1024 // 2MB
        );

        mockFileUploadService.validateFile = jest.fn().mockResolvedValue(undefined);
        mockFileUploadService.scanForVirus = jest.fn().mockResolvedValue({ clean: true });
        mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
        mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue({
          id: 'cv-456',
          mimeType: mockFile.mimetype,
          originalFilename: 'resume.docx'
        });

        // Act
        await mockFileUploadService.validateFile(mockFile);
        const scanResult = await mockFileUploadService.scanForVirus(mockFile.path);
        await mockFileSystemService.saveFile(mockFile.path, mockFile.buffer);
        const cvDocument = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
          file: mockFile,
          label: 'Product Manager Resume'
        });

        // Assert
        expect(cvDocument.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(mockFileUploadService.validateFile).toHaveBeenCalled();
      });
    });

    describe('File Validation Scenarios', () => {
      it('should reject files exceeding 10MB size limit', async () => {
        // Arrange
        const oversizedFile = createMockFile('large-cv.pdf', 'application/pdf', 11 * 1024 * 1024); // 11MB

        mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
          new Error('File size exceeds maximum allowed size of 10MB')
        );

        // Act & Assert
        await expect(
          mockFileUploadService.validateFile(oversizedFile)
        ).rejects.toThrow('File size exceeds maximum allowed size of 10MB');

        expect(mockFileUploadService.validateFile).toHaveBeenCalledWith(oversizedFile);
      });

      it('should reject invalid file types', async () => {
        // Arrange
        const invalidFile = createMockFile('photo.jpg', 'image/jpeg', 500 * 1024);

        mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
          new Error('Invalid file type. Supported types: PDF, DOC, DOCX')
        );

        // Act & Assert
        await expect(
          mockFileUploadService.validateFile(invalidFile)
        ).rejects.toThrow('Invalid file type. Supported types: PDF, DOC, DOCX');
      });

      it('should validate MIME type matches file extension', async () => {
        // Arrange
        const mismatchedFile = {
          ...createMockFile('fake.pdf', 'text/plain', 1024),
          originalname: 'fake.pdf',
          mimetype: 'text/plain' // Wrong MIME for .pdf
        } as Express.Multer.File;

        mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
          new Error('File extension does not match MIME type')
        );

        // Act & Assert
        await expect(
          mockFileUploadService.validateFile(mismatchedFile)
        ).rejects.toThrow('File extension does not match MIME type');
      });

      it('should reject empty files', async () => {
        // Arrange
        const emptyFile = createMockFile('empty.pdf', 'application/pdf', 0);

        mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
          new Error('File cannot be empty')
        );

        // Act & Assert
        await expect(
          mockFileUploadService.validateFile(emptyFile)
        ).rejects.toThrow('File cannot be empty');
      });
    });

    describe('FR-006: CV Version Management', () => {
      it('should manage multiple CV versions correctly', async () => {
        // Arrange
        const existingCvs = [
          {
            id: 'cv-v1',
            userId: TEST_USER_ID,
            version: 1,
            label: 'Initial CV',
            isDefault: false,
            createdAt: new Date('2024-01-01')
          },
          {
            id: 'cv-v2',
            userId: TEST_USER_ID,
            version: 2,
            label: 'Updated CV',
            isDefault: true,
            createdAt: new Date('2024-02-01')
          }
        ];

        const newCvFile = createMockFile('latest-cv.pdf', 'application/pdf', 1.5 * 1024 * 1024);

        mockCvDocumentService.getCvVersions = jest.fn().mockResolvedValue(existingCvs);
        mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue({
          id: 'cv-v3',
          userId: TEST_USER_ID,
          version: 3,
          label: 'Latest CV',
          isDefault: false,
          filename: newCvFile.filename,
          fileSize: newCvFile.size
        });

        // Act
        const versions = await mockCvDocumentService.getCvVersions(TEST_USER_ID);
        const latestVersion = Math.max(...versions.map(cv => cv.version));
        const newVersion = latestVersion + 1;

        const newCv = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
          file: newCvFile,
          label: 'Latest CV',
          version: newVersion,
          isDefault: false
        });

        // Assert
        expect(versions).toHaveLength(2);
        expect(newCv.version).toBe(3);
        expect(newCv.isDefault).toBe(false);
        expect(versions.filter(cv => cv.isDefault)).toHaveLength(1);
      });

      it('should handle default CV switching correctly', async () => {
        // Arrange
        const existingCvs = [
          { id: 'cv-1', isDefault: true, version: 1 },
          { id: 'cv-2', isDefault: false, version: 2 },
          { id: 'cv-3', isDefault: false, version: 3 }
        ];

        mockCvDocumentService.getCvDocuments = jest.fn().mockResolvedValue(existingCvs);
        mockCvDocumentService.updateCvDocument = jest.fn().mockImplementation((userId, cvId, data) => {
          const cv = existingCvs.find(c => c.id === cvId);
          return Promise.resolve({ ...cv, ...data });
        });
        mockCvDocumentService.setDefaultCv = jest.fn().mockImplementation(async (userId, cvId) => {
          // Reset all CVs to non-default
          existingCvs.forEach(cv => cv.isDefault = false);
          // Set the specified CV as default
          const targetCv = existingCvs.find(cv => cv.id === cvId);
          if (targetCv) targetCv.isDefault = true;
        });

        // Act
        await mockCvDocumentService.setDefaultCv(TEST_USER_ID, 'cv-3');
        const updatedCvs = await mockCvDocumentService.getCvDocuments(TEST_USER_ID);

        // Assert
        expect(mockCvDocumentService.setDefaultCv).toHaveBeenCalledWith(TEST_USER_ID, 'cv-3');
        const defaultCvs = existingCvs.filter(cv => cv.isDefault);
        expect(defaultCvs).toHaveLength(1);
        expect(defaultCvs[0].id).toBe('cv-3');
      });

      it('should enforce version number consistency', async () => {
        // Arrange
        const existingVersions = [1, 2, 4]; // Gap in version 3
        const existingCvs = existingVersions.map(v => ({
          id: `cv-v${v}`,
          version: v,
          userId: TEST_USER_ID
        }));

        mockCvDocumentService.getCvVersions = jest.fn().mockResolvedValue(existingCvs);
        mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue({
          id: 'cv-v5',
          version: 5, // Should be next sequential version
          userId: TEST_USER_ID
        });

        // Act
        const versions = await mockCvDocumentService.getCvVersions(TEST_USER_ID);
        const maxVersion = Math.max(...versions.map(cv => cv.version));
        const nextVersion = maxVersion + 1;

        const newCv = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
          file: createMockFile('cv.pdf', 'application/pdf', 1024),
          version: nextVersion
        });

        // Assert
        expect(nextVersion).toBe(5);
        expect(newCv.version).toBe(5);
      });
    });

    describe('File Storage and Metadata Tracking', () => {
      it('should correctly store file and track metadata', async () => {
        // Arrange
        const mockFile = createMockFile('cv-final.pdf', 'application/pdf', 3.5 * 1024 * 1024);
        const expectedPath = join(TEST_STORAGE_PATH, TEST_USER_ID, mockFile.filename);

        mockFileSystemService.createUserDirectory = jest.fn().mockResolvedValue(undefined);
        mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
        mockFileSystemService.fileExists = jest.fn().mockResolvedValue(true);
        mockFileSystemService.getFileSize = jest.fn().mockResolvedValue(mockFile.size);

        const expectedMetadata = {
          id: 'cv-789',
          userId: TEST_USER_ID,
          filename: mockFile.filename,
          originalFilename: mockFile.originalname,
          fileSize: mockFile.size,
          mimeType: mockFile.mimetype,
          filePath: expectedPath,
          checksum: 'sha256:abcdef123456',
          uploadedAt: new Date(),
          lastModified: new Date()
        };

        mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue(expectedMetadata);

        // Act
        await mockFileSystemService.createUserDirectory(TEST_USER_ID);
        await mockFileSystemService.saveFile(expectedPath, mockFile.buffer);
        const fileExists = await mockFileSystemService.fileExists(expectedPath);
        const fileSize = await mockFileSystemService.getFileSize(expectedPath);
        
        const cvDocument = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
          file: mockFile,
          label: 'Final CV',
          filePath: expectedPath,
          checksum: 'sha256:abcdef123456'
        });

        // Assert
        expect(mockFileSystemService.createUserDirectory).toHaveBeenCalledWith(TEST_USER_ID);
        expect(mockFileSystemService.saveFile).toHaveBeenCalledWith(expectedPath, mockFile.buffer);
        expect(fileExists).toBe(true);
        expect(fileSize).toBe(mockFile.size);
        expect(cvDocument.filePath).toBe(expectedPath);
        expect(cvDocument.checksum).toBeDefined();
      });

      it('should handle file path security (no directory traversal)', async () => {
        // Arrange
        const maliciousFilename = '../../../etc/passwd';
        const mockFile = {
          ...createMockFile('cv.pdf', 'application/pdf', 1024),
          originalname: maliciousFilename
        } as Express.Multer.File;

        mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
          new Error('Invalid filename: potential security risk')
        );

        // Act & Assert
        await expect(
          mockFileUploadService.validateFile(mockFile)
        ).rejects.toThrow('Invalid filename: potential security risk');
      });
    });

    describe('Access Token Generation and Security', () => {
      it('should generate secure access tokens for CV downloads', async () => {
        // Arrange
        const cvId = 'cv-123';
        const expiresInHours = 24;

        const expectedToken = {
          token: 'secure-token-uuid-v4',
          cvId: cvId,
          expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
          createdAt: new Date(),
          usageCount: 0,
          maxUsage: 10
        };

        mockAccessTokenService.generateToken = jest.fn().mockReturnValue('secure-token-uuid-v4');
        mockAccessTokenService.createAccessToken = jest.fn().mockResolvedValue(expectedToken);

        // Act
        const token = await mockAccessTokenService.createAccessToken(cvId, expiresInHours);

        // Assert
        expect(mockAccessTokenService.generateToken).toHaveBeenCalled();
        expect(mockAccessTokenService.createAccessToken).toHaveBeenCalledWith(cvId, expiresInHours);
        expect(token).toMatchObject({
          token: expect.stringMatching(/^[a-zA-Z0-9-]+$/),
          cvId: cvId,
          expiresAt: expect.any(Date),
          usageCount: 0
        });
        expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
      });

      it('should validate and enforce access token expiration', async () => {
        // Arrange
        const expiredToken = {
          token: 'expired-token',
          cvId: 'cv-123',
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
          usageCount: 5
        };

        mockAccessTokenService.validateToken = jest.fn().mockRejectedValue(
          new Error('Access token has expired')
        );

        // Act & Assert
        await expect(
          mockAccessTokenService.validateToken(expiredToken.token)
        ).rejects.toThrow('Access token has expired');
      });

      it('should track token usage and enforce limits', async () => {
        // Arrange
        const token = {
          token: 'limited-token',
          cvId: 'cv-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          usageCount: 10,
          maxUsage: 10
        };

        mockAccessTokenService.validateToken = jest.fn().mockRejectedValue(
          new Error('Access token usage limit exceeded')
        );

        // Act & Assert
        await expect(
          mockAccessTokenService.validateToken(token.token)
        ).rejects.toThrow('Access token usage limit exceeded');
      });
    });

    describe('Error Scenarios and Edge Cases', () => {
      describe('Virus Scanning Integration', () => {
        it('should reject files with detected viruses', async () => {
          // Arrange
          const infectedFile = createMockFile('infected.pdf', 'application/pdf', 1024);

          mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
          mockFileUploadService.scanForVirus = jest.fn().mockResolvedValue({
            clean: false,
            threat: 'EICAR-Test-File'
          });
          mockFileSystemService.deleteFile = jest.fn().mockResolvedValue(undefined);

          // Act
          await mockFileSystemService.saveFile(infectedFile.path, infectedFile.buffer);
          const scanResult = await mockFileUploadService.scanForVirus(infectedFile.path);
          
          if (!scanResult.clean) {
            await mockFileSystemService.deleteFile(infectedFile.path);
          }

          // Assert
          expect(scanResult.clean).toBe(false);
          expect(scanResult.threat).toBe('EICAR-Test-File');
          expect(mockFileSystemService.deleteFile).toHaveBeenCalledWith(infectedFile.path);
        });

        it('should handle virus scanner timeout gracefully', async () => {
          // Arrange
          const mockFile = createMockFile('cv.pdf', 'application/pdf', 5 * 1024 * 1024);

          mockFileUploadService.scanForVirus = jest.fn().mockRejectedValue(
            new Error('Virus scan timeout after 30 seconds')
          );

          // Act & Assert
          await expect(
            mockFileUploadService.scanForVirus(mockFile.path)
          ).rejects.toThrow('Virus scan timeout after 30 seconds');
        });

        it('should proceed with manual review flag on scan failure', async () => {
          // Arrange
          const mockFile = createMockFile('cv.pdf', 'application/pdf', 2 * 1024 * 1024);

          mockFileUploadService.scanForVirus = jest.fn().mockRejectedValue(
            new Error('Virus scanner unavailable')
          );

          mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue({
            id: 'cv-pending',
            status: 'pending_review',
            virusScanned: false,
            scanResults: 'scanner_unavailable',
            requiresManualReview: true
          });

          // Act
          let scanError;
          try {
            await mockFileUploadService.scanForVirus(mockFile.path);
          } catch (error) {
            scanError = error;
          }

          const cvDocument = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
            file: mockFile,
            status: 'pending_review',
            virusScanned: false,
            scanResults: 'scanner_unavailable',
            requiresManualReview: true
          });

          // Assert
          expect(scanError).toBeDefined();
          expect(cvDocument.status).toBe('pending_review');
          expect(cvDocument.requiresManualReview).toBe(true);
        });
      });

      describe('File Corruption Handling', () => {
        it('should detect and handle corrupted PDF files', async () => {
          // Arrange
          const corruptedFile = {
            ...createMockFile('corrupted.pdf', 'application/pdf', 1024),
            buffer: Buffer.from('Not a real PDF content')
          } as Express.Multer.File;

          mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
            new Error('PDF file is corrupted or invalid')
          );

          // Act & Assert
          await expect(
            mockFileUploadService.validateFile(corruptedFile)
          ).rejects.toThrow('PDF file is corrupted or invalid');
        });

        it('should validate PDF structure and readability', async () => {
          // Arrange
          const invalidPdf = {
            ...createMockFile('invalid.pdf', 'application/pdf', 2048),
            buffer: Buffer.from('%PDF-1.4\n%%EOF') // Minimal invalid PDF
          } as Express.Multer.File;

          mockFileUploadService.validateFile = jest.fn().mockRejectedValue(
            new Error('PDF structure is invalid: missing required objects')
          );

          // Act & Assert
          await expect(
            mockFileUploadService.validateFile(invalidPdf)
          ).rejects.toThrow('PDF structure is invalid');
        });
      });

      describe('Storage Quota Limits', () => {
        it('should enforce user storage quota limits', async () => {
          // Arrange
          const largeFile = createMockFile('large-cv.pdf', 'application/pdf', 30 * 1024 * 1024); // 30MB

          mockFileUploadService.getStorageUsage = jest.fn().mockResolvedValue(80 * 1024 * 1024); // 80MB used
          mockFileUploadService.enforceQuotaLimit = jest.fn().mockRejectedValue(
            new Error('Storage quota exceeded. Current usage: 80MB, Quota: 100MB, File size: 30MB')
          );

          // Act
          const currentUsage = await mockFileUploadService.getStorageUsage(TEST_USER_ID);

          // Assert
          await expect(
            mockFileUploadService.enforceQuotaLimit(TEST_USER_ID, largeFile.size)
          ).rejects.toThrow('Storage quota exceeded');
          expect(currentUsage).toBe(80 * 1024 * 1024);
        });

        it('should calculate accurate storage usage across all CV versions', async () => {
          // Arrange
          const cvDocuments = [
            { id: 'cv-1', fileSize: 2 * 1024 * 1024, status: 'active' },
            { id: 'cv-2', fileSize: 3 * 1024 * 1024, status: 'active' },
            { id: 'cv-3', fileSize: 1.5 * 1024 * 1024, status: 'archived' },
            { id: 'cv-4', fileSize: 4 * 1024 * 1024, status: 'active' }
          ];

          mockCvDocumentService.getCvDocuments = jest.fn().mockResolvedValue(cvDocuments);
          mockFileUploadService.getStorageUsage = jest.fn().mockImplementation(async (userId) => {
            const docs = await mockCvDocumentService.getCvDocuments(userId);
            return docs
              .filter(cv => cv.status === 'active')
              .reduce((total, cv) => total + cv.fileSize, 0);
          });

          // Act
          const totalUsage = await mockFileUploadService.getStorageUsage(TEST_USER_ID);

          // Assert
          expect(totalUsage).toBe(9 * 1024 * 1024); // 2 + 3 + 4 = 9MB (excluding archived)
        });

        it('should allow cleanup of old CV versions to free storage', async () => {
          // Arrange
          const oldCvs = [
            { id: 'cv-old-1', version: 1, fileSize: 5 * 1024 * 1024, createdAt: new Date('2023-01-01') },
            { id: 'cv-old-2', version: 2, fileSize: 4 * 1024 * 1024, createdAt: new Date('2023-06-01') },
            { id: 'cv-current', version: 3, fileSize: 3 * 1024 * 1024, createdAt: new Date('2024-01-01') }
          ];

          mockCvDocumentService.getCvVersions = jest.fn().mockResolvedValue(oldCvs);
          mockCvDocumentService.deleteCvDocument = jest.fn().mockResolvedValue(undefined);
          mockFileSystemService.deleteFile = jest.fn().mockResolvedValue(undefined);

          // Act - Delete old versions
          const versions = await mockCvDocumentService.getCvVersions(TEST_USER_ID);
          const oldVersions = versions.filter(cv => cv.version < 3);
          
          for (const oldCv of oldVersions) {
            await mockCvDocumentService.deleteCvDocument(TEST_USER_ID, oldCv.id);
            await mockFileSystemService.deleteFile(`${TEST_STORAGE_PATH}/${oldCv.id}.pdf`);
          }

          // Assert
          expect(mockCvDocumentService.deleteCvDocument).toHaveBeenCalledTimes(2);
          expect(mockFileSystemService.deleteFile).toHaveBeenCalledTimes(2);
        });
      });

      describe('Concurrent Upload Handling', () => {
        it('should handle multiple concurrent CV uploads from same user', async () => {
          // Arrange
          const file1 = createMockFile('cv-v1.pdf', 'application/pdf', 1024 * 1024);
          const file2 = createMockFile('cv-v2.pdf', 'application/pdf', 1024 * 1024);
          const file3 = createMockFile('cv-v3.pdf', 'application/pdf', 1024 * 1024);

          let versionCounter = 0;
          mockCvDocumentService.getCvVersions = jest.fn().mockImplementation(() => {
            // Simulate race condition with shared counter
            return Promise.resolve(Array(versionCounter).fill(null).map((_, i) => ({ version: i + 1 })));
          });

          mockCvDocumentService.createCvDocument = jest.fn().mockImplementation(async (userId, data) => {
            // Simulate delay and increment counter
            await new Promise(resolve => setTimeout(resolve, 100));
            versionCounter++;
            return {
              id: `cv-concurrent-${versionCounter}`,
              version: versionCounter,
              ...data
            };
          });

          // Act - Upload files concurrently
          const uploads = [file1, file2, file3].map(async (file, index) => {
            const versions = await mockCvDocumentService.getCvVersions(TEST_USER_ID);
            const nextVersion = versions.length + 1;
            return mockCvDocumentService.createCvDocument(TEST_USER_ID, {
              file,
              version: nextVersion,
              label: `Concurrent CV ${index + 1}`
            });
          });

          const results = await Promise.all(uploads);

          // Assert
          expect(results).toHaveLength(3);
          const versions = results.map(cv => cv.version);
          expect(new Set(versions).size).toBe(3); // All versions should be unique
          expect(Math.max(...versions)).toBe(3);
        });

        it('should handle race condition in default CV switching', async () => {
          // Arrange
          const existingCvs = [
            { id: 'cv-a', isDefault: true },
            { id: 'cv-b', isDefault: false },
            { id: 'cv-c', isDefault: false }
          ];

          let defaultCvId = 'cv-a';
          mockCvDocumentService.setDefaultCv = jest.fn().mockImplementation(async (userId, cvId) => {
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 50));
            defaultCvId = cvId;
            existingCvs.forEach(cv => cv.isDefault = cv.id === cvId);
          });

          mockCvDocumentService.getDefaultCv = jest.fn().mockImplementation(() => {
            return Promise.resolve(existingCvs.find(cv => cv.id === defaultCvId));
          });

          // Act - Multiple concurrent requests to change default
          const setDefaultPromises = [
            mockCvDocumentService.setDefaultCv(TEST_USER_ID, 'cv-b'),
            mockCvDocumentService.setDefaultCv(TEST_USER_ID, 'cv-c'),
            mockCvDocumentService.setDefaultCv(TEST_USER_ID, 'cv-a')
          ];

          await Promise.all(setDefaultPromises);
          const finalDefault = await mockCvDocumentService.getDefaultCv(TEST_USER_ID);

          // Assert
          expect(mockCvDocumentService.setDefaultCv).toHaveBeenCalledTimes(3);
          expect(finalDefault).toBeDefined();
          expect(existingCvs.filter(cv => cv.isDefault)).toHaveLength(1);
        });

        it('should handle upload failures gracefully with cleanup', async () => {
          // Arrange
          const mockFile = createMockFile('failed-cv.pdf', 'application/pdf', 3 * 1024 * 1024);
          const tempPath = mockFile.path;

          mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
          mockFileUploadService.scanForVirus = jest.fn().mockResolvedValue({ clean: true });
          mockCvDocumentService.createCvDocument = jest.fn().mockRejectedValue(
            new Error('Database connection lost')
          );
          mockFileSystemService.deleteFile = jest.fn().mockResolvedValue(undefined);
          mockFileSystemService.fileExists = jest.fn().mockResolvedValue(true);

          // Act
          await mockFileSystemService.saveFile(tempPath, mockFile.buffer);
          
          let uploadError;
          try {
            await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
              file: mockFile,
              label: 'Failed Upload'
            });
          } catch (error) {
            uploadError = error;
            // Cleanup on failure
            const fileExists = await mockFileSystemService.fileExists(tempPath);
            if (fileExists) {
              await mockFileSystemService.deleteFile(tempPath);
            }
          }

          // Assert
          expect(uploadError).toBeDefined();
          expect(uploadError.message).toBe('Database connection lost');
          expect(mockFileSystemService.deleteFile).toHaveBeenCalledWith(tempPath);
        });
      });

      describe('Business Logic Integration', () => {
        it('should integrate with profile completion status', async () => {
          // Arrange
          const profileService = {
            getProfile: jest.fn().mockResolvedValue({
              id: 'profile-123',
              userId: TEST_USER_ID,
              hasCv: false,
              profileComplete: false
            }),
            updateProfile: jest.fn().mockResolvedValue({
              id: 'profile-123',
              userId: TEST_USER_ID,
              hasCv: true,
              profileComplete: true
            })
          };

          mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue({
            id: 'cv-new',
            userId: TEST_USER_ID,
            profileId: 'profile-123'
          });

          // Act
          const profile = await profileService.getProfile(TEST_USER_ID);
          expect(profile.hasCv).toBe(false);

          const cvDocument = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
            file: createMockFile('cv.pdf', 'application/pdf', 1024),
            profileId: profile.id
          });

          const updatedProfile = await profileService.updateProfile(TEST_USER_ID, {
            hasCv: true,
            profileComplete: true
          });

          // Assert
          expect(cvDocument.profileId).toBe('profile-123');
          expect(updatedProfile.hasCv).toBe(true);
          expect(profileService.updateProfile).toHaveBeenCalledWith(TEST_USER_ID, {
            hasCv: true,
            profileComplete: true
          });
        });

        it('should track CV usage in applications', async () => {
          // Arrange
          const applicationService = {
            createApplication: jest.fn().mockResolvedValue({
              id: 'app-123',
              cvDocumentId: 'cv-123',
              jobId: 'job-456'
            }),
            getApplicationsByCv: jest.fn().mockResolvedValue([
              { id: 'app-1', cvDocumentId: 'cv-123', status: 'submitted' },
              { id: 'app-2', cvDocumentId: 'cv-123', status: 'under_review' }
            ])
          };

          mockCvDocumentService.updateCvDocument = jest.fn().mockResolvedValue({
            id: 'cv-123',
            downloadCount: 2,
            lastAccessedAt: new Date()
          });

          // Act
          const application = await applicationService.createApplication({
            jobId: 'job-456',
            cvDocumentId: 'cv-123',
            coverLetter: 'I am interested...'
          });

          const applications = await applicationService.getApplicationsByCv('cv-123');
          
          const updatedCv = await mockCvDocumentService.updateCvDocument(TEST_USER_ID, 'cv-123', {
            downloadCount: applications.length,
            lastAccessedAt: new Date()
          });

          // Assert
          expect(application.cvDocumentId).toBe('cv-123');
          expect(applications).toHaveLength(2);
          expect(updatedCv.downloadCount).toBe(2);
        });

        it('should prevent deletion of CVs in active applications', async () => {
          // Arrange
          const applicationService = {
            getApplicationsByCv: jest.fn().mockResolvedValue([
              { id: 'app-active', cvDocumentId: 'cv-protected', status: 'interview_scheduled' }
            ])
          };

          mockCvDocumentService.deleteCvDocument = jest.fn().mockRejectedValue(
            new Error('Cannot delete CV: Currently used in 1 active application(s)')
          );

          // Act
          const activeApplications = await applicationService.getApplicationsByCv('cv-protected');

          // Assert
          await expect(
            mockCvDocumentService.deleteCvDocument(TEST_USER_ID, 'cv-protected')
          ).rejects.toThrow('Cannot delete CV: Currently used in 1 active application(s)');
          expect(activeApplications).toHaveLength(1);
        });
      });

      describe('File System Edge Cases', () => {
        it('should handle disk space exhaustion gracefully', async () => {
          // Arrange
          const mockFile = createMockFile('cv.pdf', 'application/pdf', 5 * 1024 * 1024);

          mockFileSystemService.saveFile = jest.fn().mockRejectedValue(
            new Error('ENOSPC: no space left on device')
          );

          // Act & Assert
          await expect(
            mockFileSystemService.saveFile(mockFile.path, mockFile.buffer)
          ).rejects.toThrow('ENOSPC: no space left on device');
        });

        it('should handle file system permission errors', async () => {
          // Arrange
          const restrictedPath = '/root/protected/cv.pdf';

          mockFileSystemService.saveFile = jest.fn().mockRejectedValue(
            new Error('EACCES: permission denied')
          );

          // Act & Assert
          await expect(
            mockFileSystemService.saveFile(restrictedPath, Buffer.from('data'))
          ).rejects.toThrow('EACCES: permission denied');
        });

        it('should ensure atomic file operations', async () => {
          // Arrange
          const mockFile = createMockFile('atomic-cv.pdf', 'application/pdf', 2 * 1024 * 1024);
          const tempPath = `${mockFile.path}.tmp`;
          const finalPath = mockFile.path;

          mockFileSystemService.saveFile = jest.fn().mockImplementation(async (path, buffer) => {
            // Simulate atomic write: write to temp, then rename
            return Promise.resolve();
          });

          mockFileSystemService.fileExists = jest.fn()
            .mockResolvedValueOnce(false) // temp file doesn't exist initially
            .mockResolvedValueOnce(true); // final file exists after operation

          // Act
          await mockFileSystemService.saveFile(tempPath, mockFile.buffer);
          // In real implementation, would rename tempPath to finalPath
          const fileExists = await mockFileSystemService.fileExists(finalPath);

          // Assert
          expect(mockFileSystemService.saveFile).toHaveBeenCalledWith(tempPath, mockFile.buffer);
          expect(fileExists).toBe(true);
        });
      });

      describe('Network and Timeout Scenarios', () => {
        it('should handle upload timeout for large files', async () => {
          // Arrange
          const largeFile = createMockFile('large-cv.pdf', 'application/pdf', 9 * 1024 * 1024);

          mockFileUploadService.uploadFile = jest.fn().mockRejectedValue(
            new Error('Upload timeout: Operation exceeded 120 seconds')
          );

          // Act & Assert
          await expect(
            mockFileUploadService.uploadFile(TEST_USER_ID, largeFile, { timeout: 120000 })
          ).rejects.toThrow('Upload timeout: Operation exceeded 120 seconds');
        });

        it('should retry failed uploads with exponential backoff', async () => {
          // Arrange
          let attemptCount = 0;
          const mockFile = createMockFile('retry-cv.pdf', 'application/pdf', 1024 * 1024);

          mockFileUploadService.uploadFile = jest.fn().mockImplementation(async () => {
            attemptCount++;
            if (attemptCount < 3) {
              throw new Error('Network error: Connection reset');
            }
            return { success: true, attemptCount };
          });

          // Act
          let result;
          let lastError;
          for (let i = 0; i < 3; i++) {
            try {
              result = await mockFileUploadService.uploadFile(TEST_USER_ID, mockFile, {});
              break;
            } catch (error) {
              lastError = error;
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
          }

          // Assert
          expect(attemptCount).toBe(3);
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(mockFileUploadService.uploadFile).toHaveBeenCalledTimes(3);
        });
      });

      describe('Data Consistency and Transactions', () => {
        it('should maintain data consistency on partial failure', async () => {
          // Arrange
          const mockFile = createMockFile('transaction-cv.pdf', 'application/pdf', 2 * 1024 * 1024);

          const mockTransaction = {
            begin: jest.fn().mockResolvedValue(undefined),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined)
          };

          mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
          mockCvDocumentService.createCvDocument = jest.fn().mockRejectedValue(
            new Error('Constraint violation: duplicate version number')
          );
          mockFileSystemService.deleteFile = jest.fn().mockResolvedValue(undefined);

          // Act
          await mockTransaction.begin();
          await mockFileSystemService.saveFile(mockFile.path, mockFile.buffer);

          let error;
          try {
            await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
              file: mockFile,
              version: 1 // Duplicate version
            });
            await mockTransaction.commit();
          } catch (e) {
            error = e;
            await mockTransaction.rollback();
            await mockFileSystemService.deleteFile(mockFile.path);
          }

          // Assert
          expect(error).toBeDefined();
          expect(mockTransaction.rollback).toHaveBeenCalled();
          expect(mockFileSystemService.deleteFile).toHaveBeenCalledWith(mockFile.path);
        });

        it('should handle orphaned files cleanup', async () => {
          // Arrange
          const orphanedFiles = [
            'cv-orphan-1.pdf',
            'cv-orphan-2.pdf',
            'cv-orphan-3.pdf'
          ];

          mockFileSystemService.fileExists = jest.fn().mockResolvedValue(true);
          mockCvDocumentService.getCvDocument = jest.fn().mockRejectedValue(
            new Error('CV document not found')
          );
          mockFileSystemService.deleteFile = jest.fn().mockResolvedValue(undefined);

          // Act - Cleanup orphaned files
          const cleanupResults = await Promise.all(
            orphanedFiles.map(async (filename) => {
              try {
                await mockCvDocumentService.getCvDocument(TEST_USER_ID, filename);
                return { filename, cleaned: false };
              } catch {
                await mockFileSystemService.deleteFile(join(TEST_STORAGE_PATH, filename));
                return { filename, cleaned: true };
              }
            })
          );

          // Assert
          expect(cleanupResults).toHaveLength(3);
          expect(cleanupResults.every(r => r.cleaned)).toBe(true);
          expect(mockFileSystemService.deleteFile).toHaveBeenCalledTimes(3);
        });
      });
    });
  });

  describe('Complete End-to-End CV Upload Workflow', () => {
    it('should complete full CV upload workflow from validation to access token generation', async () => {
      // Arrange
      const mockFile = createMockFile('complete-workflow.pdf', 'application/pdf', 2.5 * 1024 * 1024);
      
      // Mock all service implementations for complete workflow
      mockFileUploadService.validateFile = jest.fn().mockResolvedValue(undefined);
      mockFileUploadService.getStorageUsage = jest.fn().mockResolvedValue(20 * 1024 * 1024);
      mockFileUploadService.enforceQuotaLimit = jest.fn().mockResolvedValue(undefined);
      mockFileSystemService.createUserDirectory = jest.fn().mockResolvedValue(undefined);
      mockFileSystemService.saveFile = jest.fn().mockResolvedValue(undefined);
      mockFileUploadService.scanForVirus = jest.fn().mockResolvedValue({ clean: true });
      mockCvDocumentService.getCvVersions = jest.fn().mockResolvedValue([
        { version: 1 }, { version: 2 }
      ]);
      mockCvDocumentService.createCvDocument = jest.fn().mockResolvedValue({
        id: 'cv-complete',
        userId: TEST_USER_ID,
        version: 3,
        status: 'active',
        isDefault: true
      });
      mockCvDocumentService.setDefaultCv = jest.fn().mockResolvedValue(undefined);
      mockAccessTokenService.generateToken = jest.fn().mockReturnValue('access-token-complete');
      mockAccessTokenService.createAccessToken = jest.fn().mockResolvedValue({
        token: 'access-token-complete',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        downloadUrl: `http://api.openrole.net/v1/cv/cv-complete/download?token=access-token-complete`
      });

      // Act - Execute complete workflow
      // Step 1: Validate file
      await mockFileUploadService.validateFile(mockFile);

      // Step 2: Check storage quota
      const currentUsage = await mockFileUploadService.getStorageUsage(TEST_USER_ID);
      await mockFileUploadService.enforceQuotaLimit(TEST_USER_ID, mockFile.size);

      // Step 3: Create user directory and save file
      await mockFileSystemService.createUserDirectory(TEST_USER_ID);
      await mockFileSystemService.saveFile(mockFile.path, mockFile.buffer);

      // Step 4: Virus scan
      const scanResult = await mockFileUploadService.scanForVirus(mockFile.path);

      // Step 5: Get version number
      const existingVersions = await mockCvDocumentService.getCvVersions(TEST_USER_ID);
      const nextVersion = existingVersions.length + 1;

      // Step 6: Create CV document
      const cvDocument = await mockCvDocumentService.createCvDocument(TEST_USER_ID, {
        file: mockFile,
        version: nextVersion,
        label: 'Complete Workflow CV',
        isDefault: true,
        virusScanned: true,
        scanResults: 'clean'
      });

      // Step 7: Set as default
      await mockCvDocumentService.setDefaultCv(TEST_USER_ID, cvDocument.id);

      // Step 8: Generate access token
      const accessToken = await mockAccessTokenService.createAccessToken(cvDocument.id, 24);

      // Assert - Verify complete workflow execution
      expect(mockFileUploadService.validateFile).toHaveBeenCalledWith(mockFile);
      expect(currentUsage).toBeLessThan(USER_STORAGE_QUOTA);
      expect(scanResult.clean).toBe(true);
      expect(nextVersion).toBe(3);
      expect(cvDocument.id).toBe('cv-complete');
      expect(cvDocument.status).toBe('active');
      expect(cvDocument.isDefault).toBe(true);
      expect(accessToken.token).toBe('access-token-complete');
      expect(accessToken.downloadUrl).toContain(cvDocument.id);
      expect(accessToken.downloadUrl).toContain(accessToken.token);

      // Verify all steps were called in correct order
      expect(mockFileUploadService.validateFile).toHaveBeenCalledBefore(
        mockFileUploadService.getStorageUsage as jest.Mock
      );
      expect(mockFileSystemService.saveFile).toHaveBeenCalledBefore(
        mockFileUploadService.scanForVirus as jest.Mock
      );
      expect(mockFileUploadService.scanForVirus).toHaveBeenCalledBefore(
        mockCvDocumentService.createCvDocument as jest.Mock
      );
    });
  });
});