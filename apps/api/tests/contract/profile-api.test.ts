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
const mockExperienceId = 'b2c3d4e5-6f78-9012-3456-789012bcdefg';
const mockEducationId = 'c3d4e5f6-7890-1234-5678-90123cdefghi';

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

// Expected response schemas
const candidateProfileSchema = {
  id: expect.any(String),
  userId: expect.any(String),
  headline: expect.any(String),
  summary: expect.stringMatching(/.*/), // Can be empty
  location: expect.any(String),
  phoneNumber: expect.stringMatching(/.*/),
  portfolioUrl: expect.stringMatching(/.*/),
  linkedinUrl: expect.stringMatching(/.*/),
  githubUrl: expect.stringMatching(/.*/),
  experienceYears: expect.any(Number),
  skills: expect.any(Array),
  industries: expect.any(Array),
  salaryExpectationMin: expect.any(Number),
  salaryExpectationMax: expect.any(Number),
  availableFrom: expect.stringMatching(/.*/),
  willingToRelocate: expect.any(Boolean),
  remotePreference: expect.stringMatching(/^(remote|hybrid|office)$/),
  privacyLevel: expect.stringMatching(/^(public|semi-private|anonymous)$/),
  profileVisibleToEmployers: expect.any(Boolean),
  contactInfoVisible: expect.any(Boolean),
  salaryVisible: expect.any(Boolean),
  emailVerified: expect.any(Boolean),
  profileComplete: expect.any(Boolean),
  idVerified: expect.any(Boolean),
  verifiedBadge: expect.any(Boolean),
  profileViews: expect.any(Number),
  lastActiveAt: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
};

const publicProfileSchema = {
  id: expect.any(String),
  headline: expect.any(String),
  summary: expect.stringMatching(/.*/),
  location: expect.any(String),
  experienceYears: expect.any(Number),
  skills: expect.any(Array),
  industries: expect.any(Array),
  salaryExpectationMin: expect.any(Number),
  salaryExpectationMax: expect.any(Number),
  remotePreference: expect.stringMatching(/^(remote|hybrid|office)$/),
  verifiedBadge: expect.any(Boolean),
  profileViews: expect.any(Number),
  lastActiveAt: expect.any(String)
};

const workExperienceSchema = {
  id: expect.any(String),
  profileId: expect.any(String),
  jobTitle: expect.any(String),
  companyName: expect.any(String),
  companyWebsite: expect.stringMatching(/.*/),
  location: expect.any(String),
  startDate: expect.any(String),
  endDate: expect.any(String),
  isCurrent: expect.any(Boolean),
  description: expect.any(String),
  achievements: expect.any(Array),
  skills: expect.any(Array),
  sortOrder: expect.any(Number),
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
};

