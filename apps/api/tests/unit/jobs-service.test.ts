import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { JobsService } from '../../src/services/jobs.service';

describe('JobsService - Bulk Import', () => {
  let jobsService: JobsService;
  
  beforeEach(() => {
    jobsService = new JobsService();
  });

  describe('bulkImportJobs', () => {
    const validBulkImportData = {
      jobs: [
        {
          title: 'Senior Software Engineer',
          description: 'We are looking for a senior software engineer to join our team...',
          company_name: 'TechCorp Ltd',
          salary_min: 80000,
          salary_max: 120000,
          salary_currency: 'EUR',
          location_general: 'London',
          remote_type: 'hybrid',
          employment_type: 'full-time',
          experience_level: 'senior',
          core_skills: ['JavaScript', 'TypeScript', 'React'],
          nice_to_have_skills: ['Node.js', 'Docker'],
          external_url: 'https://techcorp.com/jobs/123',
          source: 'scraped',
          source_id: 'tc_123',
          tags: ['tech', 'senior']
        },
        {
          title: 'Product Manager',
          description: 'Join our product team as a Product Manager...',
          company_name: 'StartupCo',
          salary_min: 70000,
          salary_max: 90000,
          salary_currency: 'EUR',
          location_general: 'Berlin',
          remote_type: 'remote',
          employment_type: 'full-time',
          experience_level: 'mid',
          core_skills: ['Product Management', 'Agile'],
          nice_to_have_skills: ['Technical Background'],
          external_url: 'https://startupco.com/careers/pm',
          source: 'scraped',
          source_id: 'sc_456',
          tags: ['product', 'remote']
        }
      ],
      source_name: 'TechJobs Scraper',
      import_note: 'Weekly import from TechJobs API',
      auto_publish: false,
      deduplicate: true,
      imported_by: 'admin-user-id',
      imported_at: '2024-01-15T10:00:00Z'
    };

    it('should successfully import valid jobs', async () => {
      // Mock database operations
      const mockCreateJob = jest.fn().mockResolvedValue({ id: 'job-123', status: 'draft' });
      const mockCreateImportHistory = jest.fn().mockResolvedValue({ id: 'import-456' });
      
      jobsService.createJob = mockCreateJob;
      jobsService.createImportHistory = mockCreateImportHistory;

      const result = await jobsService.bulkImportJobs(validBulkImportData);

      expect(result).toEqual({
        import_id: 'import-456',
        imported_count: 2,
        skipped_count: 0,
        failed_count: 0,
        status: 'completed',
        jobs_created: [
          { id: 'job-123', title: 'Senior Software Engineer', status: 'draft' },
          { id: 'job-123', title: 'Product Manager', status: 'draft' }
        ],
        errors: []
      });

      expect(mockCreateJob).toHaveBeenCalledTimes(2);
      expect(mockCreateImportHistory).toHaveBeenCalledWith({
        source_name: 'TechJobs Scraper',
        import_note: 'Weekly import from TechJobs API',
        imported_by: 'admin-user-id',
        imported_at: '2024-01-15T10:00:00Z',
        jobs_processed: 2,
        jobs_imported: 2,
        jobs_skipped: 0,
        jobs_failed: 0
      });
    });

    it('should handle auto_publish option correctly', async () => {
      const autoPublishData = {
        ...validBulkImportData,
        auto_publish: true
      };

      const mockCreateJob = jest.fn().mockResolvedValue({ id: 'job-123', status: 'draft' });
      const mockPublishJob = jest.fn().mockResolvedValue({ id: 'job-123', status: 'active' });
      const mockCreateImportHistory = jest.fn().mockResolvedValue({ id: 'import-456' });
      
      jobsService.createJob = mockCreateJob;
      jobsService.publishJob = mockPublishJob;
      jobsService.createImportHistory = mockCreateImportHistory;

      const result = await jobsService.bulkImportJobs(autoPublishData);

      expect(mockPublishJob).toHaveBeenCalledTimes(2);
      expect(result.jobs_created.every(job => job.status === 'active')).toBe(true);
    });

    it('should deduplicate jobs when enabled', async () => {
      const mockFindExistingJobs = jest.fn().mockResolvedValue([
        { source_id: 'tc_123', company_name: 'TechCorp Ltd' }
      ]);
      const mockCreateJob = jest.fn().mockResolvedValue({ id: 'job-456', status: 'draft' });
      const mockCreateImportHistory = jest.fn().mockResolvedValue({ id: 'import-789' });
      
      jobsService.findExistingJobsBySourceId = mockFindExistingJobs;
      jobsService.createJob = mockCreateJob;
      jobsService.createImportHistory = mockCreateImportHistory;

      const result = await jobsService.bulkImportJobs(validBulkImportData);

      expect(result.imported_count).toBe(1); // Only one job imported
      expect(result.skipped_count).toBe(1); // One job skipped due to duplicate
      expect(mockCreateJob).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failures gracefully', async () => {
      const mockCreateJob = jest.fn()
        .mockResolvedValueOnce({ id: 'job-123', status: 'draft' })
        .mockRejectedValueOnce(new Error('Database error'));
      const mockCreateImportHistory = jest.fn().mockResolvedValue({ id: 'import-456' });
      
      jobsService.createJob = mockCreateJob;
      jobsService.createImportHistory = mockCreateImportHistory;

      const result = await jobsService.bulkImportJobs(validBulkImportData);

      expect(result.imported_count).toBe(1);
      expect(result.failed_count).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Product Manager');
      expect(result.errors[0]).toContain('Database error');
    });

    it('should validate job data before import', async () => {
      const invalidData = {
        ...validBulkImportData,
        jobs: [
          {
            title: 'A', // Too short
            description: 'Short', // Too short
            company_name: '',
            salary_min: -1000, // Negative
            salary_max: 50000
          }
        ]
      };

      const mockCreateImportHistory = jest.fn().mockResolvedValue({ id: 'import-456' });
      jobsService.createImportHistory = mockCreateImportHistory;

      const result = await jobsService.bulkImportJobs(invalidData);

      expect(result.imported_count).toBe(0);
      expect(result.failed_count).toBe(1);
      expect(result.errors[0]).toContain('validation');
    });

    it('should respect the maximum job limit', async () => {
      const largeBulkData = {
        ...validBulkImportData,
        jobs: Array(1001).fill(validBulkImportData.jobs[0]) // 1001 jobs exceeds limit
      };

      await expect(jobsService.bulkImportJobs(largeBulkData))
        .rejects
        .toThrow('Too many jobs in bulk import. Maximum 1000 jobs allowed.');
    });

    it('should handle company resolution correctly', async () => {
      const mockFindOrCreateCompany = jest.fn()
        .mockResolvedValueOnce({ id: 'company-123' })
        .mockResolvedValueOnce({ id: 'company-456' });
      const mockCreateJob = jest.fn().mockResolvedValue({ id: 'job-123', status: 'draft' });
      const mockCreateImportHistory = jest.fn().mockResolvedValue({ id: 'import-456' });
      
      jobsService.findOrCreateCompany = mockFindOrCreateCompany;
      jobsService.createJob = mockCreateJob;
      jobsService.createImportHistory = mockCreateImportHistory;

      await jobsService.bulkImportJobs(validBulkImportData);

      expect(mockFindOrCreateCompany).toHaveBeenCalledWith('TechCorp Ltd');
      expect(mockFindOrCreateCompany).toHaveBeenCalledWith('StartupCo');
      expect(mockCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({ company_id: 'company-123' })
      );
    });
  });

  describe('getImportHistory', () => {
    it('should return paginated import history', async () => {
      const mockHistory = [
        {
          id: 'import-1',
          source_name: 'TechJobs',
          imported_at: '2024-01-15T10:00:00Z',
          jobs_imported: 25,
          jobs_skipped: 3,
          jobs_failed: 2
        },
        {
          id: 'import-2', 
          source_name: 'JobBoard',
          imported_at: '2024-01-14T15:30:00Z',
          jobs_imported: 18,
          jobs_skipped: 1,
          jobs_failed: 0
        }
      ];

      const mockQuery = jest.fn().mockResolvedValue(mockHistory);
      const mockCount = jest.fn().mockResolvedValue([{ count: 15 }]);
      
      // Mock database query methods
      jobsService.queryImportHistory = mockQuery;
      jobsService.countImportHistory = mockCount;

      const result = await jobsService.getImportHistory({ page: 1, limit: 20 });

      expect(result).toEqual({
        imports: mockHistory,
        total: 15,
        page: 1,
        limit: 20,
        totalPages: 1
      });
    });

    it('should handle empty import history', async () => {
      const mockQuery = jest.fn().mockResolvedValue([]);
      const mockCount = jest.fn().mockResolvedValue([{ count: 0 }]);
      
      jobsService.queryImportHistory = mockQuery;
      jobsService.countImportHistory = mockCount;

      const result = await jobsService.getImportHistory({ page: 1, limit: 20 });

      expect(result.imports).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findExistingJobsBySourceId', () => {
    it('should find jobs by source_id and company_name', async () => {
      const sourceIds = ['tc_123', 'sc_456'];
      const mockJobs = [
        { id: 'job-1', source_id: 'tc_123', company_name: 'TechCorp Ltd' }
      ];

      const mockQuery = jest.fn().mockResolvedValue(mockJobs);
      jobsService.queryJobsBySourceIds = mockQuery;

      const result = await jobsService.findExistingJobsBySourceId(sourceIds);

      expect(result).toEqual(mockJobs);
      expect(mockQuery).toHaveBeenCalledWith(sourceIds);
    });
  });

  describe('findOrCreateCompany', () => {
    it('should return existing company if found', async () => {
      const mockCompany = { id: 'company-123', name: 'TechCorp Ltd' };
      const mockFindCompany = jest.fn().mockResolvedValue(mockCompany);
      
      jobsService.findCompanyByName = mockFindCompany;

      const result = await jobsService.findOrCreateCompany('TechCorp Ltd');

      expect(result).toEqual(mockCompany);
      expect(mockFindCompany).toHaveBeenCalledWith('TechCorp Ltd');
    });

    it('should create new company if not found', async () => {
      const mockFindCompany = jest.fn().mockResolvedValue(null);
      const mockCreateCompany = jest.fn().mockResolvedValue({ 
        id: 'company-456', 
        name: 'NewCorp Ltd' 
      });
      
      jobsService.findCompanyByName = mockFindCompany;
      jobsService.createImportedCompany = mockCreateCompany;

      const result = await jobsService.findOrCreateCompany('NewCorp Ltd');

      expect(result.id).toBe('company-456');
      expect(mockCreateCompany).toHaveBeenCalledWith('NewCorp Ltd');
    });
  });

  describe('validateImportedJob', () => {
    it('should return true for valid job data', () => {
      const validJob = validBulkImportData.jobs[0];
      
      const result = jobsService.validateImportedJob(validJob);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return false and errors for invalid job data', () => {
      const invalidJob = {
        title: 'A', // Too short
        description: 'Short', // Too short 
        company_name: '',
        salary_min: -1000,
        salary_max: 50000
      };
      
      const result = jobsService.validateImportedJob(invalidJob);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('title'))).toBe(true);
      expect(result.errors.some(error => error.includes('description'))).toBe(true);
      expect(result.errors.some(error => error.includes('company_name'))).toBe(true);
      expect(result.errors.some(error => error.includes('salary_min'))).toBe(true);
    });
  });
});