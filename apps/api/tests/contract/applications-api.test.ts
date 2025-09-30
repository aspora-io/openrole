import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { Application } from 'express';

describe('Applications API Contract Tests', () => {
  let app: Application;
  let authToken: string;
  let employerAuthToken: string;
  const testUserId = uuidv4();
  const employerId = uuidv4();
  const testApplicationId = uuidv4();
  const testJobId = uuidv4();
  const testCvDocumentId = uuidv4();
  const baseUrl = '/v1/applications';

  // Valid application statuses
  const APPLICATION_STATUSES = [
    'submitted',
    'received',
    'under_review',
    'interview',
    'rejected',
    'offer',
    'hired',
    'withdrawn'
  ];

  // Valid rejection feedback tags
  const FEEDBACK_TAGS = [
    'too_junior',
    'missing_skills',
    'over_budget',
    'culture_fit',
    'location',
    'other'
  ];

  beforeAll(async () => {
    // Import the app here to ensure it's properly initialized
    const { app: expressApp } = await import('../../src/index');
    app = expressApp;

    // Generate test auth tokens
    authToken = jwt.sign(
      { userId: testUserId, type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    employerAuthToken = jwt.sign(
      { userId: employerId, type: 'access', role: 'employer' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('GET /applications', () => {
    it('should return a list of user applications', async () => {
      const response = await request(app)
        .get(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('applications');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.applications)).toBe(true);
      
      // Validate pagination structure
      expect(response.body.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it('should filter applications by status', async () => {
      const response = await request(app)
        .get(`${baseUrl}?status=interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('applications');
      // All returned applications should have the requested status
      response.body.applications.forEach((app: any) => {
        expect(app.status).toBe('interview');
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=2&limit=10`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.applications.length).toBeLessThanOrEqual(10);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get(`${baseUrl}?limit=150`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(baseUrl)
        .expect(401);
    });

    it('should reject invalid status filter', async () => {
      await request(app)
        .get(`${baseUrl}?status=invalid_status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /applications', () => {
    it('should create a new job application', async () => {
      const applicationData = {
        jobId: testJobId,
        cvDocumentId: testCvDocumentId,
        coverLetter: 'I am very interested in this position...'
      };

      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        jobId: applicationData.jobId,
        cvDocumentId: applicationData.cvDocumentId,
        status: 'submitted',
        appliedAt: expect.any(String),
        lastStatusChange: expect.any(String),
        isExternal: false
      });
    });

    it('should reject duplicate applications', async () => {
      const applicationData = {
        jobId: testJobId,
        cvDocumentId: testCvDocumentId
      };

      // First application should succeed
      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);

      // Duplicate should fail
      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);
    });

    it('should require jobId and cvDocumentId', async () => {
      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ coverLetter: 'Test' })
        .expect(400);
    });

    it('should enforce cover letter length limit', async () => {
      const applicationData = {
        jobId: testJobId,
        cvDocumentId: testCvDocumentId,
        coverLetter: 'a'.repeat(5001) // Exceeds 5000 char limit
      };

      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);
    });

    it('should validate UUID formats', async () => {
      const applicationData = {
        jobId: 'invalid-uuid',
        cvDocumentId: testCvDocumentId
      };

      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);
    });
  });

  describe('GET /applications/:applicationId', () => {
    it('should return application details for the applicant', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testApplicationId,
        jobId: expect.any(String),
        jobTitle: expect.any(String),
        companyName: expect.any(String),
        cvDocumentId: expect.any(String),
        status: expect.stringMatching(new RegExp(APPLICATION_STATUSES.join('|'))),
        appliedAt: expect.any(String),
        lastStatusChange: expect.any(String)
      });

      // Should include extended details
      expect(response.body).toHaveProperty('cvDocument');
      expect(response.body).toHaveProperty('statusHistory');
      expect(response.body).toHaveProperty('feedback');
    });

    it('should return application details for the employer', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${employerAuthToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testApplicationId);
    });

    it('should return 404 for non-existent application', async () => {
      const nonExistentId = uuidv4();
      await request(app)
        .get(`${baseUrl}/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should enforce privacy - prevent access to other users applications', async () => {
      const otherUserToken = jwt.sign(
        { userId: uuidv4(), type: 'access' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      await request(app)
        .get(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('PUT /applications/:applicationId', () => {
    it('should allow applicant to update cover letter', async () => {
      const updateData = {
        coverLetter: 'Updated cover letter content...'
      };

      const response = await request(app)
        .put(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(testApplicationId);
    });

    it('should prevent updates after certain status transitions', async () => {
      // Assuming application is in 'under_review' or later status
      const updateData = {
        coverLetter: 'Trying to update after review...'
      };

      // This should fail based on business logic
      await request(app)
        .put(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should validate cover letter length on update', async () => {
      const updateData = {
        coverLetter: 'a'.repeat(5001)
      };

      await request(app)
        .put(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('POST /applications/:applicationId/withdraw', () => {
    it('should allow applicant to withdraw application', async () => {
      const withdrawData = {
        reason: 'Accepted another offer'
      };

      const response = await request(app)
        .post(`${baseUrl}/${testApplicationId}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawData)
        .expect(200);

      expect(response.body.status).toBe('withdrawn');
    });

    it('should work without providing a reason', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${testApplicationId}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.status).toBe('withdrawn');
    });

    it('should enforce reason length limit', async () => {
      const withdrawData = {
        reason: 'a'.repeat(501)
      };

      await request(app)
        .post(`${baseUrl}/${testApplicationId}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawData)
        .expect(400);
    });

    it('should prevent withdrawal if already in final state', async () => {
      // Assuming the application is already hired/rejected
      await request(app)
        .post(`${baseUrl}/${testApplicationId}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /applications/:applicationId/status-history', () => {
    it('should return application status history', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${testApplicationId}/status-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Validate status history entries
      response.body.forEach((entry: any) => {
        expect(entry).toMatchObject({
          id: expect.any(String),
          toStatus: expect.stringMatching(new RegExp(APPLICATION_STATUSES.join('|'))),
          changedBy: expect.stringMatching(/system|employer|candidate/),
          changedAt: expect.any(String)
        });
        
        if (entry.fromStatus !== null) {
          expect(APPLICATION_STATUSES).toContain(entry.fromStatus);
        }
      });

      // Status history should be in chronological order
      for (let i = 1; i < response.body.length; i++) {
        const prevDate = new Date(response.body[i - 1].changedAt);
        const currDate = new Date(response.body[i].changedAt);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });

    it('should respect privacy controls', async () => {
      const otherUserToken = jwt.sign(
        { userId: uuidv4(), type: 'access' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      await request(app)
        .get(`${baseUrl}/${testApplicationId}/status-history`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('POST /applications/external', () => {
    it('should create an external job application', async () => {
      const externalAppData = {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        applicationUrl: 'https://example.com/job/12345',
        cvDocumentId: testCvDocumentId,
        coverLetter: 'Applied through company website',
        appliedAt: new Date().toISOString(),
        notes: 'Applied via LinkedIn Easy Apply'
      };

      const response = await request(app)
        .post(`${baseUrl}/external`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(externalAppData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        jobTitle: externalAppData.jobTitle,
        companyName: externalAppData.companyName,
        status: 'submitted',
        isExternal: true,
        appliedAt: expect.any(String)
      });
    });

    it('should work with minimal required fields', async () => {
      const externalAppData = {
        jobTitle: 'Software Developer',
        companyName: 'StartupXYZ'
      };

      const response = await request(app)
        .post(`${baseUrl}/external`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(externalAppData)
        .expect(201);

      expect(response.body.isExternal).toBe(true);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post(`${baseUrl}/external`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobTitle: 'Engineer' })
        .expect(400);

      await request(app)
        .post(`${baseUrl}/external`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ companyName: 'Company' })
        .expect(400);
    });

    it('should validate field lengths', async () => {
      const externalAppData = {
        jobTitle: 'a'.repeat(201),
        companyName: 'Test Company'
      };

      await request(app)
        .post(`${baseUrl}/external`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(externalAppData)
        .expect(400);
    });

    it('should validate URL format', async () => {
      const externalAppData = {
        jobTitle: 'Developer',
        companyName: 'Company',
        applicationUrl: 'not-a-valid-url'
      };

      await request(app)
        .post(`${baseUrl}/external`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(externalAppData)
        .expect(400);
    });
  });

  describe('GET /applications/stats', () => {
    it('should return application statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalApplications: expect.any(Number),
        applicationsByStatus: expect.objectContaining({
          submitted: expect.any(Number),
          received: expect.any(Number),
          under_review: expect.any(Number),
          interview: expect.any(Number),
          rejected: expect.any(Number),
          offer: expect.any(Number),
          hired: expect.any(Number),
          withdrawn: expect.any(Number)
        }),
        responseRate: expect.any(Number),
        averageResponseTime: expect.any(Number),
        topRejectionReasons: expect.any(Array)
      });

      // Validate rejection reasons
      response.body.topRejectionReasons.forEach((reason: any) => {
        expect(reason).toMatchObject({
          reason: expect.any(String),
          count: expect.any(Number)
        });
      });
    });

    it('should filter statistics by period', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];

      for (const period of periods) {
        const response = await request(app)
          .get(`${baseUrl}/stats?period=${period}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.totalApplications).toBeDefined();
      }
    });

    it('should default to month period', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should return monthly stats by default
      expect(response.body).toBeDefined();
    });
  });

  describe('Application Status State Machine', () => {
    it('should enforce valid status transitions', async () => {
      // Test valid transitions
      const validTransitions = [
        { from: 'submitted', to: 'received' },
        { from: 'received', to: 'under_review' },
        { from: 'under_review', to: 'interview' },
        { from: 'interview', to: 'offer' },
        { from: 'offer', to: 'hired' }
      ];

      // Each transition should be validated by the API
      // This would be tested via employer endpoints for status updates
    });

    it('should prevent invalid status transitions', async () => {
      // Test invalid transitions
      const invalidTransitions = [
        { from: 'submitted', to: 'hired' },
        { from: 'rejected', to: 'interview' },
        { from: 'withdrawn', to: 'offer' }
      ];

      // These should return 400 errors
    });
  });

  describe('Rejection Feedback System', () => {
    it('should allow employers to add rejection feedback', async () => {
      const feedbackData = {
        applicationId: testApplicationId,
        tag: 'missing_skills',
        customReason: 'Lacking experience with React',
        isAnonymized: false
      };

      // This would be an employer endpoint
      const response = await request(app)
        .post(`${baseUrl}/${testApplicationId}/feedback`)
        .set('Authorization', `Bearer ${employerAuthToken}`)
        .send(feedbackData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        tag: feedbackData.tag,
        customReason: feedbackData.customReason,
        isAnonymized: feedbackData.isAnonymized
      });
    });

    it('should validate feedback tags', async () => {
      const feedbackData = {
        applicationId: testApplicationId,
        tag: 'invalid_tag',
        isAnonymized: true
      };

      await request(app)
        .post(`${baseUrl}/${testApplicationId}/feedback`)
        .set('Authorization', `Bearer ${employerAuthToken}`)
        .send(feedbackData)
        .expect(400);
    });

    it('should anonymize feedback when requested', async () => {
      const feedbackData = {
        applicationId: testApplicationId,
        tag: 'culture_fit',
        customReason: 'Team fit concerns',
        isAnonymized: true
      };

      const response = await request(app)
        .post(`${baseUrl}/${testApplicationId}/feedback`)
        .set('Authorization', `Bearer ${employerAuthToken}`)
        .send(feedbackData)
        .expect(201);

      // When candidate views this, certain details should be hidden
      const candidateView = await request(app)
        .get(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const feedback = candidateView.body.feedback.find((f: any) => f.id === response.body.id);
      expect(feedback.isAnonymized).toBe(true);
    });
  });

  describe('Privacy and Access Controls', () => {
    it('should prevent candidates from accessing employer-only endpoints', async () => {
      // Candidates should not be able to update application status
      await request(app)
        .patch(`${baseUrl}/${testApplicationId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'hired' })
        .expect(403);
    });

    it('should prevent employers from accessing candidate personal data without permission', async () => {
      // This depends on implementation details
      // Employers should see application data but not all candidate profile data
    });

    it('should hide sensitive employer data from candidates', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${testApplicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not include internal employer notes or scores
      expect(response.body).not.toHaveProperty('internalNotes');
      expect(response.body).not.toHaveProperty('candidateScore');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request body', async () => {
      await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid json}')
        .expect(400);
    });

    it('should handle invalid UUID parameters', async () => {
      await request(app)
        .get(`${baseUrl}/not-a-uuid`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle database errors gracefully', async () => {
      // This would test error handling when DB is unavailable
      // Implementation depends on being able to simulate DB errors
    });
  });
});