const educationSchema = {
  id: expect.any(String),
  profileId: expect.any(String),
  institutionName: expect.any(String),
  degree: expect.any(String),
  fieldOfStudy: expect.any(String),
  location: expect.any(String),
  startDate: expect.any(String),
  endDate: expect.any(String),
  isOngoing: expect.any(Boolean),
  grade: expect.stringMatching(/.*/),
  description: expect.stringMatching(/.*/),
  sortOrder: expect.any(Number),
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

const paginationSchema = {
  page: expect.any(Number),
  limit: expect.any(Number),
  totalPages: expect.any(Number),
  hasNextPage: expect.any(Boolean),
  hasPreviousPage: expect.any(Boolean)
};

describe('Profile API Contract Tests', () => {
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
      console.log('Expected failure: API implementation not yet available');
      throw new Error('API implementation not found - contract tests should fail until implementation exists');
    }
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /v1/profiles/me - Create Profile', () => {
    const validProfileCreateRequest = {
      headline: 'Senior Full-Stack Developer with 5+ years experience',
      summary: 'Experienced developer with expertise in TypeScript, React, and Node.js...',
      location: 'Dublin, Ireland',
      phoneNumber: '+353 1 234 5678',
      portfolioUrl: 'https://johndoe.dev',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      experienceYears: 5,
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      industries: ['Technology', 'SaaS', 'E-commerce'],
      salaryExpectationMin: 60000,
      salaryExpectationMax: 80000,
      availableFrom: '2024-01-15',
      willingToRelocate: false,
      remotePreference: 'hybrid'
    };

    it('should create a profile with valid data and return 201', async () => {
      const response = await request(app)
        .post('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validProfileCreateRequest)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(candidateProfileSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(validateUUID(response.body.userId)).toBe(true);
      expect(validateISODate(response.body.createdAt)).toBe(true);
      expect(validateISODate(response.body.updatedAt)).toBe(true);
      expect(response.body.headline).toBe(validProfileCreateRequest.headline);
      expect(response.body.skills).toEqual(validProfileCreateRequest.skills);
      expect(response.body.experienceYears).toBe(validProfileCreateRequest.experienceYears);
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {
        headline: 'Too short', // Less than 10 chars
        skills: [], // Empty array
        experienceYears: -1, // Negative number
        remotePreference: 'invalid' // Invalid enum value
      };

      const response = await request(app)
        .post('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/profiles/me')
        .send(validProfileCreateRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 409 if profile already exists', async () => {
      // First create would succeed, second should fail
      await request(app)
        .post('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validProfileCreateRequest);

      const response = await request(app)
        .post('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validProfileCreateRequest)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('PROFILE_ALREADY_EXISTS');
    });

    it('should return 422 for validation errors with detailed field errors', async () => {
      const requestWithValidationErrors = {
        headline: 'Short',
        location: '',
        experienceYears: 51, // Exceeds maximum
        skills: new Array(51).fill('skill'), // Exceeds maximum items
        salaryExpectationMin: 10000, // Below minimum
        salaryExpectationMax: 600000, // Above maximum
        portfolioUrl: 'not-a-url',
        remotePreference: 'invalid'
      };

      const response = await request(app)
        .post('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(requestWithValidationErrors)
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

  describe('GET /v1/profiles/me - Get Current Profile', () => {
    it('should return current user profile with 200', async () => {
      const response = await request(app)
        .get('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(candidateProfileSchema);
      expect(validateUUID(response.body.id)).toBe(true);
      expect(validateUUID(response.body.userId)).toBe(true);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/v1/profiles/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 404 if profile does not exist', async () => {
      const response = await request(app)
        .get('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('PUT /v1/profiles/me - Update Profile', () => {
    const validProfileUpdateRequest = {
      headline: 'Updated Senior Full-Stack Developer title',
      summary: 'Updated summary with new achievements...',
      experienceYears: 6,
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      salaryExpectationMin: 70000,
      salaryExpectationMax: 90000
    };

    it('should update profile with valid data and return 200', async () => {
      const response = await request(app)
        .put('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validProfileUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject(candidateProfileSchema);
      expect(response.body.headline).toBe(validProfileUpdateRequest.headline);
      expect(response.body.experienceYears).toBe(validProfileUpdateRequest.experienceYears);
      expect(response.body.skills).toEqual(validProfileUpdateRequest.skills);
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {
        experienceYears: 'not-a-number',
        portfolioUrl: 'invalid-url'
      };

      const response = await request(app)
        .put('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put('/v1/profiles/me')
        .send(validProfileUpdateRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 422 for validation errors', async () => {
      const requestWithValidationErrors = {
        headline: 'x', // Too short
        experienceYears: -5 // Invalid
      };

      const response = await request(app)
        .put('/v1/profiles/me')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(requestWithValidationErrors)
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body).toMatchObject(validationErrorSchema);
    });
  });

  describe('PUT /v1/profiles/me/privacy - Update Privacy Settings', () => {
    const validPrivacyRequest = {
      privacyLevel: 'semi-private',
      profileVisibleToEmployers: true,
      contactInfoVisible: false,
      salaryVisible: true
    };

    it('should update privacy settings and return 200', async () => {
      const response = await request(app)
        .put('/v1/profiles/me/privacy')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(validPrivacyRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        privacyLevel: expect.stringMatching(/^(public|semi-private|anonymous)$/),
        profileVisibleToEmployers: expect.any(Boolean),
        contactInfoVisible: expect.any(Boolean),
        salaryVisible: expect.any(Boolean),
        updatedAt: expect.any(String)
      });
      expect(validateISODate(response.body.updatedAt)).toBe(true);
    });

    it('should return 400 for invalid privacy level', async () => {
      const invalidRequest = {
        privacyLevel: 'invalid-level',
        profileVisibleToEmployers: true,
        contactInfoVisible: false,
        salaryVisible: true
      };

      const response = await request(app)
        .put('/v1/profiles/me/privacy')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(invalidRequest)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .put('/v1/profiles/me/privacy')
        .send(validPrivacyRequest)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
    });
  });

  describe('GET /v1/profiles - Search Profiles (Employer)', () => {
    it('should return paginated profiles with default parameters', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        profiles: expect.any(Array),
        pagination: paginationSchema,
        totalCount: expect.any(Number)
      });

      if (response.body.profiles.length > 0) {
        response.body.profiles.forEach((profile: any) => {
          expect(profile).toMatchObject(publicProfileSchema);
          expect(validateUUID(profile.id)).toBe(true);
        });
      }
    });

    it('should filter profiles by skills', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .query({ skills: 'typescript,react,node.js' })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.profiles).toBeInstanceOf(Array);
    });

    it('should filter profiles by location', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .query({ location: 'Dublin' })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.profiles).toBeInstanceOf(Array);
    });

    it('should filter profiles by salary range', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .query({ 
          salaryMin: 50000,
          salaryMax: 80000
        })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.profiles).toBeInstanceOf(Array);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .query({ 
          page: 2,
          limit: 10
        })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .query({ 
          salaryMin: -1000,
          experienceYears: 100,
          page: 0,
          limit: 100
        })
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/v1/profiles')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject(errorSchema);
    });

    it('should return 403 for candidates trying to access employer endpoint', async () => {
      // This would require a candidate token instead of employer token
      const candidateToken = 'candidate-specific-token';
      
      const response = await request(app)
        .get('/v1/profiles')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toMatchObject(errorSchema);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('Work Experience Endpoints', () => {
    describe('GET /v1/profiles/me/experience', () => {
      it('should return work experience list', async () => {
        const response = await request(app)
          .get('/v1/profiles/me/experience')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject({
          experience: expect.any(Array)
        });

        if (response.body.experience.length > 0) {
          response.body.experience.forEach((exp: any) => {
            expect(exp).toMatchObject(workExperienceSchema);
            expect(validateUUID(exp.id)).toBe(true);
            expect(validateDate(exp.startDate)).toBe(true);
            if (exp.endDate) {
              expect(validateDate(exp.endDate)).toBe(true);
            }
          });
        }
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .get('/v1/profiles/me/experience')
          .expect('Content-Type', /json/)
          .expect(401);

        expect(response.body).toMatchObject(errorSchema);
      });
    });

    describe('POST /v1/profiles/me/experience', () => {
      const validExperienceRequest = {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp Ltd',
        companyWebsite: 'https://techcorp.com',
        location: 'Dublin, Ireland',
        startDate: '2020-03-01',
        endDate: '2023-02-28',
        isCurrent: false,
        description: 'Led a team of 5 developers building microservices architecture with significant performance improvements.',
        achievements: [
          'Reduced API response times by 40%',
          'Implemented CI/CD pipeline reducing deployment time by 60%'
        ],
        skills: ['TypeScript', 'Docker', 'AWS', 'PostgreSQL'],
        sortOrder: 1
      };

      it('should create work experience and return 201', async () => {
        const response = await request(app)
          .post('/v1/profiles/me/experience')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(validExperienceRequest)
          .expect('Content-Type', /json/)
          .expect(201);

        expect(response.body).toMatchObject(workExperienceSchema);
        expect(response.body.jobTitle).toBe(validExperienceRequest.jobTitle);
        expect(response.body.companyName).toBe(validExperienceRequest.companyName);
        expect(response.body.isCurrent).toBe(false);
      });

      it('should return 400 for invalid data', async () => {
        const invalidRequest = {
          jobTitle: 'x', // Too short
          description: 'Short' // Too short
        };

        const response = await request(app)
          .post('/v1/profiles/me/experience')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(invalidRequest)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(errorSchema);
      });

      it('should return 422 for validation errors', async () => {
        const invalidRequest = {
          jobTitle: '', // Required field missing
          companyName: 'x', // Too short
          location: '',
          startDate: 'invalid-date',
          description: 'Short', // Too short
          isCurrent: 'not-boolean'
        };

        const response = await request(app)
          .post('/v1/profiles/me/experience')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(invalidRequest)
          .expect('Content-Type', /json/)
          .expect(422);

        expect(response.body).toMatchObject(validationErrorSchema);
      });
    });

    describe('PUT /v1/profiles/me/experience/{experienceId}', () => {
      const updateExperienceRequest = {
        jobTitle: 'Updated Senior Software Engineer',
        companyName: 'Updated Tech Corp Ltd',
        location: 'Updated Dublin, Ireland',
        startDate: '2020-03-01',
        endDate: '2023-03-15',
        isCurrent: false,
        description: 'Updated description with more details about achievements and responsibilities.',
        achievements: ['Updated achievement'],
        skills: ['Updated', 'Skills']
      };

      it('should update work experience and return 200', async () => {
        const response = await request(app)
          .put(`/v1/profiles/me/experience/${mockExperienceId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(updateExperienceRequest)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject(workExperienceSchema);
        expect(response.body.jobTitle).toBe(updateExperienceRequest.jobTitle);
      });

      it('should return 400 for invalid UUID', async () => {
        const response = await request(app)
          .put('/v1/profiles/me/experience/invalid-uuid')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(updateExperienceRequest)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(errorSchema);
      });

      it('should return 404 for non-existent experience', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .put(`/v1/profiles/me/experience/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(updateExperienceRequest)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
      });
    });

    describe('DELETE /v1/profiles/me/experience/{experienceId}', () => {
      it('should delete work experience and return 204', async () => {
        await request(app)
          .delete(`/v1/profiles/me/experience/${mockExperienceId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect(204);
      });

      it('should return 400 for invalid UUID', async () => {
        const response = await request(app)
          .delete('/v1/profiles/me/experience/invalid-uuid')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(400);

        expect(response.body).toMatchObject(errorSchema);
      });

      it('should return 404 for non-existent experience', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .delete(`/v1/profiles/me/experience/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
      });
    });
  });

  describe('Education Endpoints', () => {
    describe('GET /v1/profiles/me/education', () => {
      it('should return education list', async () => {
        const response = await request(app)
          .get('/v1/profiles/me/education')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject({
          education: expect.any(Array)
        });

        if (response.body.education.length > 0) {
          response.body.education.forEach((edu: any) => {
            expect(edu).toMatchObject(educationSchema);
            expect(validateUUID(edu.id)).toBe(true);
            expect(validateDate(edu.startDate)).toBe(true);
            if (edu.endDate) {
              expect(validateDate(edu.endDate)).toBe(true);
            }
          });
        }
      });
    });

    describe('POST /v1/profiles/me/education', () => {
      const validEducationRequest = {
        institutionName: 'Trinity College Dublin',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        location: 'Dublin, Ireland',
        startDate: '2016-09-01',
        endDate: '2020-06-30',
        isOngoing: false,
        grade: 'First Class Honours',
        description: 'Relevant coursework: Data Structures, Algorithms, Database Design, Software Engineering',
        sortOrder: 1
      };

      it('should create education and return 201', async () => {
        const response = await request(app)
          .post('/v1/profiles/me/education')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(validEducationRequest)
          .expect('Content-Type', /json/)
          .expect(201);

        expect(response.body).toMatchObject(educationSchema);
        expect(response.body.institutionName).toBe(validEducationRequest.institutionName);
        expect(response.body.degree).toBe(validEducationRequest.degree);
        expect(response.body.isOngoing).toBe(false);
      });

      it('should return 422 for validation errors', async () => {
        const invalidRequest = {
          institutionName: 'x', // Too short
          degree: '', // Required field missing
          fieldOfStudy: 'x', // Too short
          startDate: 'invalid-date',
          isOngoing: 'not-boolean'
        };

        const response = await request(app)
          .post('/v1/profiles/me/education')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(invalidRequest)
          .expect('Content-Type', /json/)
          .expect(422);

        expect(response.body).toMatchObject(validationErrorSchema);
      });
    });

    describe('PUT /v1/profiles/me/education/{educationId}', () => {
      const updateEducationRequest = {
        institutionName: 'Updated Trinity College Dublin',
        degree: 'Updated Bachelor of Science',
        fieldOfStudy: 'Updated Computer Science',
        location: 'Updated Dublin, Ireland',
        startDate: '2016-09-01',
        endDate: '2020-07-15',
        isOngoing: false,
        grade: 'Updated First Class Honours',
        description: 'Updated coursework description'
      };

      it('should update education and return 200', async () => {
        const response = await request(app)
          .put(`/v1/profiles/me/education/${mockEducationId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(updateEducationRequest)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toMatchObject(educationSchema);
        expect(response.body.institutionName).toBe(updateEducationRequest.institutionName);
      });

      it('should return 404 for non-existent education', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .put(`/v1/profiles/me/education/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send(updateEducationRequest)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
      });
    });

    describe('DELETE /v1/profiles/me/education/{educationId}', () => {
      it('should delete education and return 204', async () => {
        await request(app)
          .delete(`/v1/profiles/me/education/${mockEducationId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect(204);
      });

      it('should return 404 for non-existent education', async () => {
        const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        const response = await request(app)
          .delete(`/v1/profiles/me/education/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect('Content-Type', /json/)
          .expect(404);

        expect(response.body).toMatchObject(errorSchema);
      });
    });
  });

  describe('Response Schema Validation', () => {
    it('should validate that all string dates are in correct format', async () => {
      // This test ensures our schema validation helpers work correctly
      expect(validateISODate('2024-01-15T10:30:00.000Z')).toBe(true);
      expect(validateISODate('2024-01-15T10:30:00Z')).toBe(true);
      expect(validateISODate('2024-01-15')).toBe(false);
      expect(validateISODate('invalid-date')).toBe(false);

      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-1-1')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
    });

    it('should validate UUIDs correctly', async () => {
      expect(validateUUID('54f9c58e-eb69-49c3-8fba-a256b1f6ec24')).toBe(true);
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('54f9c58e-eb69-49c3-8fba')).toBe(false);
    });

    it('should validate URLs correctly', async () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('invalid-url')).toBe(false);
      expect(validateURL('')).toBe(false);
    });
  });

  describe('Error Response Standards', () => {
    it('should return consistent error structure for all error responses', async () => {
      // Test that all error responses follow the same structure
      const errorTests = [
        { method: 'get', path: '/v1/profiles/me', expectedStatus: 401 },
        { method: 'post', path: '/v1/profiles/me', expectedStatus: 401 },
        { method: 'put', path: '/v1/profiles/me', expectedStatus: 401 },
        { method: 'get', path: '/v1/profiles', expectedStatus: 401 }
      ];

      for (const test of errorTests) {
        const response = await request(app)[test.method](test.path)
          .expect('Content-Type', /json/)
          .expect(test.expectedStatus);

        expect(response.body).toMatchObject(errorSchema);
        expect(validateISODate(response.body.timestamp)).toBe(true);
      }
    });
  });
});