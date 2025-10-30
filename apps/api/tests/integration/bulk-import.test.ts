import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Note: This integration test assumes the API server is running
// In a complete setup, we would start the server programmatically

describe('Bulk Import Integration Tests', () => {
  const API_BASE_URL = process.env.API_URL || 'http://localhost:3011';
  let adminToken: string;
  
  beforeAll(async () => {
    // In a real test, we would authenticate as admin user
    // For now, this is a placeholder
    adminToken = 'admin-jwt-token';
  });

  describe('POST /api/v1/jobs/bulk-import', () => {
    const validBulkImportPayload = {
      jobs: [
        {
          title: 'Senior Software Engineer',
          description: 'We are looking for an experienced software engineer to join our growing team. You will work on exciting projects using cutting-edge technologies.',
          company_name: 'TechCorp Innovation Ltd',
          salary_min: 80000,
          salary_max: 120000,
          salary_currency: 'EUR',
          location_general: 'London, UK',
          remote_type: 'hybrid',
          employment_type: 'full-time',
          experience_level: 'senior',
          core_skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
          nice_to_have_skills: ['Docker', 'Kubernetes', 'AWS'],
          external_url: 'https://techcorp.com/careers/senior-engineer',
          source: 'scraped',
          source_id: 'techcorp_001',
          tags: ['tech', 'senior', 'javascript']
        },
        {
          title: 'Product Manager',
          description: 'Join our dynamic product team as a Product Manager. You will drive product strategy and work closely with engineering teams.',
          company_name: 'StartupCo Ltd',
          salary_min: 70000,
          salary_max: 95000,
          salary_currency: 'EUR',
          location_general: 'Berlin, Germany',
          remote_type: 'remote',
          employment_type: 'full-time',
          experience_level: 'mid',
          core_skills: ['Product Management', 'Agile', 'Scrum'],
          nice_to_have_skills: ['Technical Background', 'Data Analysis'],
          external_url: 'https://startupco.com/jobs/product-manager',
          source: 'scraped',
          source_id: 'startupco_002',
          tags: ['product', 'remote', 'agile']
        }
      ],
      source_name: 'TechJobs Weekly Scraper',
      import_note: 'Weekly automated import from TechJobs API',
      auto_publish: false,
      deduplicate: true
    };

    it('should successfully import valid jobs with admin authentication', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBulkImportPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        imported_count: 2,
        skipped_count: 0,
        failed_count: 0,
        status: 'completed'
      });
      expect(response.body.data.jobs_created).toHaveLength(2);
      expect(response.body.data.import_id).toBeDefined();
      expect(response.body.message).toContain('Successfully imported 2 jobs');
    });

    it('should reject bulk import without admin authentication', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .send(validBulkImportPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authentication');
    });

    it('should reject bulk import with invalid role', async () => {
      const employerToken = 'employer-jwt-token'; // Mock employer token
      
      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${employerToken}`)
        .send(validBulkImportPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('admin');
    });

    it('should validate job schema and reject invalid jobs', async () => {
      const invalidPayload = {
        ...validBulkImportPayload,
        jobs: [
          {
            title: 'A', // Too short
            description: 'Short', // Too short
            company_name: '', // Required
            salary_min: -1000, // Invalid
            salary_max: 50000
          }
        ]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('should handle auto_publish option correctly', async () => {
      const autoPublishPayload = {
        ...validBulkImportPayload,
        auto_publish: true,
        jobs: [validBulkImportPayload.jobs[0]] // Single job for this test
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(autoPublishPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs_created[0].status).toBe('active');
    });

    it('should enforce maximum job limit', async () => {
      // Create a payload with 1001 jobs (exceeding limit)
      const largePayload = {
        ...validBulkImportPayload,
        jobs: Array(1001).fill(validBulkImportPayload.jobs[0])
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largePayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many jobs');
    });

    it('should handle deduplication correctly', async () => {
      // First import
      await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBulkImportPayload)
        .expect(201);

      // Second import with same source_ids should skip duplicates
      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validBulkImportPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.data.imported_count).toBe(0);
      expect(response.body.data.skipped_count).toBe(2);
      expect(response.body.data.status).toBe('no_changes');
    });

    it('should handle partial failures gracefully', async () => {
      const mixedPayload = {
        ...validBulkImportPayload,
        jobs: [
          validBulkImportPayload.jobs[0], // Valid job
          {
            title: 'Invalid Job',
            description: 'Bad', // Too short
            company_name: '',   // Required
            salary_min: -1000   // Invalid
          }
        ]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mixedPayload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.data.imported_count).toBe(1);
      expect(response.body.data.failed_count).toBe(1);
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.status).toBe('completed');
    });
  });

  describe('GET /api/v1/jobs/import-history', () => {
    it('should return import history with pagination', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/jobs/import-history')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('imports');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
    });

    it('should reject non-admin users', async () => {
      const employerToken = 'employer-jwt-token';
      
      const response = await request(API_BASE_URL)
        .get('/api/v1/jobs/import-history')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Quality and Validation', () => {
    it('should validate company names and normalize them', async () => {
      const payload = {
        ...validBulkImportPayload,
        jobs: [{
          ...validBulkImportPayload.jobs[0],
          company_name: '  TechCorp Ltd  ', // Extra whitespace
        }]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data.imported_count).toBe(1);
    });

    it('should validate salary ranges correctly', async () => {
      const invalidSalaryPayload = {
        ...validBulkImportPayload,
        jobs: [{
          ...validBulkImportPayload.jobs[0],
          salary_min: 100000,
          salary_max: 80000 // Max less than min
        }]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSalaryPayload)
        .expect(201);

      expect(response.body.data.failed_count).toBe(1);
      expect(response.body.data.errors[0]).toContain('salary');
    });

    it('should validate external URLs', async () => {
      const invalidUrlPayload = {
        ...validBulkImportPayload,
        jobs: [{
          ...validBulkImportPayload.jobs[0],
          external_url: 'not-a-valid-url'
        }]
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUrlPayload)
        .expect(201);

      expect(response.body.data.failed_count).toBe(1);
      expect(response.body.data.errors[0]).toContain('URL');
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should handle reasonable bulk size efficiently', async () => {
      const largeBatch = {
        ...validBulkImportPayload,
        jobs: Array(100).fill(null).map((_, index) => ({
          ...validBulkImportPayload.jobs[0],
          title: `Job ${index + 1}`,
          source_id: `batch_test_${index + 1}`
        }))
      };

      const startTime = Date.now();
      
      const response = await request(API_BASE_URL)
        .post('/api/v1/jobs/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeBatch)
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.data.imported_count).toBe(100);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});