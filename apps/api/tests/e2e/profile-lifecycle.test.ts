/**
 * End-to-End Tests for Profile Lifecycle
 * 
 * Tests complete user journey from profile creation to deletion,
 * including all CV & Profile Tools features.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import request from 'supertest';
import { app } from '../../src/index';
import { db } from '../../src/lib/database';
import { testHelpers } from '../helpers/test-helpers';

describe('Profile Lifecycle E2E Tests', () => {
  let testUser: any;
  let authToken: string;
  let testProfile: any;
  let testCV: any;
  let testPortfolioItem: any;

  beforeAll(async () => {
    // Setup test database
    await testHelpers.setupTestDatabase();
    
    // Create test user and get auth token
    testUser = await testHelpers.createTestUser({
      email: 'test.user@example.com',
      password: 'TestPassword123!',
      role: 'CANDIDATE'
    });
    
    authToken = await testHelpers.getAuthToken(testUser.email, 'TestPassword123!');
  });

  afterAll(async () => {
    // Cleanup test data
    await testHelpers.cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Reset any test-specific data
    await testHelpers.cleanupUserData(testUser.id);
  });

  afterEach(async () => {
    // Cleanup after each test
    await testHelpers.cleanupUserData(testUser.id);
  });

  describe('Complete Profile Creation Journey', () => {
    it('should create profile, upload CV, build portfolio, and export data', async () => {
      // Step 1: Create initial profile
      const profileData = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+353851234567',
        location: 'Dublin, Ireland',
        title: 'Senior Full Stack Developer',
        summary: 'Experienced developer with 5+ years in React, Node.js, and PostgreSQL. Passionate about creating scalable web applications.',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
        industries: ['Technology', 'Fintech', 'E-commerce'],
        salaryMin: 70000,
        salaryMax: 90000,
        salaryCurrency: 'EUR',
        workType: 'HYBRID',
        experienceLevel: 'SENIOR',
        availabilityDate: '2025-01-15'
      };

      const profileResponse = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.fullName).toBe('John Doe');
      expect(profileResponse.body.data.skills).toContain('React');
      
      testProfile = profileResponse.body.data;

      // Step 2: Add work experience
      const workExperience = {
        company: 'Tech Solutions Ltd',
        position: 'Senior Full Stack Developer',
        startDate: '2022-03-01',
        endDate: null,
        current: true,
        location: 'Dublin, Ireland',
        description: 'Led development of React-based customer portal, improved performance by 40%',
        achievements: [
          'Migrated legacy system to microservices architecture',
          'Mentored 3 junior developers',
          'Reduced deployment time from 2 hours to 15 minutes'
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS']
      };

      const experienceResponse = await request(app)
        .post('/api/v1/experience')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workExperience)
        .expect(201);

      expect(experienceResponse.body.success).toBe(true);
      expect(experienceResponse.body.data.company).toBe('Tech Solutions Ltd');

      // Step 3: Add education
      const education = {
        institution: 'Trinity College Dublin',
        degree: 'Bachelor of Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2015-09-01',
        endDate: '2019-06-01',
        grade: 'First Class Honours',
        description: 'Specialized in software engineering and artificial intelligence'
      };

      const educationResponse = await request(app)
        .post('/api/v1/education')
        .set('Authorization', `Bearer ${authToken}`)
        .send(education)
        .expect(201);

      expect(educationResponse.body.success).toBe(true);
      expect(educationResponse.body.data.institution).toBe('Trinity College Dublin');

      // Step 4: Check profile completion
      const completionResponse = await request(app)
        .get(`/api/v1/profile/${testUser.id}/completion`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(completionResponse.body.data.percentage).toBeGreaterThan(80);
      expect(completionResponse.body.data.missingFields.length).toBeLessThan(3);

      // Step 5: Create portfolio item
      const portfolioData = {
        title: 'E-commerce Platform Redesign',
        description: 'Complete redesign of e-commerce platform using React and Node.js',
        type: 'PROJECT',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe API'],
        projectDate: '2024-06-01',
        role: 'Lead Developer',
        externalUrl: 'https://github.com/johndoe/ecommerce-platform',
        isPublic: true
      };

      const portfolioResponse = await request(app)
        .post('/api/v1/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send(portfolioData)
        .expect(201);

      expect(portfolioResponse.body.success).toBe(true);
      expect(portfolioResponse.body.data.title).toBe('E-commerce Platform Redesign');
      
      testPortfolioItem = portfolioResponse.body.data;

      // Step 6: Generate CV
      const cvGenerationOptions = {
        templateId: 'modern',
        label: 'Senior Developer CV',
        isDefault: true,
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true,
          includePortfolio: true
        },
        customizations: {
          primaryColor: '#2563eb',
          fontSize: 'medium',
          fontFamily: 'helvetica',
          spacing: 'normal'
        },
        format: 'pdf',
        quality: 'high'
      };

      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cvGenerationOptions)
        .expect(201);

      expect(cvResponse.body.success).toBe(true);
      expect(cvResponse.body.data.templateId).toBe('modern');
      expect(cvResponse.body.data.format).toBe('pdf');
      
      testCV = cvResponse.body.data;

      // Step 7: Download generated CV
      const downloadResponse = await request(app)
        .get(`/api/v1/cv/${testCV.id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toBe('application/pdf');
      expect(downloadResponse.headers['content-disposition']).toContain('attachment');

      // Step 8: Test search visibility
      const searchResponse = await request(app)
        .post('/api/v1/search/profiles')
        .send({
          query: 'React developer Dublin',
          filters: {
            location: 'Dublin',
            skills: ['React'],
            experienceLevel: 'SENIOR'
          }
        })
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.results.some(
        (result: any) => result.userId === testUser.id
      )).toBe(true);

      // Step 9: Export profile data (GDPR compliance)
      const exportResponse = await request(app)
        .post(`/api/v1/profile/${testUser.id}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          includeAnalytics: true,
          includePrivateData: true
        })
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data.profile).toBeDefined();
      expect(exportResponse.body.data.workExperience).toBeDefined();
      expect(exportResponse.body.data.education).toBeDefined();
      expect(exportResponse.body.data.portfolio).toBeDefined();
    });
  });

  describe('Privacy and Security Features', () => {
    beforeEach(async () => {
      // Create a test profile for privacy tests
      testProfile = await testHelpers.createTestProfile(testUser.id, {
        fullName: 'Jane Privacy',
        email: 'jane.privacy@example.com',
        phoneNumber: '+353857654321'
      });
    });

    it('should enforce privacy settings correctly', async () => {
      // Step 1: Set privacy to PRIVATE
      const privacySettings = {
        privacyLevel: 'PRIVATE',
        profileVisibility: {
          fullName: false,
          email: false,
          phoneNumber: false,
          location: true,
          workExperience: false,
          education: false,
          skills: true,
          portfolio: false
        },
        searchableByRecruiters: false,
        allowDirectContact: false,
        showSalaryExpectations: false
      };

      await request(app)
        .put(`/api/v1/profile/${testUser.id}/privacy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(privacySettings)
        .expect(200);

      // Step 2: Create another user to test visibility
      const otherUser = await testHelpers.createTestUser({
        email: 'other.user@example.com',
        role: 'RECRUITER'
      });
      const otherAuthToken = await testHelpers.getAuthToken(otherUser.email, 'TestPassword123!');

      // Step 3: Test that other user cannot see private profile
      const profileResponse = await request(app)
        .get(`/api/v1/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(403);

      expect(profileResponse.body.success).toBe(false);
      expect(profileResponse.body.error).toContain('privacy');

      // Step 4: Test that profile is not in search results
      const searchResponse = await request(app)
        .post('/api/v1/search/profiles')
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({
          query: 'developer',
          filters: {}
        })
        .expect(200);

      expect(searchResponse.body.data.results.some(
        (result: any) => result.userId === testUser.id
      )).toBe(false);

      // Step 5: Test that contact is not allowed
      await request(app)
        .post(`/api/v1/profile/${testUser.id}/contact`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({
          subject: 'Job Opportunity',
          message: 'We have an exciting opportunity...',
          contactType: 'job_opportunity'
        })
        .expect(403);

      // Cleanup
      await testHelpers.cleanupUser(otherUser.id);
    });

    it('should handle GDPR data deletion correctly', async () => {
      // Step 1: Create profile with data
      await testHelpers.createTestProfile(testUser.id);
      await testHelpers.createTestWorkExperience(testUser.id);
      await testHelpers.createTestEducation(testUser.id);
      await testHelpers.createTestPortfolio(testUser.id);
      
      // Step 2: Request data deletion
      const deletionResponse = await request(app)
        .delete(`/api/v1/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deletionResponse.body.success).toBe(true);
      expect(deletionResponse.body.message).toContain('deleted');

      // Step 3: Verify all data is deleted
      const profileResponse = await request(app)
        .get(`/api/v1/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(profileResponse.body.success).toBe(false);
      expect(profileResponse.body.error).toContain('not found');
    });
  });

  describe('CV Generation and Management', () => {
    beforeEach(async () => {
      testProfile = await testHelpers.createTestProfile(testUser.id);
      await testHelpers.createTestWorkExperience(testUser.id);
      await testHelpers.createTestEducation(testUser.id);
    });

    it('should generate multiple CV formats and templates', async () => {
      const templates = ['modern', 'classic', 'creative', 'professional'];
      const formats = ['pdf', 'html', 'png'];

      for (const template of templates) {
        for (const format of formats) {
          const generationOptions = {
            templateId: template,
            label: `${template} CV in ${format}`,
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

          expect(cvResponse.body.success).toBe(true);
          expect(cvResponse.body.data.templateId).toBe(template);
          expect(cvResponse.body.data.format).toBe(format);

          // Test download
          const downloadResponse = await request(app)
            .get(`/api/v1/cv/${cvResponse.body.data.id}/download`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

          expect(downloadResponse.headers['content-type']).toBeDefined();
        }
      }
    });

    it('should handle CV regeneration with different options', async () => {
      // Step 1: Generate initial CV
      const initialOptions = {
        templateId: 'modern',
        label: 'Original CV',
        customizations: {
          primaryColor: '#2563eb',
          fontSize: 'medium'
        },
        format: 'pdf'
      };

      const initialCvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(initialOptions)
        .expect(201);

      const cvId = initialCvResponse.body.data.id;

      // Step 2: Regenerate with different options
      const regenerationOptions = {
        templateId: 'classic',
        customizations: {
          primaryColor: '#dc2626',
          fontSize: 'large',
          fontFamily: 'georgia'
        }
      };

      const regeneratedCvResponse = await request(app)
        .post(`/api/v1/cv/${cvId}/regenerate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(regenerationOptions)
        .expect(200);

      expect(regeneratedCvResponse.body.success).toBe(true);
      expect(regeneratedCvResponse.body.data.templateId).toBe('classic');

      // Step 3: Verify changes were applied
      const downloadResponse = await request(app)
        .get(`/api/v1/cv/${cvId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    });

    it('should track CV analytics and usage', async () => {
      // Step 1: Generate CV
      const cvResponse = await request(app)
        .post('/api/v1/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateId: 'modern',
          label: 'Analytics Test CV',
          format: 'pdf'
        })
        .expect(201);

      const cvId = cvResponse.body.data.id;

      // Step 2: Download CV multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get(`/api/v1/cv/${cvId}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      // Step 3: Check analytics
      const analyticsResponse = await request(app)
        .get(`/api/v1/cv/${cvId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data.downloads).toBe(3);
    });
  });

  describe('Portfolio Management', () => {
    beforeEach(async () => {
      testProfile = await testHelpers.createTestProfile(testUser.id);
    });

    it('should manage portfolio items with file uploads', async () => {
      // Step 1: Create portfolio item
      const portfolioData = {
        title: 'Full Stack Web Application',
        description: 'Modern React application with Node.js backend',
        type: 'PROJECT',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        projectDate: '2024-08-01',
        role: 'Full Stack Developer',
        isPublic: true
      };

      const portfolioResponse = await request(app)
        .post('/api/v1/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send(portfolioData)
        .expect(201);

      const itemId = portfolioResponse.body.data.id;

      // Step 2: Upload file to portfolio item
      const testImageBuffer = Buffer.from('fake-image-data');
      
      const uploadResponse = await request(app)
        .post(`/api/v1/portfolio/${itemId}/upload-file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, {
          filename: 'screenshot.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(uploadResponse.body.success).toBe(true);

      // Step 3: Update portfolio item
      const updateData = {
        description: 'Updated description with more details',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis']
      };

      const updateResponse = await request(app)
        .put(`/api/v1/portfolio/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.technologies).toContain('Redis');

      // Step 4: Test portfolio visibility
      const publicResponse = await request(app)
        .get(`/api/v1/portfolio/user/${testUser.id}?public=true`)
        .expect(200);

      expect(publicResponse.body.data.items).toHaveLength(1);
      expect(publicResponse.body.data.items[0].title).toBe('Full Stack Web Application');

      // Step 5: Delete portfolio item
      const deleteResponse = await request(app)
        .delete(`/api/v1/portfolio/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });

    it('should import portfolio from GitHub', async () => {
      const importData = {
        githubUsername: 'testuser',
        selectRepos: ['project-1', 'project-2'],
        makePrivate: false
      };

      const importResponse = await request(app)
        .post('/api/v1/portfolio/import/github')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData)
        .expect(201);

      expect(importResponse.body.success).toBe(true);
      expect(importResponse.body.data.importedItems.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Discovery', () => {
    beforeEach(async () => {
      // Create multiple test profiles for search testing
      await testHelpers.createMultipleTestProfiles([
        {
          userId: testUser.id,
          title: 'Senior React Developer',
          location: 'Dublin, Ireland',
          skills: ['React', 'TypeScript', 'Node.js'],
          experienceLevel: 'SENIOR'
        }
      ]);
    });

    it('should perform advanced profile search with filters', async () => {
      const searchQueries = [
        {
          query: 'React developer',
          filters: { skills: ['React'] },
          expectedResults: 1
        },
        {
          query: 'Python developer',
          filters: { skills: ['Python'] },
          expectedResults: 0
        },
        {
          query: 'Dublin',
          filters: { location: 'Dublin' },
          expectedResults: 1
        },
        {
          query: 'Senior',
          filters: { experienceLevel: 'SENIOR' },
          expectedResults: 1
        }
      ];

      for (const searchQuery of searchQueries) {
        const searchResponse = await request(app)
          .post('/api/v1/search/profiles')
          .send(searchQuery)
          .expect(200);

        expect(searchResponse.body.success).toBe(true);
        expect(searchResponse.body.data.results.length).toBe(searchQuery.expectedResults);
      }
    });

    it('should provide search suggestions', async () => {
      const suggestionTypes = ['skills', 'locations', 'companies', 'industries'];

      for (const type of suggestionTypes) {
        const suggestionResponse = await request(app)
          .get(`/api/v1/profile/search/suggestions?type=${type}&query=te&limit=10`)
          .expect(200);

        expect(suggestionResponse.body.success).toBe(true);
        expect(Array.isArray(suggestionResponse.body.data.suggestions)).toBe(true);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent profile operations efficiently', async () => {
      const concurrentOperations = Array.from({ length: 10 }, async (_, i) => {
        const profileData = {
          fullName: `Test User ${i}`,
          email: `test${i}@example.com`,
          title: `Developer ${i}`,
          skills: ['JavaScript', 'React']
        };

        return request(app)
          .post('/api/v1/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(profileData);
      });

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations);
      const endTime = Date.now();

      // All operations should succeed
      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle large CV generation efficiently', async () => {
      // Create profile with extensive data
      const extensiveProfile = await testHelpers.createExtensiveTestProfile(testUser.id);

      const generationOptions = {
        templateId: 'modern',
        label: 'Extensive CV',
        sections: {
          includePersonalDetails: true,
          includeWorkExperience: true,
          includeEducation: true,
          includeSkills: true,
          includePortfolio: true
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

      expect(cvResponse.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidProfileData = {
        fullName: '', // Empty required field
        email: 'invalid-email', // Invalid format
        phoneNumber: '123', // Too short
        salaryMin: 100000,
        salaryMax: 50000 // Min > Max
      };

      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfileData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should handle unauthorized access attempts', async () => {
      // Create another user's profile
      const otherUser = await testHelpers.createTestUser({
        email: 'other@example.com'
      });
      const otherProfile = await testHelpers.createTestProfile(otherUser.id);

      // Try to access other user's profile
      const response = await request(app)
        .put(`/api/v1/profile/${otherUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked!' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authorization');

      // Cleanup
      await testHelpers.cleanupUser(otherUser.id);
    });

    it('should handle rate limiting correctly', async () => {
      // Make many requests quickly to trigger rate limiting
      const rapidRequests = Array.from({ length: 100 }, () =>
        request(app)
          .get(`/api/v1/profile/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.allSettled(rapidRequests);

      // Some requests should be rate limited
      const rateLimitedRequests = results.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });
});