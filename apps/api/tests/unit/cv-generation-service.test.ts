/**
 * Unit Tests for CV Generation Service
 * 
 * Tests CV generation, template management, PDF creation,
 * and document processing functionality.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cvGenerationService } from '../../src/services/cv-generation-service';
import { profileService } from '../../src/services/profile-service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
vi.mock('../../src/services/profile-service');
vi.mock('fs/promises');
vi.mock('path');
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('mock-png-content')),
        content: vi.fn().mockResolvedValue('<html>mock html</html>')
      }),
      close: vi.fn()
    })
  }
}));

describe('CVGenerationService', () => {
  const mockUserId = 'user-123';
  const mockCvId = 'cv-456';

  const mockProfileData = {
    id: 'profile-123',
    userId: mockUserId,
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    location: 'Dublin, Ireland',
    title: 'Senior Software Engineer',
    summary: 'Experienced full-stack developer with 5+ years in React and Node.js',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    workExperience: [
      {
        id: 'exp-1',
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        startDate: '2022-01-01',
        endDate: null,
        current: true,
        description: 'Lead development of React applications'
      }
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'Trinity College Dublin',
        degree: 'Computer Science',
        fieldOfStudy: 'Software Engineering',
        startDate: '2015-09-01',
        endDate: '2019-06-01',
        grade: 'First Class Honours'
      }
    ]
  };

  const mockGenerationOptions = {
    templateId: 'modern',
    label: 'Software Engineer CV',
    isDefault: false,
    sections: {
      includePersonalDetails: true,
      includeWorkExperience: true,
      includeEducation: true,
      includeSkills: true,
      includePortfolio: false
    },
    customizations: {
      primaryColor: '#2563eb',
      fontSize: 'medium' as const,
      fontFamily: 'helvetica' as const,
      spacing: 'normal' as const
    },
    format: 'pdf' as const,
    quality: 'standard' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock file system operations
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('mock-file-content'));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(path.dirname).mockReturnValue('/mock/dir');
    
    // Mock profile service
    vi.mocked(profileService.getProfile).mockResolvedValue(mockProfileData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCV', () => {
    it('should generate CV with valid profile data and options', async () => {
      const mockGeneratedCV = {
        id: mockCvId,
        userId: mockUserId,
        templateId: 'modern',
        label: 'Software Engineer CV',
        filePath: '/generated/cv-456.pdf',
        fileName: 'john-doe-cv.pdf',
        format: 'pdf',
        generatedAt: new Date(),
        fileSize: 1024
      };

      // Mock the internal database operation
      const dbInsertMock = vi.fn().mockResolvedValue([mockGeneratedCV]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: dbInsertMock
            })
          })
        }
      }));

      const result = await cvGenerationService.generateCV(mockUserId, mockGenerationOptions);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.templateId).toBe('modern');
      expect(result.format).toBe('pdf');
      
      // Verify profile was fetched
      expect(profileService.getProfile).toHaveBeenCalledWith(mockUserId, mockUserId);
    });

    it('should handle missing profile data', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(null);

      await expect(
        cvGenerationService.generateCV(mockUserId, mockGenerationOptions)
      ).rejects.toThrow('Profile not found');
    });

    it('should validate generation options', async () => {
      const invalidOptions = {
        ...mockGenerationOptions,
        templateId: '', // Invalid template ID
        format: 'invalid-format' as any
      };

      await expect(
        cvGenerationService.generateCV(mockUserId, invalidOptions)
      ).rejects.toThrow('Invalid generation options');
    });

    it('should apply custom styling', async () => {
      const customOptions = {
        ...mockGenerationOptions,
        customizations: {
          primaryColor: '#ff6b35',
          fontSize: 'large' as const,
          fontFamily: 'georgia' as const,
          spacing: 'relaxed' as const,
          margins: {
            top: 1.5,
            right: 1.0,
            bottom: 1.5,
            left: 1.0
          }
        }
      };

      const result = await cvGenerationService.generateCV(mockUserId, customOptions);

      expect(result).toBeDefined();
      // Verify customizations were applied (would check internal implementation)
    });

    it('should handle different output formats', async () => {
      // Test HTML format
      const htmlOptions = { ...mockGenerationOptions, format: 'html' as const };
      const htmlResult = await cvGenerationService.generateCV(mockUserId, htmlOptions);
      expect(htmlResult.format).toBe('html');

      // Test PNG format
      const pngOptions = { ...mockGenerationOptions, format: 'png' as const };
      const pngResult = await cvGenerationService.generateCV(mockUserId, pngOptions);
      expect(pngResult.format).toBe('png');
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return list of available templates', async () => {
      const templates = await cvGenerationService.getAvailableTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check template structure
      const template = templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('previewUrl');
    });

    it('should include all template categories', async () => {
      const templates = await cvGenerationService.getAvailableTemplates();
      const categories = templates.map(t => t.category);

      expect(categories).toContain('modern');
      expect(categories).toContain('classic');
      expect(categories).toContain('creative');
      expect(categories).toContain('professional');
    });
  });

  describe('getTemplate', () => {
    it('should return specific template details', async () => {
      const template = await cvGenerationService.getTemplate('modern');

      expect(template).toBeDefined();
      expect(template.id).toBe('modern');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('features');
      expect(template).toHaveProperty('customizationOptions');
    });

    it('should return null for non-existent template', async () => {
      const template = await cvGenerationService.getTemplate('non-existent');
      expect(template).toBeNull();
    });
  });

  describe('previewCV', () => {
    it('should generate preview without saving', async () => {
      const preview = await cvGenerationService.previewCV(mockUserId, mockGenerationOptions);

      expect(preview).toBeDefined();
      expect(preview).toHaveProperty('previewId');
      expect(preview).toHaveProperty('previewUrl');
      expect(preview).toHaveProperty('templateId');
      expect(preview.templateId).toBe('modern');
    });

    it('should use sample data when profile incomplete', async () => {
      const incompleteProfile = {
        ...mockProfileData,
        workExperience: [],
        education: []
      };

      vi.mocked(profileService.getProfile).mockResolvedValue(incompleteProfile);

      const preview = await cvGenerationService.previewCV(mockUserId, mockGenerationOptions);

      expect(preview).toBeDefined();
      // Should still generate preview with available data
    });
  });

  describe('previewTemplate', () => {
    it('should generate template preview with sample data', async () => {
      const preview = await cvGenerationService.previewTemplate('modern', true);

      expect(preview).toBeDefined();
      expect(preview).toHaveProperty('previewId');
      expect(preview).toHaveProperty('previewUrl');
      expect(preview).toHaveProperty('sampleData');
    });

    it('should generate empty template preview', async () => {
      const preview = await cvGenerationService.previewTemplate('modern', false);

      expect(preview).toBeDefined();
      expect(preview.sampleData).toBe(false);
    });
  });

  describe('regenerateCV', () => {
    it('should regenerate existing CV with new options', async () => {
      const newOptions = {
        templateId: 'classic',
        customizations: {
          primaryColor: '#1a365d'
        }
      };

      const mockExistingCV = {
        id: mockCvId,
        userId: mockUserId,
        templateId: 'modern',
        label: 'Original CV'
      };

      // Mock database query for existing CV
      const dbSelectMock = vi.fn().mockResolvedValue([mockExistingCV]);
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(dbSelectMock)
            })
          })
        }
      }));

      const result = await cvGenerationService.regenerateCV(mockCvId, mockUserId, newOptions);

      expect(result).toBeDefined();
      expect(result.templateId).toBe('classic');
    });

    it('should throw error for non-existent CV', async () => {
      vi.doMock('../../src/lib/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([])
            })
          })
        }
      }));

      await expect(
        cvGenerationService.regenerateCV('non-existent', mockUserId, {})
      ).rejects.toThrow('CV not found');
    });
  });

  describe('validateGeneration', () => {
    it('should validate generation options successfully', async () => {
      const validation = await cvGenerationService.validateGeneration(mockGenerationOptions);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid template', async () => {
      const invalidOptions = {
        ...mockGenerationOptions,
        templateId: 'invalid-template'
      };

      const validation = await cvGenerationService.validateGeneration(invalidOptions);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid template ID');
    });

    it('should validate color format', async () => {
      const invalidColorOptions = {
        ...mockGenerationOptions,
        customizations: {
          primaryColor: 'invalid-color'
        }
      };

      const validation = await cvGenerationService.validateGeneration(invalidColorOptions);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('color'))).toBe(true);
    });
  });

  describe('template rendering', () => {
    it('should render personal details section', () => {
      const html = cvGenerationService.renderPersonalDetails(mockProfileData);

      expect(html).toContain('John Doe');
      expect(html).toContain('john.doe@example.com');
      expect(html).toContain('+1234567890');
      expect(html).toContain('Dublin, Ireland');
    });

    it('should render work experience section', () => {
      const html = cvGenerationService.renderWorkExperience(mockProfileData.workExperience);

      expect(html).toContain('Tech Corp');
      expect(html).toContain('Senior Software Engineer');
      expect(html).toContain('2022');
      expect(html).toContain('Present');
    });

    it('should render education section', () => {
      const html = cvGenerationService.renderEducation(mockProfileData.education);

      expect(html).toContain('Trinity College Dublin');
      expect(html).toContain('Computer Science');
      expect(html).toContain('First Class Honours');
    });

    it('should render skills section', () => {
      const html = cvGenerationService.renderSkills(mockProfileData.skills);

      expect(html).toContain('JavaScript');
      expect(html).toContain('TypeScript');
      expect(html).toContain('React');
      expect(html).toContain('Node.js');
    });

    it('should handle missing sections gracefully', () => {
      const profileWithoutExperience = {
        ...mockProfileData,
        workExperience: []
      };

      const html = cvGenerationService.renderWorkExperience(profileWithoutExperience.workExperience);
      expect(html).toBe(''); // Should return empty string for missing data
    });
  });

  describe('file management', () => {
    it('should generate unique filenames', () => {
      const filename1 = cvGenerationService.generateFileName(mockProfileData, 'pdf');
      const filename2 = cvGenerationService.generateFileName(mockProfileData, 'pdf');

      expect(filename1).toMatch(/john-doe-cv-\d+\.pdf/);
      expect(filename2).toMatch(/john-doe-cv-\d+\.pdf/);
      expect(filename1).not.toBe(filename2); // Should be unique
    });

    it('should handle special characters in names', () => {
      const profileWithSpecialChars = {
        ...mockProfileData,
        fullName: 'José María O\'Brien-Smith'
      };

      const filename = cvGenerationService.generateFileName(profileWithSpecialChars, 'pdf');
      expect(filename).toMatch(/jose-maria-obrien-smith-cv-\d+\.pdf/);
    });

    it('should sanitize file paths', () => {
      const unsafePath = '../../../etc/passwd';
      const safePath = cvGenerationService.sanitizeFilePath(unsafePath);

      expect(safePath).not.toContain('..');
      expect(safePath).not.toContain('/etc/passwd');
    });
  });

  describe('error handling', () => {
    it('should handle PDF generation failures', async () => {
      // Mock Puppeteer to throw an error
      vi.doMock('puppeteer', () => ({
        default: {
          launch: vi.fn().mockRejectedValue(new Error('PDF generation failed'))
        }
      }));

      await expect(
        cvGenerationService.generateCV(mockUserId, mockGenerationOptions)
      ).rejects.toThrow('PDF generation failed');
    });

    it('should handle file system errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(
        cvGenerationService.generateCV(mockUserId, mockGenerationOptions)
      ).rejects.toThrow('Failed to save CV file');
    });

    it('should clean up temporary files on error', async () => {
      const cleanupSpy = vi.spyOn(cvGenerationService, 'cleanupTempFiles');
      
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      try {
        await cvGenerationService.generateCV(mockUserId, mockGenerationOptions);
      } catch (error) {
        // Expected to throw
      }

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should complete CV generation within reasonable time', async () => {
      const startTime = Date.now();
      
      await cvGenerationService.generateCV(mockUserId, mockGenerationOptions);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds for standard CV
      expect(duration).toBeLessThan(5000);
    }, 10000);

    it('should handle concurrent generation requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        cvGenerationService.generateCV(`user-${i}`, {
          ...mockGenerationOptions,
          label: `CV ${i}`
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.label).toBe(`CV ${i}`);
      });
    });
  });
});