import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

// Mock the actual application modules since these are contract tests
jest.mock('@openrole/database');
jest.mock('@openrole/validation');

// Mock Hono app - we'll need to create this once the actual implementation exists
const mockApp = {
  request: jest.fn()
};

// Mock JWT token for authentication
const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NGY5YzU4ZS1lYjY5LTQ5YzMtOGZiYS1hMjU2YjFmNmVjMjQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3MzAwMDAwMDB9.test-signature';

// Mock UUIDs for consistent testing
const mockUserId = '54f9c58e-eb69-49c3-8fba-a256b1f6ec24';
const mockProfileId = 'a1b2c3d4-5e6f-7890-1234-567890abcdef';
const mockCvId = 'b1c2d3e4-6f78-9012-3456-789012bcdefg';
const mockTemplateId = 'c2d3e4f5-7890-1234-5678-90123cdefghi';
const mockPortfolioId = 'd3e4f5g6-8901-2345-6789-01234defghij';
const mockAccessToken = 'e4f5g6h7-9012-3456-7890-12345efghijk';

// Schema validation helpers
const validateUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const validateISODate = (value: string): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
};

const validateDate = (value: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(value) && !isNaN(Date.parse(value));
};

const validateURL = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const validateMimeType = (value: string): boolean => {
  const validMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return validMimeTypes.includes(value);
};

const validateHexColor = (value: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
};

// Expected response schemas
const cvDocumentSchema = {
  id: expect.any(String),
  profileId: expect.any(String),
  filename: expect.any(String),
  originalFilename: expect.any(String),
  fileSize: expect.any(Number),
  mimeType: expect.any(String),
  version: expect.any(Number),
  label: expect.any(String),
  isDefault: expect.any(Boolean),
  generatedFromProfile: expect.any(Boolean),
  templateUsed: expect.stringMatching(/.*/), // Can be null
  generatedAt: expect.stringMatching(/.*/), // Can be null
  accessToken: expect.any(String),
  tokenExpiresAt: expect.any(String),
  virusScanned: expect.any(Boolean),
  scanResults: expect.any(String),
  status: expect.stringMatching(/^(processing|active|archived|failed)$/),
  downloadCount: expect.any(Number),
  lastAccessedAt: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
};

const cvTemplateSchema = {
  id: expect.any(String),
  name: expect.any(String),
  description: expect.any(String),
  category: expect.stringMatching(/^(ats-safe|modern|classic|creative)$/),
  previewImage: expect.any(String),
  isAccessible: expect.any(Boolean),
  supportsSections: expect.any(Array),
  isActive: expect.any(Boolean),
  isPremium: expect.any(Boolean),
  usageCount: expect.any(Number),
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
};

const portfolioItemSchema = {
  id: expect.any(String),
  profileId: expect.any(String),
  title: expect.any(String),
  description: expect.any(String),
  type: expect.stringMatching(/^(project|article|design|code|document|link)$/),
  fileName: expect.stringMatching(/.*/), // Can be null
  filePath: expect.stringMatching(/.*/), // Can be null
  fileSize: expect.any(Number),
  mimeType: expect.stringMatching(/.*/), // Can be null
  externalUrl: expect.stringMatching(/.*/), // Can be null
  technologies: expect.any(Array),
  projectDate: expect.any(String),
  role: expect.any(String),
  linkValidated: expect.any(Boolean),
  lastValidationCheck: expect.any(String),
  validationStatus: expect.stringMatching(/^(pending|valid|invalid|unreachable)$/),
  sortOrder: expect.any(Number),
  isPublic: expect.any(Boolean),
  viewCount: expect.any(Number),
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
};

const errorSchema = {
  error: expect.any(String),
  message: expect.any(String),
  code: expect.any(String),
  timestamp: expect.any(String)
};

const validationErrorSchema = {
  error: expect.any(String),
  message: expect.any(String),
  code: expect.any(String),
  details: expect.any(Array),
  timestamp: expect.any(String)
};

