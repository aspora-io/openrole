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
const mockCvId = 'b1c2d3e4-6f78-9012-3456-789012bcdefg';
const mockCvId2 = 'c2d3e4f5-7890-1234-5678-90123cdefghi';
const mockTemplateId = 'd3e4f5g6-8901-2345-6789-01234defghij';
const mockJobId = 'e4f5g6h7-9012-3456-7890-12345efghijk';

// Schema validation helpers
const validateUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const validateISODate = (value: string): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
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

// Expected response schemas based on the cvs-api.yaml contract
const cvDocumentSchema = {
  id: expect.any(String),
  fileName: expect.any(String),
  originalFileName: expect.any(String),
  label: expect.any(String),
  fileSize: expect.any(Number),
  mimeType: expect.any(String),
  isGenerated: expect.any(Boolean),
  templateId: expect.stringMatching(/.*/), // Can be null
  version: expect.any(Number),
  isActive: expect.any(Boolean),
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
};

const cvTemplateSchema = {
  id: expect.any(String),
  name: expect.any(String),
  description: expect.any(String),
  category: expect.stringMatching(/^(ats_safe|modern|classic|creative)$/),
  previewUrl: expect.any(String),
  isATSFriendly: expect.any(Boolean),
  supportedSections: expect.any(Array)
};

const validationErrorSchema = {
  error: expect.any(String),
  details: expect.any(Array)
};

const errorSchema = {
  error: expect.any(String),
  message: expect.any(String),
  code: expect.any(String),
  timestamp: expect.any(String)
};

