/**
 * Unit Tests for File Upload Service
 * 
 * Tests file upload, validation, storage, and security features
 * for CV documents, portfolio files, and profile images.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fileUploadService } from '../../src/services/file-upload-service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('crypto');

describe('FileUploadService', () => {
  const mockUserId = 'user-123';
  const mockFileId = 'file-456';

  const createMockFile = (options: {
    name?: string;
    size?: number;
    type?: string;
    content?: string;
  } = {}): File => {
    const {
      name = 'test-cv.pdf',
      size = 1024,
      type = 'application/pdf',
      content = 'mock file content'
    } = options;

    return {
      name,
      size,
      type,
      arrayBuffer: vi.fn().mockResolvedValue(Buffer.from(content)),
      slice: vi.fn().mockReturnValue({
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from(content.slice(0, 512)))
      }),
      stream: vi.fn(),
      text: vi.fn().mockResolvedValue(content)
    } as any;
  };

  const createMockMulterFile = (options: {
    originalname?: string;
    size?: number;
    mimetype?: string;
    buffer?: Buffer;
  } = {}): Express.Multer.File => {
    const {
      originalname = 'test-cv.pdf',
      size = 1024,
      mimetype = 'application/pdf',
      buffer = Buffer.from('mock file content')
    } = options;

    return {
      fieldname: 'file',
      originalname,
      encoding: '7bit',
      mimetype,
      size,
      buffer,
      stream: null as any,
      destination: '',
      filename: '',
      path: ''
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock file system operations
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('mock-file-content'));
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as any);
    
    // Mock path operations
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.extname).mockImplementation((filename) => {
      const ext = filename.split('.').pop();
      return ext ? `.${ext}` : '';
    });
    vi.mocked(path.dirname).mockReturnValue('/mock/dir');
    
    // Mock crypto
    vi.mocked(crypto.randomUUID).mockReturnValue('mock-uuid-123');
    vi.mocked(crypto.createHash).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('mock-hash')
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload valid CV file successfully', async () => {
      const mockFile = createMockMulterFile({
        originalname: 'john-doe-cv.pdf',
        mimetype: 'application/pdf',
        size: 2 * 1024 * 1024 // 2MB
      });

      const mockUploadedFile = {
        id: mockFileId,
        userId: mockUserId,
        originalName: 'john-doe-cv.pdf',
        fileName: 'cv-mock-uuid-123.pdf',
        filePath: '/uploads/cv/cv-mock-uuid-123.pdf',
        fileSize: 2097152,
        mimeType: 'application/pdf',
        fileType: 'cv',
        uploadedAt: new Date(),
        checksum: 'mock-hash'
      };

      // Mock database insert
      const dbInsertMock = vi.fn().mockResolvedValue([mockUploadedFile]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: dbInsertMock
            })
          })
        }
      }));

      const result = await fileUploadService.uploadFile(mockUserId, mockFile, 'cv');

      expect(result).toEqual(mockUploadedFile);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should reject file with invalid MIME type', async () => {
      const mockFile = createMockMulterFile({
        originalname: 'malicious.exe',
        mimetype: 'application/x-msdownload'
      });

      await expect(
        fileUploadService.uploadFile(mockUserId, mockFile, 'cv')
      ).rejects.toThrow('File type not allowed');
    });

    it('should reject oversized files', async () => {
      const mockFile = createMockMulterFile({
        originalname: 'huge-cv.pdf',
        mimetype: 'application/pdf',
        size: 50 * 1024 * 1024 // 50MB (exceeds CV limit)
      });

      await expect(
        fileUploadService.uploadFile(mockUserId, mockFile, 'cv')
      ).rejects.toThrow('File size exceeds maximum allowed');
    });

    it('should handle different file types correctly', async () => {
      // Test portfolio image
      const imageFile = createMockMulterFile({
        originalname: 'portfolio-image.jpg',
        mimetype: 'image/jpeg',
        size: 3 * 1024 * 1024 // 3MB
      });

      const result = await fileUploadService.uploadFile(mockUserId, imageFile, 'portfolio');
      expect(result.fileType).toBe('portfolio');

      // Test avatar
      const avatarFile = createMockMulterFile({
        originalname: 'avatar.png',
        mimetype: 'image/png',
        size: 1 * 1024 * 1024 // 1MB
      });

      const avatarResult = await fileUploadService.uploadFile(mockUserId, avatarFile, 'avatar');
      expect(avatarResult.fileType).toBe('avatar');
    });

    it('should generate unique filenames', async () => {
      const mockFile = createMockMulterFile({
        originalname: 'cv.pdf'
      });

      // Mock multiple UUID generations
      vi.mocked(crypto.randomUUID)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      const result1 = await fileUploadService.uploadFile(mockUserId, mockFile, 'cv');
      const result2 = await fileUploadService.uploadFile(mockUserId, mockFile, 'cv');

      expect(result1.fileName).toContain('uuid-1');
      expect(result2.fileName).toContain('uuid-2');
      expect(result1.fileName).not.toBe(result2.fileName);
    });

    it('should validate file content signatures', async () => {
      // Mock PDF file with correct signature
      const pdfFile = createMockMulterFile({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.concat([
          Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
          Buffer.from('rest of pdf content')
        ])
      });

      const result = await fileUploadService.uploadFile(mockUserId, pdfFile, 'cv');
      expect(result).toBeDefined();

      // Mock PDF file with incorrect signature
      const fakePdfFile = createMockMulterFile({
        originalname: 'fake.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('This is not a PDF file')
      });

      await expect(
        fileUploadService.uploadFile(mockUserId, fakePdfFile, 'cv')
      ).rejects.toThrow('File appears to be corrupted');
    });
  });

  describe('getFile', () => {
    it('should retrieve file by ID for owner', async () => {
      const mockFile = {
        id: mockFileId,
        userId: mockUserId,
        originalName: 'cv.pdf',
        fileName: 'cv-uuid.pdf',
        filePath: '/uploads/cv/cv-uuid.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      };

      // Mock database query
      const dbSelectMock = vi.fn().mockResolvedValue([mockFile]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          })
        }
      }));

      const result = await fileUploadService.getFile(mockFileId, mockUserId);

      expect(result).toEqual(mockFile);
    });

    it('should deny access to files of other users', async () => {
      const mockFile = {
        id: mockFileId,
        userId: 'other-user-456',
        originalName: 'cv.pdf'
      };

      const dbSelectMock = vi.fn().mockResolvedValue([mockFile]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          })
        }
      }));

      await expect(
        fileUploadService.getFile(mockFileId, mockUserId)
      ).rejects.toThrow('Access denied');
    });

    it('should return null for non-existent files', async () => {
      const dbSelectMock = vi.fn().mockResolvedValue([]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          })
        }
      }));

      const result = await fileUploadService.getFile('non-existent', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and remove from filesystem', async () => {
      const mockFile = {
        id: mockFileId,
        userId: mockUserId,
        filePath: '/uploads/cv/cv-uuid.pdf'
      };

      // Mock database operations
      const dbSelectMock = vi.fn().mockResolvedValue([mockFile]);
      const dbDeleteMock = vi.fn().mockResolvedValue([mockFile]);
      
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: dbDeleteMock
            })
          })
        }
      }));

      const result = await fileUploadService.deleteFile(mockFileId, mockUserId);

      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalledWith('/uploads/cv/cv-uuid.pdf');
    });

    it('should handle file system errors gracefully', async () => {
      const mockFile = {
        id: mockFileId,
        userId: mockUserId,
        filePath: '/uploads/cv/cv-uuid.pdf'
      };

      const dbSelectMock = vi.fn().mockResolvedValue([mockFile]);
      const dbDeleteMock = vi.fn().mockResolvedValue([mockFile]);
      
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: dbDeleteMock
            })
          })
        }
      }));

      // Mock filesystem error
      vi.mocked(fs.unlink).mockRejectedValue(new Error('File not found'));

      const result = await fileUploadService.deleteFile(mockFileId, mockUserId);

      // Should still succeed if database record is deleted
      expect(result).toBe(true);
    });
  });

  describe('listUserFiles', () => {
    it('should list files for user by type', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          userId: mockUserId,
          originalName: 'cv-1.pdf',
          fileType: 'cv',
          uploadedAt: new Date('2025-09-01')
        },
        {
          id: 'file-2', 
          userId: mockUserId,
          originalName: 'cv-2.pdf',
          fileType: 'cv',
          uploadedAt: new Date('2025-09-15')
        }
      ];

      const dbSelectMock = vi.fn().mockResolvedValue(mockFiles);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: dbSelectMock
                  })
                })
              })
            })
          })
        }
      }));

      const result = await fileUploadService.listUserFiles(mockUserId, 'cv');

      expect(result).toHaveLength(2);
      expect(result[0].fileType).toBe('cv');
      expect(result[1].fileType).toBe('cv');
    });

    it('should support pagination', async () => {
      const mockFiles = Array.from({ length: 5 }, (_, i) => ({
        id: `file-${i}`,
        userId: mockUserId,
        originalName: `file-${i}.pdf`,
        fileType: 'cv'
      }));

      const dbSelectMock = vi.fn().mockResolvedValue(mockFiles.slice(0, 3));
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: dbSelectMock
                  })
                })
              })
            })
          })
        }
      }));

      const result = await fileUploadService.listUserFiles(mockUserId, 'cv', {
        limit: 3,
        offset: 0
      });

      expect(result).toHaveLength(3);
    });

    it('should filter by file type', async () => {
      const allFiles = [
        { id: 'cv-1', fileType: 'cv', originalName: 'cv.pdf' },
        { id: 'img-1', fileType: 'portfolio', originalName: 'image.jpg' },
        { id: 'cv-2', fileType: 'cv', originalName: 'cv2.pdf' }
      ];

      const dbSelectMock = vi.fn().mockResolvedValue(
        allFiles.filter(f => f.fileType === 'cv')
      );
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: dbSelectMock
                  })
                })
              })
            })
          })
        }
      }));

      const result = await fileUploadService.listUserFiles(mockUserId, 'cv');

      expect(result).toHaveLength(2);
      expect(result.every(f => f.fileType === 'cv')).toBe(true);
    });
  });

  describe('downloadFile', () => {
    it('should provide download stream for authorized user', async () => {
      const mockFile = {
        id: mockFileId,
        userId: mockUserId,
        filePath: '/uploads/cv/cv-uuid.pdf',
        originalName: 'john-doe-cv.pdf',
        mimeType: 'application/pdf'
      };

      const dbSelectMock = vi.fn().mockResolvedValue([mockFile]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          })
        }
      }));

      const result = await fileUploadService.downloadFile(mockFileId, mockUserId);

      expect(result).toEqual({
        filePath: '/uploads/cv/cv-uuid.pdf',
        fileName: 'john-doe-cv.pdf',
        mimeType: 'application/pdf'
      });
    });

    it('should track download analytics', async () => {
      const mockFile = {
        id: mockFileId,
        userId: mockUserId,
        filePath: '/uploads/cv/cv-uuid.pdf'
      };

      const dbSelectMock = vi.fn().mockResolvedValue([mockFile]);
      const analyticsInsertMock = vi.fn().mockResolvedValue([]);
      
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: dbSelectMock
              })
            })
          }),
          insert: vi.fn().mockReturnValue({
            values: analyticsInsertMock
          })
        }
      }));

      await fileUploadService.downloadFile(mockFileId, mockUserId);

      // Verify analytics were recorded
      expect(analyticsInsertMock).toHaveBeenCalled();
    });
  });

  describe('security validation', () => {
    it('should detect and block malicious file extensions', async () => {
      const maliciousFiles = [
        { name: 'virus.exe', type: 'application/x-msdownload' },
        { name: 'script.bat', type: 'application/bat' },
        { name: 'malware.scr', type: 'application/x-msdownload' },
        { name: 'trojan.vbs', type: 'text/vbscript' }
      ];

      for (const malicious of maliciousFiles) {
        const mockFile = createMockMulterFile({
          originalname: malicious.name,
          mimetype: malicious.type
        });

        await expect(
          fileUploadService.uploadFile(mockUserId, mockFile, 'cv')
        ).rejects.toThrow('File type not allowed');
      }
    });

    it('should prevent path traversal attacks', async () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\windows\\system32\\config',
        'normal.pdf/../../../secrets.txt',
        'file\0hidden.exe'
      ];

      for (const maliciousName of maliciousNames) {
        const mockFile = createMockMulterFile({
          originalname: maliciousName,
          mimetype: 'application/pdf'
        });

        await expect(
          fileUploadService.uploadFile(mockUserId, mockFile, 'cv')
        ).rejects.toThrow(/Invalid filename|path traversal/i);
      }
    });

    it('should validate file size limits by type', async () => {
      // CV files - 10MB limit
      const largeCvFile = createMockMulterFile({
        originalname: 'large-cv.pdf',
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024 // 15MB
      });

      await expect(
        fileUploadService.uploadFile(mockUserId, largeCvFile, 'cv')
      ).rejects.toThrow('File size exceeds maximum');

      // Avatar files - 5MB limit  
      const largeAvatarFile = createMockMulterFile({
        originalname: 'large-avatar.jpg',
        mimetype: 'image/jpeg',
        size: 8 * 1024 * 1024 // 8MB
      });

      await expect(
        fileUploadService.uploadFile(mockUserId, largeAvatarFile, 'avatar')
      ).rejects.toThrow('File size exceeds maximum');
    });

    it('should generate secure checksums', async () => {
      const mockFile = createMockMulterFile({
        originalname: 'test.pdf',
        buffer: Buffer.from('test content')
      });

      const result = await fileUploadService.uploadFile(mockUserId, mockFile, 'cv');

      expect(result.checksum).toBe('mock-hash');
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('error handling', () => {
    it('should handle disk space errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('ENOSPC: no space left on device'));

      const mockFile = createMockMulterFile();

      await expect(
        fileUploadService.uploadFile(mockUserId, mockFile, 'cv')
      ).rejects.toThrow('Storage space unavailable');
    });

    it('should clean up on upload failure', async () => {
      const cleanupSpy = vi.spyOn(fileUploadService, 'cleanupFailedUpload');
      
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));

      const mockFile = createMockMulterFile();

      try {
        await fileUploadService.uploadFile(mockUserId, mockFile, 'cv');
      } catch (error) {
        // Expected to throw
      }

      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should handle corrupted files gracefully', async () => {
      const corruptedFile = createMockMulterFile({
        originalname: 'corrupted.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('Not a real PDF file')
      });

      await expect(
        fileUploadService.uploadFile(mockUserId, corruptedFile, 'cv')
      ).rejects.toThrow('File appears to be corrupted');
    });
  });

  describe('performance', () => {
    it('should handle large file uploads efficiently', async () => {
      const largeFile = createMockMulterFile({
        originalname: 'large-presentation.pdf',
        mimetype: 'application/pdf',
        size: 8 * 1024 * 1024, // 8MB
        buffer: Buffer.alloc(8 * 1024 * 1024, 'x')
      });

      const startTime = Date.now();
      
      const result = await fileUploadService.uploadFile(mockUserId, largeFile, 'portfolio');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000);
    });

    it('should handle concurrent uploads', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        createMockMulterFile({
          originalname: `file-${i}.pdf`,
          size: 1024 * (i + 1)
        })
      );

      const uploadPromises = files.map(file => 
        fileUploadService.uploadFile(mockUserId, file, 'cv')
      );

      const results = await Promise.all(uploadPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.originalName).toBe(`file-${i}.pdf`);
      });
    });
  });
});