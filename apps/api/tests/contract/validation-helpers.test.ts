import { describe, it, expect } from '@jest/globals';

// Schema validation helpers (same as in main test file)
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

/**
 * Validation Helper Tests
 * 
 * These tests validate the helper functions used in contract tests.
 * This ensures our schema validation is working correctly.
 */
describe('Validation Helpers', () => {
  describe('validateUUID', () => {
    it('should accept valid UUIDs', () => {
      const validUUIDs = [
        '54f9c58e-eb69-49c3-8fba-a256b1f6ec24',
        'a1b2c3d4-5e6f-7890-1234-567890abcdef',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '123e4567-e89b-12d3-a456-426614174000'
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '54f9c58e-eb69-49c3-8fba', // Too short
        '54f9c58e-eb69-49c3-8fba-a256b1f6ec24-extra', // Too long
        '54f9c58e_eb69_49c3_8fba_a256b1f6ec24', // Wrong separator
        'gggggggg-gggg-gggg-gggg-gggggggggggg', // Invalid hex
        '',
        '123'
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(false);
      });
    });
  });

  describe('validateISODate', () => {
    it('should accept valid ISO date strings', () => {
      const validDates = [
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00Z',
        '2024-12-31T23:59:59.999Z',
        '2024-01-01T00:00:00.000Z',
        '2023-06-15T14:30:00.123Z'
      ];

      validDates.forEach(date => {
        expect(validateISODate(date)).toBe(true);
      });
    });

    it('should reject invalid ISO date strings', () => {
      const invalidDates = [
        '2024-01-15', // Missing time
        '2024-01-15 10:30:00', // Wrong format (space instead of T)
        'invalid-date',
        '2024-13-01T10:30:00Z', // Invalid month
        '2024-01-32T10:30:00Z', // Invalid day
        '',
        '2024/01/15T10:30:00Z' // Wrong date separator
      ];

      invalidDates.forEach(date => {
        expect(validateISODate(date)).toBe(false);
      });
    });
  });

  describe('validateDate', () => {
    it('should accept valid YYYY-MM-DD date strings', () => {
      const validDates = [
        '2024-01-15',
        '2024-12-31',
        '2023-02-28',
        '2024-02-29', // Leap year
        '2000-01-01'
      ];

      validDates.forEach(date => {
        expect(validateDate(date)).toBe(true);
      });
    });

    it('should reject invalid date strings', () => {
      const invalidDates = [
        '2024-1-1', // Single digit month/day
        '24-01-15', // Two-digit year
        '2024/01/15', // Wrong separator
        '2024-13-01', // Invalid month
        '2024-01-32', // Invalid day
        '2023-02-29', // Not a leap year
        'invalid-date',
        '',
        '2024-01-15T10:30:00Z' // Has time component
      ];

      invalidDates.forEach(date => {
        expect(validateDate(date)).toBe(false);
      });
    });
  });

  describe('validateURL', () => {
    it('should accept valid URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://example.com:8080',
        'https://example.com/path?query=value',
        'https://subdomain.example.com',
        'https://linkedin.com/in/johndoe',
        'https://github.com/johndoe',
        'https://johndoe.dev'
      ];

      validURLs.forEach(url => {
        expect(validateURL(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidURLs = [
        'not-a-url',
        'ftp://example.com', // Invalid protocol for this context
        'example.com', // Missing protocol
        '',
        'https://',
        'https://.',
        'https://example',
        'javascript:alert(1)' // Potentially malicious
      ];

      invalidURLs.forEach(url => {
        expect(validateURL(url)).toBe(false);
      });
    });
  });

  describe('Schema matching examples', () => {
    it('should demonstrate expected object schema patterns', () => {
      const mockCandidateProfile = {
        id: '54f9c58e-eb69-49c3-8fba-a256b1f6ec24',
        userId: 'a1b2c3d4-5e6f-7890-1234-567890abcdef',
        headline: 'Senior Full-Stack Developer',
        summary: 'Experienced developer with 5+ years...',
        location: 'Dublin, Ireland',
        phoneNumber: '+353 1 234 5678',
        portfolioUrl: 'https://johndoe.dev',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
        experienceYears: 5,
        skills: ['TypeScript', 'React', 'Node.js'],
        industries: ['Technology', 'SaaS'],
        salaryExpectationMin: 60000,
        salaryExpectationMax: 80000,
        availableFrom: '2024-01-15',
        willingToRelocate: false,
        remotePreference: 'hybrid',
        privacyLevel: 'semi-private',
        profileVisibleToEmployers: true,
        contactInfoVisible: false,
        salaryVisible: true,
        emailVerified: true,
        profileComplete: true,
        idVerified: false,
        verifiedBadge: false,
        profileViews: 45,
        lastActiveAt: '2024-01-15T10:30:00.000Z',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      };

      // Validate the mock profile matches expected patterns
      expect(validateUUID(mockCandidateProfile.id)).toBe(true);
      expect(validateUUID(mockCandidateProfile.userId)).toBe(true);
      expect(validateURL(mockCandidateProfile.portfolioUrl)).toBe(true);
      expect(validateURL(mockCandidateProfile.linkedinUrl)).toBe(true);
      expect(validateURL(mockCandidateProfile.githubUrl)).toBe(true);
      expect(validateDate(mockCandidateProfile.availableFrom)).toBe(true);
      expect(validateISODate(mockCandidateProfile.lastActiveAt)).toBe(true);
      expect(validateISODate(mockCandidateProfile.createdAt)).toBe(true);
      expect(validateISODate(mockCandidateProfile.updatedAt)).toBe(true);

      // Validate enum values
      expect(['remote', 'hybrid', 'office']).toContain(mockCandidateProfile.remotePreference);
      expect(['public', 'semi-private', 'anonymous']).toContain(mockCandidateProfile.privacyLevel);

      // Validate array types
      expect(Array.isArray(mockCandidateProfile.skills)).toBe(true);
      expect(Array.isArray(mockCandidateProfile.industries)).toBe(true);
      expect(mockCandidateProfile.skills.length).toBeGreaterThan(0);

      // Validate number ranges
      expect(mockCandidateProfile.experienceYears).toBeGreaterThanOrEqual(0);
      expect(mockCandidateProfile.experienceYears).toBeLessThanOrEqual(50);
      expect(mockCandidateProfile.salaryExpectationMin).toBeGreaterThanOrEqual(20000);
      expect(mockCandidateProfile.salaryExpectationMax).toBeGreaterThanOrEqual(20000);
      expect(mockCandidateProfile.salaryExpectationMax).toBeGreaterThanOrEqual(mockCandidateProfile.salaryExpectationMin);
    });

    it('should demonstrate error response schema', () => {
      const mockErrorResponse = {
        error: 'Validation failed',
        message: 'The provided data is invalid',
        code: 'VALIDATION_ERROR',
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      expect(typeof mockErrorResponse.error).toBe('string');
      expect(typeof mockErrorResponse.message).toBe('string');
      expect(typeof mockErrorResponse.code).toBe('string');
      expect(validateISODate(mockErrorResponse.timestamp)).toBe(true);
    });

    it('should demonstrate validation error response schema', () => {
      const mockValidationErrorResponse = {
        error: 'Validation failed',
        message: 'The provided data is invalid',
        code: 'VALIDATION_ERROR',
        details: [
          {
            field: 'headline',
            message: 'Headline must be at least 10 characters',
            code: 'MIN_LENGTH'
          },
          {
            field: 'experienceYears',
            message: 'Experience years must be a positive number',
            code: 'INVALID_TYPE'
          }
        ],
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      expect(Array.isArray(mockValidationErrorResponse.details)).toBe(true);
      expect(mockValidationErrorResponse.details.length).toBeGreaterThan(0);
      
      mockValidationErrorResponse.details.forEach(detail => {
        expect(detail).toHaveProperty('field');
        expect(detail).toHaveProperty('message');
        expect(detail).toHaveProperty('code');
        expect(typeof detail.field).toBe('string');
        expect(typeof detail.message).toBe('string');
        expect(typeof detail.code).toBe('string');
      });
    });
  });
});