describe('CVs API Contract Tests', () => {
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
      console.log('Expected failure: CVs API implementation not yet available');
      throw new Error('CVs API implementation not found - contract tests should fail until implementation exists');
    }
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /cvs - Get User CVs', () => {
    it('should return all CVs for authenticated user with 200', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      if (response.body.length > 0) {
        response.body.forEach((cv: any) => {
          expect(cv).toMatchObject(cvDocumentSchema);
          expect(validateUUID(cv.id)).toBe(true);
          expect(validateMimeType(cv.mimeType)).toBe(true);
          expect(validateISODate(cv.createdAt)).toBe(true);
          expect(validateISODate(cv.updatedAt)).toBe(true);
          expect(cv.fileSize).toBeGreaterThan(0);
          expect(cv.version).toBeGreaterThan(0);
          expect(cv.label).toHaveLength.toBeGreaterThan(0);
          expect(cv.label.length).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should return empty array when user has no CVs with 200', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
      expect(validateISODate(response.body.timestamp)).toBe(true);
    });

    it('should return 401 for invalid JWT token', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for expired JWT token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NGY5YzU4ZS1lYjY5LTQ5YzMtOGZiYS1hMjU2YjFmNmVjMjQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.expired-signature';
      
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /cvs - Upload New CV', () => {
    const mockPdfBuffer = Buffer.from('Mock PDF content for testing');
    
    it('should upload CV with valid file and data and return 201', async () => {
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'senior-developer-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', 'Senior Developer CV')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(response.body.label).toBe('Senior Developer CV');
      expect(response.body.originalFileName).toBe('senior-developer-cv.pdf');
      expect(response.body.mimeType).toBe('application/pdf');
      expect(response.body.isGenerated).toBe(false);
      expect(response.body.templateId).toBeNull();
      expect(response.body.version).toBe(1);
      expect(response.body.isActive).toBe(true);
      expect(response.body.fileSize).toBeGreaterThan(0);
    });

    it('should upload DOCX file and return 201', async () => {
      const mockDocxBuffer = Buffer.from('Mock DOCX content');
      
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockDocxBuffer, {
          filename: 'resume.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
        .field('label', 'Marketing Manager Resume')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.body.originalFileName).toBe('resume.docx');
    });

    it('should upload DOC file and return 201', async () => {
      const mockDocBuffer = Buffer.from('Mock DOC content');
      
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockDocBuffer, {
          filename: 'cv.doc',
          contentType: 'application/msword'
        })
        .field('label', 'Traditional CV')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.mimeType).toBe('application/msword');
    });

    it('should return 400 for missing required file', async () => {
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .field('label', 'CV without file')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'file')).toBe(true);
    });

    it('should return 400 for missing required label', async () => {
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'test-cv.pdf',
          contentType: 'application/pdf'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });

    it('should return 400 for label exceeding maxLength of 100 characters', async () => {
      const longLabel = 'A'.repeat(101); // 101 characters
      
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'test-cv.pdf',
          contentType: 'application/pdf'
        })
        .field('label', longLabel)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });

    it('should return 400 for invalid file type', async () => {
      const mockImageBuffer = Buffer.from('Mock image content');
      
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockImageBuffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg'
        })
        .field('label', 'Invalid CV')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'file')).toBe(true);
    });

    it('should return 413 for file too large (over 10MB)', async () => {
      const largeMockBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/v1/cvs')
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

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/cvs')
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
  });

  describe('GET /cvs/{cvId} - Get CV Details', () => {
    it('should return CV details for valid ID with 200', async () => {
      const response = await request(app)
        .get(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(response.body.id).toBe(mockCvId);
      expect(validateMimeType(response.body.mimeType)).toBe(true);
      expect(validateISODate(response.body.createdAt)).toBe(true);
      expect(validateISODate(response.body.updatedAt)).toBe(true);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/v1/cvs/invalid-uuid-format')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('UUID');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/v1/cvs/${mockCvId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .get(`/v1/cvs/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 403 for CV belonging to different user', async () => {
      const otherUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJvdGhlci11c2VyLWlkIiwiZW1haWwiOiJvdGhlckB0ZXN0LmNvbSIsImlhdCI6MTczMDAwMDAwMH0.other-signature';
      
      const response = await request(app)
        .get(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /cvs/{cvId} - Update CV Metadata', () => {
    const validUpdateRequest = {
      label: 'Updated Senior Software Engineer CV',
      isActive: true
    };

    it('should update CV metadata with valid data and return 200', async () => {
      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(validUpdateRequest.label);
      expect(response.body.isActive).toBe(validUpdateRequest.isActive);
      expect(validateISODate(response.body.updatedAt)).toBe(true);
      expect(response.body.version).toBeGreaterThan(0);
    });

    it('should update only label field and return 200', async () => {
      const partialUpdate = {
        label: 'Partially Updated CV Label'
      };

      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(partialUpdate)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(partialUpdate.label);
    });

    it('should update only isActive field and return 200', async () => {
      const partialUpdate = {
        isActive: false
      };

      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(partialUpdate)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.isActive).toBe(partialUpdate.isActive);
    });

    it('should return 400 for label too short (minLength 1)', async () => {
      const invalidRequest = {
        label: '' // Empty string
      };

      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });

    it('should return 400 for label too long (maxLength 100)', async () => {
      const invalidRequest = {
        label: 'A'.repeat(101) // 101 characters
      };

      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });

    it('should return 400 for invalid isActive type', async () => {
      const invalidRequest = {
        isActive: 'not-boolean'
      };

      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'isActive')).toBe(true);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put(`/v1/cvs/${mockCvId}`)
        .send(validUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .put(`/v1/cvs/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /cvs/{cvId} - Delete CV', () => {
    it('should delete CV successfully and return 204', async () => {
      await request(app)
        .delete(`/v1/cvs/${mockCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(204);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .delete(`/v1/cvs/${mockCvId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .delete(`/v1/cvs/${nonExistentId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 409 when CV is used in active applications', async () => {
      // Mock a CV that's actively being used in applications
      const activeApplicationCvId = 'active-cv-id-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .delete(`/v1/cvs/${activeApplicationCvId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('CONFLICT');
      expect(response.body.message).toContain('active applications');
    });
  });

  describe('GET /cvs/{cvId}/download - Download CV File', () => {
    it('should download PDF file and return 200', async () => {
      const response = await request(app)
        .get(`/v1/cvs/${mockCvId}/download`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=/);
      expect(response.headers['content-length']).toBeDefined();
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should download DOCX file and return 200', async () => {
      const docxCvId = 'docx-cv-id-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .get(`/v1/cvs/${docxCvId}/download`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=.*\.docx/);
    });

    it('should download DOC file and return 200', async () => {
      const docCvId = 'doc-cv-id-1234-5678-9012-abcdef123456';
      
      const response = await request(app)
        .get(`/v1/cvs/${docCvId}/download`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/msword');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=.*\.doc/);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/v1/cvs/${mockCvId}/download`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .get(`/v1/cvs/${nonExistentId}/download`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 403 for CV belonging to different user', async () => {
      const otherUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJvdGhlci11c2VyLWlkIiwiZW1haWwiOiJvdGhlckB0ZXN0LmNvbSIsImlhdCI6MTczMDAwMDAwMH0.other-signature';
      
      const response = await request(app)
        .get(`/v1/cvs/${mockCvId}/download`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /cvs/generate - Generate CV from Profile', () => {
    const validGenerateRequest = {
      templateId: mockTemplateId,
      label: 'Generated Software Engineer CV',
      includePhoto: false,
      sections: ['personal', 'summary', 'experience', 'education', 'skills']
    };

    it('should generate CV with valid data and return 201', async () => {
      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validGenerateRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(response.body.label).toBe(validGenerateRequest.label);
      expect(response.body.isGenerated).toBe(true);
      expect(response.body.templateId).toBe(validGenerateRequest.templateId);
      expect(response.body.version).toBe(1);
      expect(response.body.isActive).toBe(true);
    });

    it('should generate CV with minimal required data and return 201', async () => {
      const minimalRequest = {
        templateId: mockTemplateId,
        label: 'Minimal Generated CV'
      };

      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(minimalRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.includePhoto).toBe(false); // Default value
      expect(response.body.sections).toEqual(['personal', 'summary', 'experience', 'education', 'skills', 'portfolio', 'references']); // Default sections
    });

    it('should generate CV with all sections and return 201', async () => {
      const fullRequest = {
        templateId: mockTemplateId,
        label: 'Complete CV with All Sections',
        includePhoto: true,
        sections: ['personal', 'summary', 'experience', 'education', 'skills', 'portfolio', 'references']
      };

      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(fullRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(fullRequest.label);
    });

    it('should return 400 for missing required templateId', async () => {
      const invalidRequest = {
        label: 'CV without template ID'
        // Missing templateId
      };

      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'templateId')).toBe(true);
    });

    it('should return 400 for missing required label', async () => {
      const invalidRequest = {
        templateId: mockTemplateId
        // Missing label
      };

      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });

    it('should return 400 for invalid sections array', async () => {
      const invalidRequest = {
        templateId: mockTemplateId,
        label: 'CV with invalid sections',
        sections: ['invalid-section', 'another-invalid-section']
      };

      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'sections')).toBe(true);
    });

    it('should return 400 for insufficient profile data', async () => {
      // Mock insufficient profile data scenario
      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validGenerateRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('insufficient profile data');
    });

    it('should return 400 for invalid template', async () => {
      const invalidTemplateRequest = {
        templateId: 'non-existent-template-id',
        label: 'CV with invalid template'
      };

      const response = await request(app)
        .post('/v1/cvs/generate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidTemplateRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('invalid template');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/cvs/generate')
        .send(validGenerateRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /cvs/templates - Get Available CV Templates', () => {
    it('should return all available templates with 200', async () => {
      const response = await request(app)
        .get('/v1/cvs/templates')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      if (response.body.length > 0) {
        response.body.forEach((template: any) => {
          expect(template).toMatchObject(cvTemplateSchema);
          expect(validateUUID(template.id)).toBe(true);
          expect(['ats_safe', 'modern', 'classic', 'creative']).toContain(template.category);
          expect(validateURL(template.previewUrl)).toBe(true);
          expect(template.supportedSections).toBeInstanceOf(Array);
          expect(typeof template.isATSFriendly).toBe('boolean');
        });
      }
    });

    it('should return empty array when no templates available', async () => {
      const response = await request(app)
        .get('/v1/cvs/templates')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/v1/cvs/templates')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /cvs/{cvId}/tailor - Generate Tailored CV', () => {
    const validTailorRequest = {
      jobId: mockJobId,
      label: 'Frontend Developer CV - TechCorp',
      emphasizeSkills: ['React', 'TypeScript', 'Node.js']
    };

    it('should generate tailored CV with job ID and return 201', async () => {
      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validTailorRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(response.body.label).toBe(validTailorRequest.label);
      expect(response.body.isGenerated).toBe(true);
      expect(response.body.version).toBe(1);
    });

    it('should generate tailored CV with minimal data (auto-generated label) and return 201', async () => {
      const minimalRequest = {
        jobId: mockJobId
      };

      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(minimalRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toMatch(/Tailored CV for .+/); // Auto-generated label pattern
    });

    it('should generate tailored CV with emphasized skills and return 201', async () => {
      const skillsRequest = {
        jobId: mockJobId,
        label: 'Tailored Full-Stack Developer CV',
        emphasizeSkills: ['JavaScript', 'Python', 'AWS', 'Docker', 'Kubernetes']
      };

      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(skillsRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(skillsRequest.label);
    });

    it('should return 400 for missing required jobId', async () => {
      const invalidRequest = {
        label: 'CV without job ID'
        // Missing jobId
      };

      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'jobId')).toBe(true);
    });

    it('should return 400 for invalid jobId format', async () => {
      const invalidRequest = {
        jobId: 'invalid-uuid-format',
        label: 'CV with invalid job ID'
      };

      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'jobId')).toBe(true);
    });

    it('should return 400 for label exceeding maxLength of 100 characters', async () => {
      const invalidRequest = {
        jobId: mockJobId,
        label: 'A'.repeat(101) // 101 characters
      };

      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'label')).toBe(true);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .send(validTailorRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent CV', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const response = await request(app)
        .post(`/v1/cvs/${nonExistentId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validTailorRequest)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent job', async () => {
      const invalidJobRequest = {
        jobId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Non-existent job ID
        label: 'CV for non-existent job'
      };

      const response = await request(app)
        .post(`/v1/cvs/${mockCvId}/tailor`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidJobRequest)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.message).toContain('job not found');
    });
  });

  describe('Response Schema Validation', () => {
    it('should validate that all date fields are in correct ISO format', async () => {
      expect(validateISODate('2024-01-15T10:30:00.000Z')).toBe(true);
      expect(validateISODate('2024-01-15T10:30:00Z')).toBe(true);
      expect(validateISODate('2024-01-15')).toBe(false);
      expect(validateISODate('invalid-date')).toBe(false);
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
      expect(validateURL('https://api.openrole.net/preview/123')).toBe(true);
      expect(validateURL('invalid-url')).toBe(false);
      expect(validateURL('')).toBe(false);
    });

    it('should validate MIME types for CVs correctly', async () => {
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateMimeType('application/msword')).toBe(true);
      expect(validateMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(validateMimeType('image/jpeg')).toBe(false);
      expect(validateMimeType('text/plain')).toBe(false);
      expect(validateMimeType('')).toBe(false);
    });
  });

  describe('Error Response Standards', () => {
    it('should return consistent error structure for all error responses', async () => {
      const errorTests = [
        { method: 'get', path: '/v1/cvs', expectedStatus: 401 },
        { method: 'post', path: '/v1/cvs', expectedStatus: 401 },
        { method: 'get', path: `/v1/cvs/${mockCvId}`, expectedStatus: 401 },
        { method: 'put', path: `/v1/cvs/${mockCvId}`, expectedStatus: 401 },
        { method: 'delete', path: `/v1/cvs/${mockCvId}`, expectedStatus: 401 },
        { method: 'get', path: `/v1/cvs/${mockCvId}/download`, expectedStatus: 401 },
        { method: 'post', path: '/v1/cvs/generate', expectedStatus: 401 },
        { method: 'get', path: '/v1/cvs/templates', expectedStatus: 401 },
        { method: 'post', path: `/v1/cvs/${mockCvId}/tailor`, expectedStatus: 401 }
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

    it('should return validation error structure for 400 responses', async () => {
      const validationErrorTests = [
        {
          method: 'post',
          path: '/v1/cvs',
          setup: (req: any) => req.field('label', ''), // Missing file
        },
        {
          method: 'post',
          path: '/v1/cvs/generate',
          setup: (req: any) => req.send({ label: 'Missing template ID' })
        },
        {
          method: 'post',
          path: `/v1/cvs/${mockCvId}/tailor`,
          setup: (req: any) => req.send({ label: 'Missing job ID' })
        }
      ];

      for (const test of validationErrorTests) {
        const reqBuilder = request(app)[test.method](test.path)
          .set('Authorization', `Bearer ${mockJwtToken}`);
        
        const response = await test.setup(reqBuilder)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(validationErrorSchema);
        expect(response.body.details).toBeInstanceOf(Array);
        expect(response.body.details.length).toBeGreaterThan(0);
        expect(validateISODate(response.body.timestamp)).toBe(true);
      }
    });
  });

  describe('File Upload Security Tests', () => {
    it('should reject executable files', async () => {
      const executableBuffer = Buffer.from('Fake executable content');

      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', executableBuffer, {
          filename: 'malicious.exe',
          contentType: 'application/octet-stream'
        })
        .field('label', 'Malicious CV')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'file')).toBe(true);
    });

    it('should validate file extension matches MIME type', async () => {
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', Buffer.from('PDF content'), {
          filename: 'document.txt', // Wrong extension for PDF MIME type
          contentType: 'application/pdf'
        })
        .field('label', 'Mismatched Extension CV')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(validationErrorSchema);
      expect(response.body.details.some((d: any) => d.field === 'file')).toBe(true);
    });

    it('should reject files with dangerous extensions', async () => {
      const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'vbs', 'js', 'jar'];
      
      for (const ext of dangerousExtensions) {
        const response = await request(app)
          .post('/v1/cvs')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .attach('file', Buffer.from('Fake content'), {
            filename: `file.${ext}`,
            contentType: 'application/pdf'
          })
          .field('label', `CV with ${ext} extension`)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(validationErrorSchema);
      }
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle very large label at boundary (100 characters)', async () => {
      const maxLengthLabel = 'A'.repeat(100); // Exactly 100 characters
      const mockPdfBuffer = Buffer.from('Mock PDF content');
      
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: 'boundary-test.pdf',
          contentType: 'application/pdf'
        })
        .field('label', maxLengthLabel)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.label).toBe(maxLengthLabel);
    });

    it('should handle special characters in file names', async () => {
      const mockPdfBuffer = Buffer.from('Mock PDF content');
      const specialFileName = 'CV with spaces & symbols (2024) - final_v2.pdf';
      
      const response = await request(app)
        .post('/v1/cvs')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .attach('file', mockPdfBuffer, {
          filename: specialFileName,
          contentType: 'application/pdf'
        })
        .field('label', 'CV with Special Characters')
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(cvDocumentSchema);
      expect(response.body.originalFileName).toBe(specialFileName);
    });

    it('should handle concurrent CV uploads', async () => {
      const mockPdfBuffer = Buffer.from('Mock PDF content');
      const uploadPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/v1/cvs')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .attach('file', mockPdfBuffer, {
            filename: `concurrent-cv-${i}.pdf`,
            contentType: 'application/pdf'
          })
          .field('label', `Concurrent CV ${i}`)
          .expect('Content-Type', /json/)
          .expect(201);
        
        uploadPromises.push(promise);
      }
      
      const responses = await Promise.all(uploadPromises);
      
      responses.forEach((response, index) => {
        expect(response.body).toMatchObject(cvDocumentSchema);
        expect(response.body.label).toBe(`Concurrent CV ${index}`);
        expect(validateUUID(response.body.id)).toBe(true);
      });
      
      // Ensure all CVs have unique IDs
      const ids = responses.map(r => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Authentication and Authorization Edge Cases', () => {
    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', 'InvalidFormat token-here')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject missing Bearer prefix', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', mockJwtToken)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should handle empty Authorization header', async () => {
      const response = await request(app)
        .get('/v1/cvs')
        .set('Authorization', '')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });
});