describe('CV API Contract Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Since these are contract tests, we'll expect the app to not exist yet
    // This will cause the tests to fail initially as intended
    try {
      // This import will fail until the actual implementation exists
      const { app: actualApp } = await import('../../src/index');
      app = actualApp;
    } catch (error) {
      // Expected to fail initially - log for clarity
      console.log('Expected failure: CV API implementation not yet available');
      throw new Error('CV API implementation not found - contract tests should fail until implementation exists');
    }
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /v1/cv - Get All CV Documents', () => {
    it('should return all CV documents for authenticated user with 200', async () => {
      const response = await request(app)
        .get('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        cvDocuments: expect.any(Array),
        totalCount: expect.any(Number)
      });

      if (response.body.cvDocuments.length > 0) {
        response.body.cvDocuments.forEach((cv: any) => {
          expect(cv).toMatchObject(cvDocumentSchema);
          expect(validateUUID(cv.id)).toBe(true);
          expect(validateUUID(cv.profileId)).toBe(true);
          expect(validateUUID(cv.accessToken)).toBe(true);
          expect(validateMimeType(cv.mimeType)).toBe(true);
          expect(validateISODate(cv.createdAt)).toBe(true);
          expect(validateISODate(cv.updatedAt)).toBe(true);
          expect(validateISODate(cv.tokenExpiresAt)).toBe(true);
          expect(cv.fileSize).toBeGreaterThan(0);
          expect(cv.version).toBeGreaterThan(0);
        });
      }
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/v1/cv')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
      expect(validateISODate(response.body.timestamp)).toBe(true);
    });
  });

  describe('POST /v1/cv - Upload CV Document', () => {
    const mockPdfBuffer = Buffer.from('Mock PDF content for testing');
    
    it('should upload CV with valid multipart data and return 201', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'test-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', 'Software Engineer CV')
        .field('isDefault', 'true')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(response.body.label).toBe('Software Engineer CV');
      expect(response.body.isDefault).toBe(true);
      expect(response.body.generatedFromProfile).toBe(false);
      expect(response.body.mimeType).toBe('application/pdf');
      expect(response.body.originalFilename).toBe('test-cv.pdf');
    });

    it('should upload CV with minimal data (no isDefault) and return 201', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'minimal-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', 'Basic CV')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.isDefault).toBe(false); // Default value
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'test-cv.pdf',
          contentType: 'application/pdf'
        })
        // Missing required 'label' field
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(validateISODate(response.body.timestamp)).toBe(true);
    });

    it('should return 400 for missing file', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .field('label', 'CV without file')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .attach('file', mockPdfBuffer, {
          filename: 'test-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', 'Test CV')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 413 for file too large (over 10MB)', async () => {
      const largeMockBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', largeMockBuffer, {
          filename: 'large-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', 'Large CV')
        .expect('Content-Type', /json/)
        .expect(413);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FILE_TOO_LARGE');
      expect(response.body.message).toContain('10MB');
    });

    it('should return 422 for invalid MIME type', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', Buffer.from('fake image'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        })
        .field('label', 'Invalid CV')
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'file')).toBe(true);
    });

    it('should return 422 for validation errors with field details', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'test-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', '') // Empty label
        .field('isDefault', 'invalid-boolean')
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
      
      // Check that each detail has required fields
      response.body.details.forEach((detail: any) => {
        expect(detail).toHaveProperty('field');
        expect(detail).toHaveProperty('message');
        expect(detail).toHaveProperty('code');
      });
    });
  });

  describe('GET /v1/cv/{cvId} - Get CV Document Details', () => {
    it('should return CV document details with 200', async () => {
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(response.body.id).toBe(mockCvId);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/v1/cv/invalid-uuid')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('UUID');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .get(`/v1/cv/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /v1/cv/{cvId} - Update CV Document Metadata', () => {
    const validUpdateRequest = {
      label: 'Updated Senior Developer CV',
      isDefault: true
    };

    it('should update CV metadata with valid data and return 200', async () => {
      const response = await request(app)
        .put(`/v1/cv/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(validUpdateRequest.label);
      expect(response.body.isDefault).toBe(validUpdateRequest.isDefault);
      expect(validateISODate(response.body.updatedAt)).toBe(true);
    });

    it('should update only label field and return 200', async () => {
      const partialUpdate = {
        label: 'Partially Updated CV'
      };

      const response = await request(app)
        .put(`/v1/cv/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(partialUpdate)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(partialUpdate.label);
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {
        label: 123, // Should be string
        isDefault: 'not-boolean'
      };

      const response = await request(app)
        .put(`/v1/cv/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put(`/v1/cv/${mockCvId}`)
        .send(validUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .put(`/v1/cv/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 422 for validation errors', async () => {
      const invalidRequest = {
        label: '', // Too short
        isDefault: 'invalid'
      };

      const response = await request(app)
        .put(`/v1/cv/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });
  });

  describe('DELETE /v1/cv/{cvId} - Delete CV Document', () => {
    it('should delete CV document and return 204', async () => {
      await request(app)
        .delete(`/v1/cv/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(204);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete(`/v1/cv/${mockCvId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .delete(`/v1/cv/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 409 for CV being used in active applications', async () => {
      // Mock a CV that's actively being used
      const activeApplicationCvId = 'active-cv-id-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .delete(`/v1/cv/${activeApplicationCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('active applications');
    });
  });

  describe('GET /v1/cv/{cvId}/download - Download CV File', () => {
    it('should download PDF file with valid access token and return 200', async () => {
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .query({ token: mockAccessToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=/);
      expect(response.headers['content-length']).toBeDefined();
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should download DOCX file with valid access token and return 200', async () => {
      // Test downloading a different file type
      const docxCvId = 'docx-cv-id-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .get(`/v1/cv/${docxCvId}/download`)
        .query({ token: mockAccessToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=.*\.docx/);
    });

    it('should return 400 for missing access token', async () => {
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('token');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .query({ token: mockAccessToken })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for invalid access token', async () => {
      const invalidToken = 'invalid-token-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .query({ token: invalidToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(response.body.message).toContain('token');
    });

    it('should return 403 for expired access token', async () => {
      const expiredToken = 'expired-token-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .query({ token: expiredToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('expired');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .get(`/v1/cv/${nonExistentId}/download`)
        .query({ token: mockAccessToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /v1/cv/{cvId}/access-token - Generate Access Token', () => {
    const validTokenRequest = {
      expiresInHours: 24
    };

    it('should generate access token with default expiration and return 200', async () => {
      const response = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validTokenRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        expiresAt: expect.any(String),
        downloadUrl: expect.any(String)
      });
      
      expect(validateUUID(response.body.accessToken)).toBe(true);
      expect(validateISODate(response.body.expiresAt)).toBe(true);
      expect(validateURL(response.body.downloadUrl)).toBe(true);
      expect(response.body.downloadUrl).toContain(`/v1/cv/${mockCvId}/download`);
      expect(response.body.downloadUrl).toContain(`token=${response.body.accessToken}`);
    });

    it('should generate access token with custom expiration and return 200', async () => {
      const customExpirationRequest = {
        expiresInHours: 72 // 3 days
      };

      const response = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(customExpirationRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        expiresAt: expect.any(String),
        downloadUrl: expect.any(String)
      });
      
      // Verify expiration is approximately 72 hours from now
      const expirationDate = new Date(response.body.expiresAt);
      const expectedExpiration = new Date(Date.now() + (72 * 60 * 60 * 1000));
      const timeDiff = Math.abs(expirationDate.getTime() - expectedExpiration.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute tolerance
    });

    it('should generate access token with no body (default values) and return 200', async () => {
      const response = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        expiresAt: expect.any(String),
        downloadUrl: expect.any(String)
      });
    });

    it('should return 400 for invalid expiration hours (too low)', async () => {
      const invalidRequest = {
        expiresInHours: 0 // Below minimum of 1
      };

      const response = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('minimum');
    });

    it('should return 400 for invalid expiration hours (too high)', async () => {
      const invalidRequest = {
        expiresInHours: 200 // Above maximum of 168 (7 days)
      };

      const response = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('maximum');
      expect(response.body.message).toContain('168');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .send(validTokenRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .post(`/v1/cv/${nonExistentId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validTokenRequest)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /v1/cv/generate - Generate CV from Profile', () => {
    const validGenerationRequest = {
      templateId: mockTemplateId,
      label: 'Generated Software Engineer CV',
      isDefault: false,
      sections: {
        includePersonalDetails: true,
        includeWorkExperience: true,
        includeEducation: true,
        includeSkills: true,
        includePortfolio: false,
        customSections: [
          {
            title: 'Certifications',
            content: 'AWS Certified Solutions Architect',
            order: 5
          }
        ]
      },
      customizations: {
        primaryColor: '#2563eb',
        fontSize: 'medium',
        showPhoto: false
      }
    };

    it('should start CV generation with valid data and return 202', async () => {
      const response = await request(app)
        .post('/v1/cv/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validGenerationRequest)
        .expect('Content-Type', /json/)
        .expect(202);

      expect(response.body).toMatchObject({
        cvId: expect.any(String),
        status: 'processing',
        estimatedCompletionTime: expect.any(String),
        message: expect.any(String)
      });
      
      expect(validateUUID(response.body.cvId)).toBe(true);
      expect(validateISODate(response.body.estimatedCompletionTime)).toBe(true);
      expect(response.body.message).toContain('generation started');
    });

    it('should generate CV with minimal required data and return 202', async () => {
      const minimalRequest = {
        templateId: mockTemplateId,
        label: 'Minimal Generated CV'
      };

      const response = await request(app)
        .post('/v1/cv/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(minimalRequest)
        .expect('Content-Type', /json/)
        .expect(202);

      expect(response.body).toMatchObject({
        cvId: expect.any(String),
        status: 'processing',
        estimatedCompletionTime: expect.any(String),
        message: expect.any(String)
      });
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRequest = {
        label: 'Missing template ID'
        // Missing templateId
      };

      const response = await request(app)
        .post('/v1/cv/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/cv/generate')
        .send(validGenerationRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 422 for validation errors with detailed field errors', async () => {
      const invalidRequest = {
        templateId: 'invalid-uuid',
        label: '', // Empty label
        sections: {
          customSections: [
            {
              title: '', // Empty title
              content: 'Some content',
              order: -1 // Invalid order
            }
          ]
        },
        customizations: {
          primaryColor: 'invalid-color', // Invalid hex color
          fontSize: 'invalid-size', // Invalid enum value
          showPhoto: 'not-boolean'
        }
      };

      const response = await request(app)
        .post('/v1/cv/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
      
      // Check that specific validation errors are present
      const fieldErrors = response.body.details.map((d: any) => d.field);
      expect(fieldErrors).toContain('templateId');
      expect(fieldErrors).toContain('label');
    });
  });

  describe('GET /v1/cv/templates - Get Available CV Templates', () => {
    it('should return all available templates with 200', async () => {
      const response = await request(app)
        .get('/v1/cv/templates')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        templates: expect.any(Array)
      });

      if (response.body.templates.length > 0) {
        response.body.templates.forEach((template: any) => {
          expect(template).toMatchObject(cvTemplateSchema);
          expect(validateUUID(template.id)).toBe(true);
          expect(['ats-safe', 'modern', 'classic', 'creative']).toContain(template.category);
          expect(validateURL(template.previewImage)).toBe(true);
          expect(template.supportsSections).toBeInstanceOf(Array);
          expect(validateISODate(template.createdAt)).toBe(true);
          expect(validateISODate(template.updatedAt)).toBe(true);
        });
      }
    });

    it('should filter templates by category and return 200', async () => {
      const response = await request(app)
        .get('/v1/cv/templates')
        .query({ category: 'modern' })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.templates).toBeInstanceOf(Array);
      
      if (response.body.templates.length > 0) {
        response.body.templates.forEach((template: any) => {
          expect(template.category).toBe('modern');
        });
      }
    });

    it('should include preview images when requested and return 200', async () => {
      const response = await request(app)
        .get('/v1/cv/templates')
        .query({ includePreview: 'true' })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.templates).toBeInstanceOf(Array);
      
      if (response.body.templates.length > 0) {
        response.body.templates.forEach((template: any) => {
          expect(template.previewImage).toBeDefined();
          expect(validateURL(template.previewImage)).toBe(true);
        });
      }
    });

    it('should return 400 for invalid category filter', async () => {
      const response = await request(app)
        .get('/v1/cv/templates')
        .query({ category: 'invalid-category' })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('category');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/v1/cv/templates')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /v1/cv/generate/preview - Preview CV Generation', () => {
    const validPreviewRequest = {
      templateId: mockTemplateId,
      label: 'Preview CV',
      sections: {
        includePersonalDetails: true,
        includeWorkExperience: true,
        includeEducation: false,
        includeSkills: true,
        includePortfolio: true
      },
      customizations: {
        primaryColor: '#2563eb',
        fontSize: 'large',
        showPhoto: true
      }
    };

    it('should generate CV preview with valid data and return 200', async () => {
      const response = await request(app)
        .post('/v1/cv/generate/preview')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validPreviewRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        previewHtml: expect.any(String),
        previewUrl: expect.any(String),
        expiresAt: expect.any(String)
      });
      
      expect(response.body.previewHtml.length).toBeGreaterThan(0);
      expect(validateURL(response.body.previewUrl)).toBe(true);
      expect(validateISODate(response.body.expiresAt)).toBe(true);
      
      // Verify preview URL contains expected path structure
      expect(response.body.previewUrl).toContain('/preview/');
    });

    it('should generate preview with minimal data and return 200', async () => {
      const minimalPreviewRequest = {
        templateId: mockTemplateId,
        label: 'Minimal Preview'
      };

      const response = await request(app)
        .post('/v1/cv/generate/preview')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(minimalPreviewRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        previewHtml: expect.any(String),
        previewUrl: expect.any(String),
        expiresAt: expect.any(String)
      });
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRequest = {
        label: 'Missing template ID'
        // Missing templateId
      };

      const response = await request(app)
        .post('/v1/cv/generate/preview')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/cv/generate/preview')
        .send(validPreviewRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 422 for validation errors', async () => {
      const invalidRequest = {
        templateId: 'invalid-uuid',
        label: '', // Empty label
        customizations: {
          primaryColor: 'invalid-color',
          fontSize: 'invalid-size'
        }
      };

      const response = await request(app)
        .post('/v1/cv/generate/preview')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'templateId')).toBe(true);
    });
  });

  describe('Portfolio Management Endpoints', () => {
    describe('GET /v1/portfolio - Get Portfolio Items', () => {
      it('should return all portfolio items with 200', async () => {
        const response = await request(app)
          .get('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject({
          portfolioItems: expect.any(Array)
        });

        if (response.body.portfolioItems.length > 0) {
          response.body.portfolioItems.forEach((item: any) => {
            expect(item).toMatchObject(portfolioItemSchema);
            expect(validateUUID(item.id)).toBe(true);
            expect(validateUUID(item.profileId)).toBe(true);
            expect(['project', 'article', 'design', 'code', 'document', 'link']).toContain(item.type);
            expect(validateDate(item.projectDate)).toBe(true);
            expect(['pending', 'valid', 'invalid', 'unreachable']).toContain(item.validationStatus);
            expect(validateISODate(item.createdAt)).toBe(true);
            expect(validateISODate(item.updatedAt)).toBe(true);
          });
        }
      });

      it('should filter portfolio items by type and return 200', async () => {
        const response = await request(app)
          .get('/v1/portfolio')
          .query({ type: 'project' })
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.portfolioItems).toBeInstanceOf(Array);
        
        if (response.body.portfolioItems.length > 0) {
          response.body.portfolioItems.forEach((item: any) => {
            expect(item.type).toBe('project');
          });
        }
      });

      it('should filter portfolio items by visibility and return 200', async () => {
        const response = await request(app)
          .get('/v1/portfolio')
          .query({ isPublic: 'true' })
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body.portfolioItems).toBeInstanceOf(Array);
        
        if (response.body.portfolioItems.length > 0) {
          response.body.portfolioItems.forEach((item: any) => {
            expect(item.isPublic).toBe(true);
          });
        }
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get('/v1/portfolio')
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('UNAUTHORIZED');
      });
    });

    describe('POST /v1/portfolio - Add Portfolio Item', () => {
      const mockFileBuffer = Buffer.from('Mock portfolio file content');

      it('should add portfolio item with file upload and return 201', async () => {
        const response = await request(app)
          .post('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .attach('file', mockFileBuffer, {
            filename: 'portfolio-project.pdf',
            contentType: 'application/pdf'
          })
          .field('title', 'E-commerce Platform Redesign')
          .field('description', 'Complete redesign of checkout flow resulting in 25% conversion increase')
          .field('type', 'project')
          .field('technologies', JSON.stringify(['React', 'TypeScript', 'Node.js']))
          .field('projectDate', '2023-06-15')
          .field('role', 'Lead Frontend Developer')
          .field('isPublic', 'true')
          .field('sortOrder', '1')
          .expect('Content-Type', /json/)
          .expect(201);

        expect(response.body).toMatchObject(portfolioItemSchema);
        expect(response.body.title).toBe('E-commerce Platform Redesign');
        expect(response.body.type).toBe('project');
        expect(response.body.technologies).toEqual(['React', 'TypeScript', 'Node.js']);
        expect(response.body.fileName).toBe('portfolio-project.pdf');
        expect(response.body.isPublic).toBe(true);
      });

      it('should add portfolio item with external URL (no file) and return 201', async () => {
        const response = await request(app)
          .post('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .field('title', 'GitHub Repository')
          .field('description', 'Open source project with 500+ stars')
          .field('type', 'code')
          .field('externalUrl', 'https://github.com/johndoe/awesome-project')
          .field('technologies', JSON.stringify(['Python', 'Flask', 'Docker']))
          .field('projectDate', '2023-08-01')
          .field('role', 'Creator')
          .field('isPublic', 'true')
          .expect('Content-Type', /json/)
          .expect(201);

        expect(response.body).toMatchObject(portfolioItemSchema);
        expect(response.body.type).toBe('code');
        expect(response.body.externalUrl).toBe('https://github.com/johndoe/awesome-project');
        expect(response.body.fileName).toBeNull();
      });

      it('should add portfolio item with minimal required data and return 201', async () => {
        const response = await request(app)
          .post('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .field('title', 'Minimal Portfolio Item')
          .field('description', 'This is a minimal portfolio item for testing')
          .field('type', 'article')
          .expect('Content-Type', /json/)
          .expect(201);

        expect(response.body).toMatchObject(portfolioItemSchema);
        expect(response.body.isPublic).toBe(true); // Default value
      });

      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .field('title', 'Missing description and type')
          // Missing description and type
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(errorSchema);
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post('/v1/portfolio')
          .field('title', 'Test Portfolio')
          .field('description', 'Test description')
          .field('type', 'project')
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('UNAUTHORIZED');
      });

      it('should return 413 for file too large', async () => {
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

        const response = await request(app)
          .post('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .attach('file', largeBuffer, {
            filename: 'large-portfolio.pdf',
            contentType: 'application/pdf'
          })
          .field('title', 'Large Portfolio Item')
          .field('description', 'Portfolio item with large file')
          .field('type', 'document')
          .expect('Content-Type', /json/)
          .expect(413);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('FILE_TOO_LARGE');
      });

      it('should return 422 for validation errors', async () => {
        const response = await request(app)
          .post('/v1/portfolio')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .field('title', '') // Empty title
          .field('description', 'x'.repeat(1001)) // Too long description
          .field('type', 'invalid-type') // Invalid enum value
          .field('externalUrl', 'not-a-url') // Invalid URL
          .field('projectDate', 'invalid-date') // Invalid date
          .field('isPublic', 'not-boolean') // Invalid boolean
          .expect('Content-Type', /json/)
          .expect(422);

        expect(response.body).toMatchObject(validationErrorSchema);
        expect(response.body.details.length).toBeGreaterThan(0);
        
        const fieldErrors = response.body.details.map((d: any) => d.field);
        expect(fieldErrors).toContain('title');
        expect(fieldErrors).toContain('type');
      });
    });

    describe('GET /v1/portfolio/{portfolioId} - Get Portfolio Item Details', () => {
      it('should return portfolio item details with 200', async () => {
        const response = await request(app)
          .get(`/v1/portfolio/${mockPortfolioId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject(portfolioItemSchema);
        expect(validateUUID(response.body.id)).toBe(true);
        expect(response.body.id).toBe(mockPortfolioId);
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get(`/v1/portfolio/${mockPortfolioId}`)
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('UNAUTHORIZED');
      });

      it('should return 404 for non-existent portfolio item', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .get(`/v1/portfolio/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('NOT_FOUND');
      });
    });

    describe('PUT /v1/portfolio/{portfolioId} - Update Portfolio Item', () => {
      const validUpdateRequest = {
        title: 'Updated Portfolio Item Title',
        description: 'Updated description with more details',
        externalUrl: 'https://updated-example.com',
        technologies: ['Updated', 'Technologies', 'List'],
        projectDate: '2023-09-15',
        role: 'Updated Role',
        isPublic: false,
        sortOrder: 5
      };

      it('should update portfolio item with valid data and return 200', async () => {
        const response = await request(app)
          .put(`/v1/portfolio/${mockPortfolioId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(validUpdateRequest)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject(portfolioItemSchema);
        expect(response.body.title).toBe(validUpdateRequest.title);
        expect(response.body.description).toBe(validUpdateRequest.description);
        expect(response.body.technologies).toEqual(validUpdateRequest.technologies);
        expect(response.body.isPublic).toBe(validUpdateRequest.isPublic);
      });

      it('should update partial portfolio item data and return 200', async () => {
        const partialUpdate = {
          title: 'Partially Updated Title',
          isPublic: true
        };

        const response = await request(app)
          .put(`/v1/portfolio/${mockPortfolioId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(partialUpdate)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject(portfolioItemSchema);
        expect(response.body.title).toBe(partialUpdate.title);
        expect(response.body.isPublic).toBe(partialUpdate.isPublic);
      });

      it('should return 400 for invalid request data', async () => {
        const invalidRequest = {
          title: 123, // Should be string
          isPublic: 'not-boolean'
        };

        const response = await request(app)
          .put(`/v1/portfolio/${mockPortfolioId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(invalidRequest)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(errorSchema);
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .put(`/v1/portfolio/${mockPortfolioId}`)
          .send(validUpdateRequest)
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('UNAUTHORIZED');
      });

      it('should return 404 for non-existent portfolio item', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .put(`/v1/portfolio/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(validUpdateRequest)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('NOT_FOUND');
      });

      it('should return 422 for validation errors', async () => {
        const invalidRequest = {
          title: '', // Empty title
          description: 'x'.repeat(1001), // Too long
          externalUrl: 'invalid-url',
          projectDate: 'invalid-date'
        };

        const response = await request(app)
          .put(`/v1/portfolio/${mockPortfolioId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(invalidRequest)
          .expect('Content-Type', /json/)
          .expect(422);

        expect(response.body).toMatchObject(validationErrorSchema);
      });
    });

    describe('DELETE /v1/portfolio/{portfolioId} - Delete Portfolio Item', () => {
      it('should delete portfolio item and return 204', async () => {
        await request(app)
          .delete(`/v1/portfolio/${mockPortfolioId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect(204);
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .delete(`/v1/portfolio/${mockPortfolioId}`)
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('UNAUTHORIZED');
      });

      it('should return 404 for non-existent portfolio item', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .delete(`/v1/portfolio/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
        expect(response.body.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Response Schema Validation', () => {
    it('should validate that all string dates are in correct format', async () => {
      // Test ISO date validation
      expect(validateISODate('2024-01-15T10:30:00.000Z')).toBe(true);
      expect(validateISODate('2024-01-15T10:30:00Z')).toBe(true);
      expect(validateISODate('2024-01-15')).toBe(false);
      expect(validateISODate('invalid-date')).toBe(false);

      // Test date validation
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-1-1')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
    });

    it('should validate UUIDs correctly', async () => {
      expect(validateUUID('54f9c58e-eb69-49c3-8fba-a256b1f6ec24')).toBe(true);
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('54f9c58e-eb69-49c3-8fba')).toBe(false);
      expect(validateUUID('')).toBe(false);
    });

    it('should validate URLs correctly', async () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('https://github.com/user/repo')).toBe(true);
      expect(validateURL('invalid-url')).toBe(false);
      expect(validateURL('')).toBe(false);
      expect(validateURL('ftp://example.com')).toBe(true); // Valid URL protocol
    });

    it('should validate MIME types correctly', async () => {
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateMimeType('application/msword')).toBe(true);
      expect(validateMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(validateMimeType('image/jpeg')).toBe(false);
      expect(validateMimeType('text/plain')).toBe(false);
      expect(validateMimeType('')).toBe(false);
    });

    it('should validate hex colors correctly', async () => {
      expect(validateHexColor('#2563eb')).toBe(true);
      expect(validateHexColor('#ffffff')).toBe(true);
      expect(validateHexColor('#000000')).toBe(true);
      expect(validateHexColor('#ABC123')).toBe(true);
      expect(validateHexColor('2563eb')).toBe(false); // Missing #
      expect(validateHexColor('#2563')).toBe(false); // Too short
      expect(validateHexColor('#2563ebff')).toBe(false); // Too long
      expect(validateHexColor('#invalid')).toBe(false); // Invalid characters
    });
  });

  describe('Error Response Standards', () => {
    it('should return consistent error structure for all error responses', async () => {
      // Test that all error responses follow the same structure
      const errorTests = [
        { method: 'get', path: '/v1/cv', expectedStatus: 401 },
        { method: 'post', path: '/v1/cv', expectedStatus: 401 },
        { method: 'get', path: `/v1/cv/${mockCvId}`, expectedStatus: 401 },
        { method: 'put', path: `/v1/cv/${mockCvId}`, expectedStatus: 401 },
        { method: 'delete', path: `/v1/cv/${mockCvId}`, expectedStatus: 401 },
        { method: 'get', path: `/v1/cv/${mockCvId}/download`, expectedStatus: 401 },
        { method: 'post', path: `/v1/cv/${mockCvId}/access-token`, expectedStatus: 401 },
        { method: 'post', path: '/v1/cv/generate', expectedStatus: 401 },
        { method: 'get', path: '/v1/cv/templates', expectedStatus: 401 },
        { method: 'post', path: '/v1/cv/generate/preview', expectedStatus: 401 },
        { method: 'get', path: '/v1/portfolio', expectedStatus: 401 },
        { method: 'post', path: '/v1/portfolio', expectedStatus: 401 }
      ];

      for (const test of errorTests) {
        const response = await request(app)[test.method](test.path)
          .expect('Content-Type', /json/)
          .expect(test.expectedStatus);

        expect(response.body).toMatchObject(errorSchema);
        expect(validateISODate(response.body.timestamp)).toBe(true);
        expect(response.body.code).toBe('UNAUTHORIZED');
      }
    });

    it('should return validation error structure for 422 responses', async () => {
      // Test validation error responses for endpoints that support them
      const validationErrorTests = [
        {
          method: 'post',
          path: '/v1/cv',
          data: { label: '' }, // Invalid data to trigger validation error
          contentType: 'multipart/form-data'
        },
        {
          method: 'post',
          path: '/v1/cv/generate',
          data: { templateId: 'invalid', label: '' },
          contentType: 'application/json'
        },
        {
          method: 'post',
          path: '/v1/cv/generate/preview',
          data: { templateId: 'invalid', label: '' },
          contentType: 'application/json'
        }
      ];

      for (const test of validationErrorTests) {
        let request_builder = request(app)[test.method](test.path)
          .set('Authorization', `Bearer ${mockJwtToken}`);

        if (test.contentType === 'application/json') {
          request_builder = request_builder.send(test.data);
        } else {
          // For multipart/form-data, we'll just send the field
          request_builder = request_builder.field('label', '');
        }

        const response = await request_builder
          .expect('Content-Type', /json/)
          .expect(422);

        expect(response.body).toMatchObject(validationErrorSchema);
        expect(response.body.details).toBeInstanceOf(Array);
        expect(validateISODate(response.body.timestamp)).toBe(true);
      }
    });
  });

  describe('File Upload Security Tests', () => {
    it('should reject executable files', async () => {
      const executableBuffer = Buffer.from('Fake executable content');

      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', executableBuffer, {
          filename: 'malicious.exe',
          contentType: 'application/octet-stream'
        })
        .field('label', 'Malicious CV')
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'file')).toBe(true);
    });

    it('should validate file extension matches MIME type', async () => {
      const response = await request(app)
        .post('/v1/cv')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', Buffer.from('PDF content'), {
          filename: 'document.txt', // Wrong extension for PDF MIME type
          contentType: 'application/pdf'
        })
        .field('label', 'Mismatched Extension CV')
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
    });
  });

  describe('Access Token Security Tests', () => {
    it('should not accept expired tokens for download', async () => {
      const expiredToken = 'expired-token-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .query({ token: expiredToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(response.body.message).toContain('expired');
    });

    it('should not accept malformed tokens', async () => {
      const malformedToken = 'not-a-uuid-token';
      
      const response = await request(app)
        .get(`/v1/cv/${mockCvId}/download`)
        .query({ token: malformedToken })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('should generate unique access tokens for each request', async () => {
      const tokenRequest = { expiresInHours: 24 };

      const response1 = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(tokenRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      const response2 = await request(app)
        .post(`/v1/cv/${mockCvId}/access-token`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(tokenRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response1.body.accessToken).not.toBe(response2.body.accessToken);
      expect(validateUUID(response1.body.accessToken)).toBe(true);
      expect(validateUUID(response2.body.accessToken)).toBe(true);
    });
  });
});