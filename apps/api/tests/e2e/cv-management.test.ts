/**
 * End-to-End Tests for CV Management
 * 
 * Tests complete CV generation, customization, download,
 * and management workflows.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from '../../src/index';
import { testHelpers } from '../helpers/test-helpers';

describe('CV Management E2E Tests', () => {
  let testUser: any;
  let authToken: string;
  let testProfile: any;

  beforeAll(async () => {
    await testHelpers.setupTestDatabase();
    
    testUser = await testHelpers.createTestUser({
      email: 'cv.test@example.com',
      password: 'TestPassword123!',
      role: 'CANDIDATE'
    });
    
    authToken = await testHelpers.getAuthToken(testUser.email, 'TestPassword123!');
  });

  afterAll(async () => {
    await testHelpers.cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Create comprehensive test profile
    testProfile = await testHelpers.createTestProfile(testUser.id, {
      fullName: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      phoneNumber: '+353871234567',
      location: 'Dublin, Ireland',
      title: 'Senior Software Engineer',
      summary: 'Passionate full-stack developer with 6+ years of experience building scalable web applications. Expert in React, Node.js, and cloud technologies.',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
      industries: ['Technology', 'Fintech', 'Healthcare'],
      salaryMin: 75000,
      salaryMax: 95000,
      workType: 'HYBRID',
      experienceLevel: 'SENIOR'
    });

    // Add work experience
    await testHelpers.createTestWorkExperience(testUser.id, [
      {
        company: 'Stripe',
        position: 'Senior Software Engineer',
        startDate: '2022-01-01',
        endDate: null,
        current: true,
        location: 'Dublin, Ireland',
        description: 'Lead development of payment processing infrastructure',
        achievements: [
          'Improved payment success rate by 15%',
          'Led team of 5 engineers',
          'Architected microservices handling 1M+ transactions daily'
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Kubernetes', 'AWS']
      },
      {
        company: 'Intercom',
        position: 'Software Engineer',
        startDate: '2020-03-01',
        endDate: '2021-12-31',
        current: false,
        location: 'Dublin, Ireland',
        description: 'Developed customer messaging platform features',
        achievements: [
          'Built real-time messaging system',
          'Reduced load times by 40%',
          'Mentored 2 junior developers'
        ],
        technologies: ['React', 'Ruby on Rails', 'PostgreSQL', 'Redis']
      }
    ]);

    // Add education
    await testHelpers.createTestEducation(testUser.id, [
      {
        institution: 'University College Dublin',
        degree: 'Master of Computer Science',
        fieldOfStudy: 'Artificial Intelligence',
        startDate: '2016-09-01',
        endDate: '2018-06-01',
        grade: 'First Class Honours',
        description: 'Specialized in machine learning and distributed systems'
      },
      {
        institution: 'Trinity College Dublin',
        degree: 'Bachelor of Computer Science',
        fieldOfStudy: 'Software Engineering',
        startDate: '2013-09-01',
        endDate: '2016-06-01',
        grade: '2:1 Honours',
        description: 'Strong foundation in algorithms and software design'
      }
    ]);

    // Add portfolio items
    await testHelpers.createTestPortfolio(testUser.id, [
      {
        title: 'Real-time Analytics Dashboard',
        description: 'React-based dashboard for monitoring payment metrics',
        type: 'PROJECT',
        technologies: ['React', 'D3.js', 'Node.js', 'PostgreSQL'],
        projectDate: '2024-03-01',
        role: 'Lead Developer',
        externalUrl: 'https://github.com/sarahchen/analytics-dashboard',
        isPublic: true
      },
      {
        title: 'Microservices Architecture Guide',
        description: 'Technical article on implementing microservices',
        type: 'ARTICLE',
        projectDate: '2024-01-15',
        externalUrl: 'https://medium.com/@sarahchen/microservices-guide',
        isPublic: true
      }
    ]);
  });

  afterEach(async () => {
    await testHelpers.cleanupUserData(testUser.id);
  });

  describe('CV Template Management', () => {
    it('should list all available templates with details', async () => {
      const templatesResponse = await request(app)
        .get('/api/v1/cv/templates')
        .expect(200);

      expect(templatesResponse.body.success).toBe(true);
      expect(templatesResponse.body.data.templates.length).toBeGreaterThan(0);

      const template = templatesResponse.body.data.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('previewUrl');
      expect(template).toHaveProperty('features');
    });

    it('should get specific template details', async () => {
      const templateResponse = await request(app)
        .get('/api/v1/cv/templates/modern')
        .expect(200);

      expect(templateResponse.body.success).toBe(true);
      expect(templateResponse.body.data.id).toBe('modern');
      expect(templateResponse.body.data).toHaveProperty('customizationOptions');
      expect(templateResponse.body.data).toHaveProperty('suitableFor');
    });

    it('should generate template previews with sample data', async () => {
      const previewResponse = await request(app)
        .post('/api/v1/cv/templates/modern/preview')
        .send({
          useSampleData: true,
          useUserData: false
        })
        .expect(200);

      expect(previewResponse.body.success).toBe(true);
      expect(previewResponse.body.data).toHaveProperty('previewId');
      expect(previewResponse.body.data).toHaveProperty('previewUrl');
      expect(previewResponse.body.data.sampleData).toBe(true);

      // Verify preview can be accessed
      const previewId = previewResponse.body.data.previewId;
      const previewPageResponse = await request(app)
        .get(`/api/v1/cv/preview/${previewId}`)
        .expect(200);

      expect(previewPageResponse.headers['content-type']).toContain('text/html');
    });

    it('should generate template previews with user data', async () => {
      const previewResponse = await request(app)
        .post('/api/v1/cv/templates/modern/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          useSampleData: false,
          useUserData: true
        })
        .expect(200);

      expect(previewResponse.body.success).toBe(true);
      expect(previewResponse.body.data.sampleData).toBe(false);
    });
  });

  describe('CV Generation Workflow', () => {
    it('should generate CV with all sections and customizations', async () => {
      const generationOptions = {
        templateId: 'modern',
        label: 'Senior Engineer CV - Dublin Tech',
        isDefault: true,
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true,
          includePortfolio: true,
          customSections: [
            {
              title: 'Certifications',
              content: 'AWS Solutions Architect Professional (2023)\nKubernetes Administrator (2022)',
              order: 5
            }
          ]
        },
        customizations: {
          primaryColor: '#0066cc',
          fontSize: 'medium',
          fontFamily: 'helvetica',
          spacing: 'normal',
          margins: {
            top: 1.0,
            right: 0.8,
            bottom: 1.0,
            left: 0.8
          }
        },
        format: 'pdf',
        quality: 'high'
      };

      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationOptions)
        .expect(201);

      expect(cvResponse.body.success).toBe(true);
      expect(cvResponse.body.data).toHaveProperty('id');
      expect(cvResponse.body.data.templateId).toBe('modern');
      expect(cvResponse.body.data.label).toBe('Senior Engineer CV - Dublin Tech');
      expect(cvResponse.body.data.format).toBe('pdf');
      expect(cvResponse.body.data.isDefault).toBe(true);
      expect(cvResponse.body.data).toHaveProperty('filePath');
      expect(cvResponse.body.data).toHaveProperty('fileName');
      expect(cvResponse.body.data.fileSize).toBeGreaterThan(0);

      return cvResponse.body.data; // Return for use in other tests
    });

    it('should validate generation options before creating CV', async () => {
      const validationOptions = {
        templateId: 'modern',
        label: 'Test CV',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true
        },
        customizations: {
          primaryColor: '#0066cc',
          fontSize: 'medium'
        },
        format: 'pdf'
      };

      const validationResponse = await request(app)
        .post('/api/v1/cv/validate-generation')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validationOptions)
        .expect(200);

      expect(validationResponse.body.success).toBe(true);
      expect(validationResponse.body.data.isValid).toBe(true);
      expect(validationResponse.body.data.errors).toHaveLength(0);
    });

    it('should reject invalid generation options', async () => {
      const invalidOptions = {
        templateId: 'non-existent-template',
        label: '', // Empty label
        customizations: {
          primaryColor: 'invalid-color', // Invalid color format
          fontSize: 'invalid-size'
        },
        format: 'invalid-format'
      };

      const validationResponse = await request(app)
        .post('/api/v1/cv/validate-generation')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOptions)
        .expect(200);

      expect(validationResponse.body.success).toBe(true);
      expect(validationResponse.body.data.isValid).toBe(false);
      expect(validationResponse.body.data.errors.length).toBeGreaterThan(0);
    });

    it('should generate CV in multiple formats', async () => {
      const formats = ['pdf', 'html', 'png'];
      const generatedCVs = [];

      for (const format of formats) {
        const generationOptions = {
          templateId: 'modern',
          label: `CV in ${format.toUpperCase()}`,
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: true,
            includeSkills: true
          },
          format,
          quality: 'standard'
        };

        const cvResponse = await request(app)
          .post('/api/v1/cv/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(generationOptions)
          .expect(201);

        expect(cvResponse.body.data.format).toBe(format);
        generatedCVs.push(cvResponse.body.data);
      }

      // Verify each format can be downloaded
      for (const cv of generatedCVs) {
        const downloadResponse = await request(app)
          .get(`/api/v1/cv/${cv.id}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const expectedContentType = cv.format === 'pdf' ? 'application/pdf' :
                                   cv.format === 'html' ? 'text/html' :
                                   'image/png';
        
        expect(downloadResponse.headers['content-type']).toBe(expectedContentType);
      }
    });
  });

  describe('CV Customization and Regeneration', () => {
    let testCV: any;

    beforeEach(async () => {
      // Generate a test CV for customization tests
      const generationOptions = {
        templateId: 'modern',
        label: 'Original CV',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true
        },
        customizations: {
          primaryColor: '#2563eb',
          fontSize: 'medium',
          fontFamily: 'helvetica'
        },
        format: 'pdf'
      };

      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationOptions)
        .expect(201);

      testCV = cvResponse.body.data;
    });

    it('should regenerate CV with different template', async () => {
      const regenerationOptions = {
        templateId: 'classic',
        label: 'Classic Style CV'
      };

      const regenerateResponse = await request(app)
        .post(`/api/v1/cv/${testCV.id}/regenerate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(regenerationOptions)
        .expect(200);

      expect(regenerateResponse.body.success).toBe(true);
      expect(regenerateResponse.body.data.templateId).toBe('classic');
      expect(regenerateResponse.body.data.label).toBe('Classic Style CV');
      expect(regenerateResponse.body.data.id).toBe(testCV.id); // Same ID, updated content
    });

    it('should regenerate CV with different customizations', async () => {
      const regenerationOptions = {
        customizations: {
          primaryColor: '#dc2626',
          fontSize: 'large',
          fontFamily: 'georgia',
          spacing: 'relaxed'
        }
      };

      const regenerateResponse = await request(app)
        .post(`/api/v1/cv/${testCV.id}/regenerate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(regenerationOptions)
        .expect(200);

      expect(regenerateResponse.body.success).toBe(true);
    });

    it('should regenerate CV with different sections', async () => {
      const regenerationOptions = {
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: false, // Exclude education
          includeSkills: true,
          includePortfolio: true, // Include portfolio
          customSections: [
            {
              title: 'Awards',
              content: 'Best Developer Award 2023\nEmployee of the Month (3x)',
              order: 4
            }
          ]
        }
      };

      const regenerateResponse = await request(app)
        .post(`/api/v1/cv/${testCV.id}/regenerate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(regenerationOptions)
        .expect(200);

      expect(regenerateResponse.body.success).toBe(true);
    });

    it('should generate CV preview without saving', async () => {
      const previewOptions = {
        templateId: 'creative',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true,
          includePortfolio: true
        },
        customizations: {
          primaryColor: '#8b5cf6',
          fontSize: 'large'
        },
        format: 'html'
      };

      const previewResponse = await request(app)
        .post('/api/v1/cv/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send(previewOptions)
        .expect(200);

      expect(previewResponse.body.success).toBe(true);
      expect(previewResponse.body.data).toHaveProperty('previewId');
      expect(previewResponse.body.data).toHaveProperty('previewUrl');

      // Verify preview content
      const previewId = previewResponse.body.data.previewId;
      const previewPageResponse = await request(app)
        .get(`/api/v1/cv/preview/${previewId}`)
        .expect(200);

      expect(previewPageResponse.text).toContain('Sarah Chen');
      expect(previewPageResponse.text).toContain('Senior Software Engineer');
    });
  });

  describe('CV Management and Organization', () => {
    let userCVs: any[] = [];

    beforeEach(async () => {
      // Generate multiple CVs for management tests
      const cvConfigs = [
        { templateId: 'modern', label: 'Tech Company CV', format: 'pdf' },
        { templateId: 'classic', label: 'Corporate CV', format: 'pdf' },
        { templateId: 'creative', label: 'Startup CV', format: 'html' }
      ];

      for (const config of cvConfigs) {
        const generationOptions = {
          ...config,
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: true,
            includeSkills: true
          }
        };

        const cvResponse = await request(app)
          .post('/api/v1/cv/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(generationOptions)
          .expect(201);

        userCVs.push(cvResponse.body.data);
      }
    });

    it('should list user CVs with pagination', async () => {
      const listResponse = await request(app)
        .get(`/api/v1/cv/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.cvs.length).toBe(3);
      expect(listResponse.body.data.pagination.total).toBe(3);

      // Test pagination
      const paginatedResponse = await request(app)
        .get(`/api/v1/cv/user/${testUser.id}?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(paginatedResponse.body.data.cvs.length).toBe(2);
      expect(paginatedResponse.body.data.pagination.hasMore).toBe(true);
    });

    it('should set CV as default', async () => {
      const cvId = userCVs[1].id; // Use second CV

      const setDefaultResponse = await request(app)
        .post(`/api/v1/cv/${cvId}/set-default`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(setDefaultResponse.body.success).toBe(true);

      // Verify it's marked as default
      const listResponse = await request(app)
        .get(`/api/v1/cv/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const defaultCV = listResponse.body.data.cvs.find((cv: any) => cv.isDefault);
      expect(defaultCV.id).toBe(cvId);
    });

    it('should track CV analytics', async () => {
      const cvId = userCVs[0].id;

      // Download CV multiple times to generate analytics
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get(`/api/v1/cv/${cvId}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const analyticsResponse = await request(app)
        .get(`/api/v1/cv/${cvId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data.downloads).toBe(5);
      expect(analyticsResponse.body.data.cvId).toBe(cvId);
    });
  });

  describe('Batch CV Operations', () => {
    it('should generate multiple CVs with different templates', async () => {
      const batchRequests = [
        {
          templateId: 'modern',
          label: 'Modern Tech CV',
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: true,
            includeSkills: true
          },
          format: 'pdf'
        },
        {
          templateId: 'classic',
          label: 'Classic Corporate CV',
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: true,
            includeSkills: false
          },
          format: 'html'
        },
        {
          templateId: 'creative',
          label: 'Creative Design CV',
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: false,
            includeSkills: true,
            includePortfolio: true
          },
          format: 'pdf'
        }
      ];

      const batchResponse = await request(app)
        .post('/api/v1/cv/batch-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requests: batchRequests })
        .expect(201);

      expect(batchResponse.body.success).toBe(true);
      expect(batchResponse.body.data.results.length).toBe(3);
      expect(batchResponse.body.data.successCount).toBe(3);
      expect(batchResponse.body.data.errorCount).toBe(0);

      // Verify each CV was generated correctly
      batchResponse.body.data.results.forEach((result: any, index: number) => {
        expect(result.success).toBe(true);
        expect(result.data.templateId).toBe(batchRequests[index].templateId);
        expect(result.data.label).toBe(batchRequests[index].label);
      });
    });

    it('should handle partial failures in batch generation', async () => {
      const batchRequests = [
        {
          templateId: 'modern',
          label: 'Valid CV',
          sections: { includePersonalDetails: true },
          format: 'pdf'
        },
        {
          templateId: 'invalid-template', // This will fail
          label: 'Invalid CV',
          sections: { includePersonalDetails: true },
          format: 'pdf'
        },
        {
          templateId: 'classic',
          label: 'Another Valid CV',
          sections: { includePersonalDetails: true },
          format: 'html'
        }
      ];

      const batchResponse = await request(app)
        .post('/api/v1/cv/batch-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requests: batchRequests })
        .expect(207); // Multi-Status for partial success

      expect(batchResponse.body.success).toBe(false);
      expect(batchResponse.body.data.successCount).toBe(2);
      expect(batchResponse.body.data.errorCount).toBe(1);
      
      const errors = batchResponse.body.data.errors;
      expect(errors.length).toBe(1);
      expect(errors[0].index).toBe(1);
      expect(errors[0].success).toBe(false);
    });
  });

  describe('CV Optimization Features', () => {
    let testCV: any;

    beforeEach(async () => {
      const generationOptions = {
        templateId: 'modern',
        label: 'Optimization Test CV',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true
        },
        format: 'pdf'
      };

      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationOptions)
        .expect(201);

      testCV = cvResponse.body.data;
    });

    it('should optimize CV for ATS systems', async () => {
      const atsOptimizeResponse = await request(app)
        .post(`/api/v1/cv/${testCV.id}/optimize-ats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(atsOptimizeResponse.body.success).toBe(true);
      expect(atsOptimizeResponse.body.data.optimizations).toBeDefined();
      expect(Array.isArray(atsOptimizeResponse.body.data.optimizations)).toBe(true);
      expect(atsOptimizeResponse.body.data.optimizations.length).toBeGreaterThan(0);
    });
  });

  describe('CV Download and File Management', () => {
    let testCV: any;

    beforeEach(async () => {
      const generationOptions = {
        templateId: 'modern',
        label: 'Download Test CV',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true
        },
        format: 'pdf',
        quality: 'high'
      };

      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationOptions)
        .expect(201);

      testCV = cvResponse.body.data;
    });

    it('should download CV with correct headers and content', async () => {
      const downloadResponse = await request(app)
        .get(`/api/v1/cv/${testCV.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toBe('application/pdf');
      expect(downloadResponse.headers['content-disposition']).toContain('attachment');
      expect(downloadResponse.headers['content-disposition']).toContain(testCV.fileName);
      expect(downloadResponse.headers['content-length']).toBeDefined();
      expect(parseInt(downloadResponse.headers['content-length'])).toBeGreaterThan(0);
    });

    it('should download CV in different formats', async () => {
      // Generate CVs in different formats
      const formats = ['pdf', 'html', 'png'];
      const cvs = [];

      for (const format of formats) {
        const generationOptions = {
          templateId: 'modern',
          label: `CV in ${format}`,
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeSkills: true
          },
          format
        };

        const cvResponse = await request(app)
          .post('/api/v1/cv/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(generationOptions)
          .expect(201);

        cvs.push(cvResponse.body.data);
      }

      // Test download for each format
      const expectedContentTypes = {
        pdf: 'application/pdf',
        html: 'text/html',
        png: 'image/png'
      };

      for (const cv of cvs) {
        const downloadResponse = await request(app)
          .get(`/api/v1/cv/${cv.id}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(downloadResponse.headers['content-type']).toBe(expectedContentTypes[cv.format]);
      }
    });

    it('should prevent unauthorized downloads', async () => {
      // Create another user
      const otherUser = await testHelpers.createTestUser({
        email: 'other.user@example.com'
      });
      const otherAuthToken = await testHelpers.getAuthToken(otherUser.email, 'TestPassword123!');

      // Try to download first user's CV
      const downloadResponse = await request(app)
        .get(`/api/v1/cv/${testCV.id}/download`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(403);

      expect(downloadResponse.body.success).toBe(false);
      expect(downloadResponse.body.error).toContain('Access denied');

      // Cleanup
      await testHelpers.cleanupUser(otherUser.id);
    });
  });

  describe('Performance and Quality Assurance', () => {
    it('should generate high-quality CV within reasonable time', async () => {
      const generationOptions = {
        templateId: 'professional',
        label: 'High Quality Performance Test',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true,
          includePortfolio: true
        },
        customizations: {
          primaryColor: '#1a365d',
          fontSize: 'medium',
          fontFamily: 'georgia',
          spacing: 'normal'
        },
        format: 'pdf',
        quality: 'high'
      };

      const startTime = Date.now();
      
      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationOptions)
        .expect(201);

      const endTime = Date.now();
      const generationTime = endTime - startTime;

      expect(cvResponse.body.success).toBe(true);
      expect(generationTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(cvResponse.body.data.fileSize).toBeGreaterThan(50000); // At least 50KB for quality content
    });

    it('should handle concurrent CV generations efficiently', async () => {
      const concurrentGenerations = Array.from({ length: 5 }, (_, i) => {
        const generationOptions = {
          templateId: 'modern',
          label: `Concurrent CV ${i + 1}`,
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: true,
            includeSkills: true
          },
          format: 'pdf'
        };

        return request(app)
          .post('/api/v1/cv/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(generationOptions);
      });

      const startTime = Date.now();
      const results = await Promise.all(concurrentGenerations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All generations should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
        expect(result.body.data.label).toBe(`Concurrent CV ${index + 1}`);
      });

      // Should complete within reasonable time even with concurrency
      expect(totalTime).toBeLessThan(30000);
    });

    it('should maintain CV quality across different profiles', async () => {
      // Test with minimal profile
      const minimalProfile = await testHelpers.createTestProfile(testUser.id, {
        fullName: 'Min Profile',
        email: 'min@example.com',
        title: 'Developer'
      });

      const minimalCvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'modern',
          label: 'Minimal CV',
          sections: { includePersonalDetails: true },
          format: 'pdf'
        })
        .expect(201);

      expect(minimalCvResponse.body.success).toBe(true);
      expect(minimalCvResponse.body.data.fileSize).toBeGreaterThan(10000); // At least 10KB

      // Test with extensive profile (already created in beforeEach)
      const extensiveCvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'modern',
          label: 'Extensive CV',
          sections: {
            includePersonalDetails: true,
            includeWorkExperience: true,
            includeEducation: true,
            includeSkills: true,
            includePortfolio: true
          },
          format: 'pdf'
        })
        .expect(201);

      expect(extensiveCvResponse.body.success).toBe(true);
      expect(extensiveCvResponse.body.data.fileSize).toBeGreaterThan(minimalCvResponse.body.data.fileSize);
    });
  });
});