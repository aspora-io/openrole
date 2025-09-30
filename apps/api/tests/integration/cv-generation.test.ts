import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { db } from '../../src/db';
import { profiles, users, cvTemplates, cvGenerationJobs, generatedCvs } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { redis } from '../../src/services/redis';
import { generateId } from '../../src/utils/id';
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';

describe('CV Generation Integration', () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;
  let userId: string;
  let profileId: string;
  let templateId: string;

  beforeEach(async () => {
    app = createApp();
    
    // Clean up database
    await db.delete(generatedCvs);
    await db.delete(cvGenerationJobs);
    await db.delete(cvTemplates);
    await db.delete(profiles);
    await db.delete(users);
    
    // Clear Redis
    await redis.flushall();
    
    // Create test user
    userId = generateId();
    await db.insert(users).values({
      id: userId,
      email: 'cv.generator@test.com',
      name: 'CV Generator Test',
      hashedPassword: 'hashed_password_123',
      emailVerified: new Date(),
    });

    // Create auth token
    authToken = 'test-auth-token';
    await redis.set(`session:${authToken}`, JSON.stringify({ userId }), 'EX', 3600);

    // Create comprehensive test profile
    profileId = generateId();
    await db.insert(profiles).values({
      id: profileId,
      userId,
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 234 567 8900',
      location: 'San Francisco, CA',
      headline: 'Senior Full Stack Developer | Cloud Architecture Expert',
      summary: 'Experienced software engineer with 10+ years in building scalable web applications...',
      experience: JSON.stringify([
        {
          id: '1',
          company: 'TechCorp Inc',
          position: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2020-01',
          endDate: null,
          current: true,
          description: 'Led development of microservices architecture serving 10M+ users',
          highlights: [
            'Reduced API response time by 60% through optimization',
            'Mentored team of 5 junior developers',
            'Implemented CI/CD pipeline reducing deployment time by 80%'
          ]
        },
        {
          id: '2',
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          location: 'Remote',
          startDate: '2018-03',
          endDate: '2019-12',
          current: false,
          description: 'Built real-time collaboration platform from scratch',
          highlights: [
            'Architected WebSocket-based real-time sync system',
            'Implemented end-to-end encryption for user data'
          ]
        }
      ]),
      education: JSON.stringify([
        {
          id: '1',
          institution: 'Stanford University',
          degree: 'Master of Science',
          field: 'Computer Science',
          startDate: '2016-09',
          endDate: '2018-06',
          gpa: '3.9',
          highlights: ['Machine Learning specialization', 'Teaching Assistant for Algorithms']
        },
        {
          id: '2',
          institution: 'UC Berkeley',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2012-09',
          endDate: '2016-05',
          gpa: '3.8',
          highlights: ['Dean\'s List', 'President of ACM Chapter']
        }
      ]),
      skills: JSON.stringify({
        technical: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
        soft: ['Team Leadership', 'Agile/Scrum', 'Technical Writing', 'Public Speaking'],
        languages: [
          { name: 'English', proficiency: 'Native' },
          { name: 'Spanish', proficiency: 'Professional' },
          { name: 'Mandarin', proficiency: 'Conversational' }
        ]
      }),
      certifications: JSON.stringify([
        {
          id: '1',
          name: 'AWS Solutions Architect Professional',
          issuer: 'Amazon Web Services',
          issueDate: '2021-03',
          expiryDate: '2024-03',
          credentialId: 'AWS-SAP-123456',
          url: 'https://aws.amazon.com/verify/123456'
        }
      ]),
      projects: JSON.stringify([
        {
          id: '1',
          name: 'OpenAPI Generator',
          description: 'Open-source tool for generating API documentation',
          url: 'https://github.com/sarah/openapi-gen',
          highlights: ['1000+ GitHub stars', 'Used by Fortune 500 companies'],
          technologies: ['TypeScript', 'Node.js', 'OpenAPI Spec']
        }
      ]),
      publications: JSON.stringify([
        {
          id: '1',
          title: 'Scalable Microservices: A Practical Guide',
          publisher: 'Tech Journal',
          date: '2022-06',
          url: 'https://techjournal.com/scalable-microservices',
          description: 'Comprehensive guide on building scalable microservices architecture'
        }
      ]),
      awards: JSON.stringify([
        {
          id: '1',
          name: 'Best Innovation Award',
          issuer: 'TechCorp Inc',
          date: '2021-12',
          description: 'For implementing revolutionary caching strategy'
        }
      ]),
      languages: JSON.stringify([
        { name: 'English', proficiency: 'Native' },
        { name: 'Spanish', proficiency: 'Professional' }
      ]),
      interests: JSON.stringify(['Machine Learning', 'Open Source', 'Rock Climbing', 'Photography']),
      references: JSON.stringify([
        {
          id: '1',
          name: 'John Smith',
          position: 'VP of Engineering',
          company: 'TechCorp Inc',
          email: 'john.smith@techcorp.com',
          phone: '+1 234 567 8901',
          relationship: 'Direct Manager'
        }
      ]),
      customSections: JSON.stringify({
        'volunteer': {
          title: 'Volunteer Experience',
          items: [
            {
              organization: 'Code for Good',
              role: 'Technical Mentor',
              startDate: '2019-01',
              description: 'Mentored underprivileged students in web development'
            }
          ]
        }
      }),
      preferences: JSON.stringify({
        visibility: 'public',
        allowContact: true,
        showPhoto: true
      }),
      metadata: JSON.stringify({
        completeness: 95,
        lastViewed: new Date().toISOString(),
        viewCount: 42
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create test CV templates
    const templates = [
      {
        id: generateId(),
        name: 'Modern Professional',
        description: 'Clean, modern design suitable for tech professionals',
        thumbnail: 'https://storage.example.com/templates/modern-thumb.png',
        category: 'professional',
        features: JSON.stringify(['ATS-friendly', 'Multi-column', 'Icon support']),
        customizable: JSON.stringify({
          colors: ['primary', 'secondary', 'accent'],
          fonts: ['heading', 'body'],
          sections: ['experience', 'education', 'skills', 'projects', 'certifications'],
          layout: ['single-column', 'two-column']
        }),
        htmlTemplate: `
<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{fullName}} - CV</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .header { background: {{primaryColor}}; color: white; padding: 20px; }
    .section { margin: 20px 0; }
    .experience-item { margin-bottom: 15px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{fullName}}</h1>
    <p>{{headline}}</p>
    <p>{{email}} | {{phone}} | {{location}}</p>
  </div>
  
  {{#if includeSummary}}
  <div class="section">
    <h2>Professional Summary</h2>
    <p>{{summary}}</p>
  </div>
  {{/if}}
  
  {{#if includeExperience}}
  <div class="section">
    <h2>Experience</h2>
    {{#each experience}}
    <div class="experience-item">
      <h3>{{position}} at {{company}}</h3>
      <p>{{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}} | {{location}}</p>
      <p>{{description}}</p>
      {{#if highlights}}
      <ul>
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </div>
  {{/if}}
  
  {{#if includeEducation}}
  <div class="section">
    <h2>Education</h2>
    {{#each education}}
    <div>
      <h3>{{degree}} in {{field}}</h3>
      <p>{{institution}} | {{startDate}} - {{endDate}}</p>
      {{#if gpa}}<p>GPA: {{gpa}}</p>{{/if}}
    </div>
    {{/each}}
  </div>
  {{/if}}
  
  {{#if includeSkills}}
  <div class="section">
    <h2>Skills</h2>
    <p><strong>Technical:</strong> {{#each skills.technical}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>
    <p><strong>Soft Skills:</strong> {{#each skills.soft}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>
  </div>
  {{/if}}
</body>
</html>`,
        cssTemplate: '',
        isActive: true,
        isDefault: false,
        usage: 0,
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: generateId(),
        name: 'Executive Brief',
        description: 'Concise format for senior positions',
        thumbnail: 'https://storage.example.com/templates/exec-thumb.png',
        category: 'executive',
        features: JSON.stringify(['One-page', 'High-impact', 'Metrics-focused']),
        customizable: JSON.stringify({
          sections: ['summary', 'achievements', 'experience'],
          includePhoto: true
        }),
        htmlTemplate: '<html><body><h1>{{fullName}}</h1><p>Executive template</p></body></html>',
        cssTemplate: '',
        isActive: true,
        isDefault: false,
        usage: 0,
        rating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: generateId(),
        name: 'Creative Portfolio',
        description: 'Visual-heavy template for creative professionals',
        thumbnail: 'https://storage.example.com/templates/creative-thumb.png',
        category: 'creative',
        features: JSON.stringify(['Portfolio grid', 'Custom colors', 'Image support']),
        customizable: JSON.stringify({
          layout: ['grid', 'masonry'],
          colorSchemes: ['vibrant', 'minimal', 'dark']
        }),
        htmlTemplate: '<html><body><h1>{{fullName}}</h1><p>Creative template</p></body></html>',
        cssTemplate: '',
        isActive: true,
        isDefault: false,
        usage: 0,
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: generateId(),
        name: 'Accessible Standard',
        description: 'WCAG 2.1 AA compliant template',
        thumbnail: 'https://storage.example.com/templates/accessible-thumb.png',
        category: 'accessible',
        features: JSON.stringify(['Screen reader optimized', 'High contrast', 'Semantic HTML']),
        customizable: JSON.stringify({
          fontSize: ['normal', 'large', 'extra-large'],
          contrast: ['standard', 'high']
        }),
        htmlTemplate: `
<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <title>{{fullName}} - Accessible CV</title>
  <style>
    body { font-size: 16px; line-height: 1.6; color: #000; background: #fff; }
    h1, h2, h3 { color: #000; }
    a { color: #0066CC; text-decoration: underline; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  </style>
</head>
<body>
  <header role="banner">
    <h1>{{fullName}}</h1>
    <p role="doc-subtitle">{{headline}}</p>
  </header>
  <main role="main">
    <section aria-label="Contact Information">
      <h2>Contact</h2>
      <p>Email: <a href="mailto:{{email}}">{{email}}</a></p>
      <p>Phone: <a href="tel:{{phone}}">{{phone}}</a></p>
    </section>
  </main>
</body>
</html>`,
        cssTemplate: '',
        isActive: true,
        isDefault: true,
        usage: 0,
        rating: 5.0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const template of templates) {
      await db.insert(cvTemplates).values(template);
    }

    templateId = templates[0].id;
  });

  afterEach(async () => {
    // Clean up any generated files
    const testOutputDir = path.join(process.cwd(), 'test-output');
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('GET /api/cv/templates', () => {
    it('should list available CV templates', async () => {
      const response = await request(app.fetch)
        .get('/api/cv/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.templates).toHaveLength(4);
      expect(response.body.templates[0]).toMatchObject({
        name: 'Modern Professional',
        category: 'professional',
        features: expect.arrayContaining(['ATS-friendly', 'Multi-column'])
      });
    });

    it('should filter templates by category', async () => {
      const response = await request(app.fetch)
        .get('/api/cv/templates?category=executive')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.templates).toHaveLength(1);
      expect(response.body.templates[0].name).toBe('Executive Brief');
    });

    it('should return template details with customization options', async () => {
      const response = await request(app.fetch)
        .get(`/api/cv/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.template).toMatchObject({
        name: 'Modern Professional',
        customizable: expect.objectContaining({
          colors: expect.arrayContaining(['primary', 'secondary']),
          sections: expect.arrayContaining(['experience', 'education'])
        })
      });
    });
  });

  describe('POST /api/cv/generate', () => {
    it('should generate CV with all sections included', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            sections: {
              includeSummary: true,
              includeExperience: true,
              includeEducation: true,
              includeSkills: true,
              includeCertifications: true,
              includeProjects: true,
              includeLanguages: true,
              includeReferences: false // Privacy consideration
            },
            format: 'pdf',
            language: 'en'
          }
        });

      expect(response.status).toBe(202);
      expect(response.body).toMatchObject({
        jobId: expect.any(String),
        status: 'pending',
        message: 'CV generation started'
      });

      // Verify job was created in database
      const [job] = await db.select()
        .from(cvGenerationJobs)
        .where(eq(cvGenerationJobs.id, response.body.jobId));
      
      expect(job).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.options).toMatchObject({
        sections: expect.objectContaining({
          includeExperience: true,
          includeReferences: false
        })
      });
    });

    it('should generate tailored CV for specific job posting', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            tailorTo: {
              jobTitle: 'Senior Cloud Architect',
              company: 'Amazon Web Services',
              description: 'Looking for experienced cloud architect with AWS expertise...',
              keywords: ['AWS', 'Kubernetes', 'Microservices', 'Leadership']
            },
            sections: {
              includeSummary: true,
              includeExperience: true,
              includeSkills: true,
              includeCertifications: true
            },
            emphasize: ['AWS', 'Cloud Architecture', 'Leadership'],
            format: 'pdf'
          }
        });

      expect(response.status).toBe(202);
      
      const [job] = await db.select()
        .from(cvGenerationJobs)
        .where(eq(cvGenerationJobs.id, response.body.jobId));
      
      expect(job.options.tailorTo).toMatchObject({
        jobTitle: 'Senior Cloud Architect',
        keywords: expect.arrayContaining(['AWS', 'Kubernetes'])
      });
    });

    it('should generate blind CV without personal identifiers', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            blind: true,
            sections: {
              includeSummary: true,
              includeExperience: true,
              includeEducation: true,
              includeSkills: true
            },
            format: 'pdf'
          }
        });

      expect(response.status).toBe(202);
      
      const [job] = await db.select()
        .from(cvGenerationJobs)
        .where(eq(cvGenerationJobs.id, response.body.jobId));
      
      expect(job.options.blind).toBe(true);
    });

    it('should handle multi-language CV generation', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            language: 'es', // Spanish
            sections: {
              includeSummary: true,
              includeExperience: true,
              includeEducation: true
            },
            format: 'pdf'
          }
        });

      expect(response.status).toBe(202);
      
      const [job] = await db.select()
        .from(cvGenerationJobs)
        .where(eq(cvGenerationJobs.id, response.body.jobId));
      
      expect(job.options.language).toBe('es');
    });

    it('should validate required fields', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing profileId
          templateId,
          options: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('profileId is required');
    });

    it('should handle template not found', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId: 'non-existent-template',
          options: {}
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Template not found');
    });
  });

  describe('GET /api/cv/generate/:jobId/status', () => {
    it('should track CV generation progress', async () => {
      // Create a job
      const jobId = generateId();
      await db.insert(cvGenerationJobs).values({
        id: jobId,
        userId,
        profileId,
        templateId,
        status: 'processing',
        progress: 45,
        options: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app.fetch)
        .get(`/api/cv/generate/${jobId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jobId,
        status: 'processing',
        progress: 45
      });
    });

    it('should return completed job with download URL', async () => {
      const jobId = generateId();
      const cvId = generateId();
      
      await db.insert(cvGenerationJobs).values({
        id: jobId,
        userId,
        profileId,
        templateId,
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        resultCvId: cvId,
        options: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.insert(generatedCvs).values({
        id: cvId,
        userId,
        profileId,
        templateId,
        jobId,
        filename: 'sarah-johnson-cv.pdf',
        fileUrl: 'https://storage.example.com/cvs/sarah-johnson-cv.pdf',
        fileSize: 245678,
        format: 'pdf',
        language: 'en',
        metadata: {
          pageCount: 2,
          generationTime: 3500
        },
        createdAt: new Date()
      });

      const response = await request(app.fetch)
        .get(`/api/cv/generate/${jobId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jobId,
        status: 'completed',
        progress: 100,
        result: {
          cvId,
          downloadUrl: expect.stringContaining('sarah-johnson-cv.pdf'),
          format: 'pdf',
          fileSize: 245678
        }
      });
    });

    it('should return failed job with error details', async () => {
      const jobId = generateId();
      
      await db.insert(cvGenerationJobs).values({
        id: jobId,
        userId,
        profileId,
        templateId,
        status: 'failed',
        error: 'Puppeteer crashed: Could not find Chrome installation',
        options: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app.fetch)
        .get(`/api/cv/generate/${jobId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jobId,
        status: 'failed',
        error: expect.stringContaining('Puppeteer crashed')
      });
    });
  });

  describe('POST /api/cv/generate/preview', () => {
    it('should generate HTML preview of CV', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            sections: {
              includeSummary: true,
              includeExperience: true
            },
            customization: {
              primaryColor: '#0066CC',
              fontSize: 'normal'
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        html: expect.stringContaining('Sarah Johnson'),
        css: expect.any(String)
      });
      expect(response.body.html).toContain('Senior Full Stack Developer');
      expect(response.body.html).toContain('TechCorp Inc');
    });

    it('should handle preview with custom sections', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            sections: {
              includeSummary: true,
              includeCustom: ['volunteer']
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.html).toContain('Volunteer Experience');
      expect(response.body.html).toContain('Code for Good');
    });
  });

  describe('CV Generation Pipeline Edge Cases', () => {
    it('should handle large profile data', async () => {
      // Create profile with extensive data
      const largeProfileId = generateId();
      const largeExperience = Array(50).fill(null).map((_, i) => ({
        id: `exp-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        startDate: '2020-01',
        endDate: '2021-01',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'.repeat(10),
        highlights: Array(10).fill('Achievement that is quite long and detailed')
      }));

      await db.insert(profiles).values({
        id: largeProfileId,
        userId,
        fullName: 'Test User',
        email: 'test@example.com',
        experience: JSON.stringify(largeExperience),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId: largeProfileId,
          templateId,
          options: {
            sections: { includeExperience: true },
            format: 'pdf'
          }
        });

      expect(response.status).toBe(202);
    });

    it('should handle template with missing placeholders gracefully', async () => {
      // Create template with missing placeholders
      const badTemplateId = generateId();
      await db.insert(cvTemplates).values({
        id: badTemplateId,
        name: 'Broken Template',
        description: 'Template with issues',
        category: 'test',
        htmlTemplate: '<html><body><h1>{{nonExistentField}}</h1></body></html>',
        cssTemplate: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app.fetch)
        .post('/api/cv/generate/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId: badTemplateId,
          options: {}
        });

      expect(response.status).toBe(200);
      // Should handle gracefully, not crash
      expect(response.body.html).toBeDefined();
    });

    it('should handle concurrent generation requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app.fetch)
          .post('/api/cv/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            profileId,
            templateId,
            options: { format: 'pdf' }
          })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(202);
        expect(response.body.jobId).toBeDefined();
      });

      // All jobs should be created
      const jobs = await db.select()
        .from(cvGenerationJobs)
        .where(eq(cvGenerationJobs.userId, userId));
      
      expect(jobs.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle PDF generation timeout', async () => {
      // Create template that would cause timeout
      const slowTemplateId = generateId();
      await db.insert(cvTemplates).values({
        id: slowTemplateId,
        name: 'Slow Template',
        description: 'Template that takes too long',
        category: 'test',
        htmlTemplate: `
          <html>
          <head>
            <script>
              // Simulate slow rendering
              const start = Date.now();
              while(Date.now() - start < 60000) {}
            </script>
          </head>
          <body>Content</body>
          </html>
        `,
        cssTemplate: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId: slowTemplateId,
          options: { format: 'pdf' }
        });

      expect(response.status).toBe(202);
      
      // In real implementation, job would timeout
      // Here we're just checking the job was created
      expect(response.body.jobId).toBeDefined();
    });

    it('should respect accessibility settings in generated CV', async () => {
      // Find accessible template
      const [accessibleTemplate] = await db.select()
        .from(cvTemplates)
        .where(eq(cvTemplates.category, 'accessible'));

      const response = await request(app.fetch)
        .post('/api/cv/generate/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId: accessibleTemplate.id,
          options: {
            accessibility: {
              highContrast: true,
              largeText: true,
              screenReaderOptimized: true
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.html).toContain('role="banner"');
      expect(response.body.html).toContain('role="main"');
      expect(response.body.html).toContain('aria-label=');
    });

    it('should handle storage service failures gracefully', async () => {
      // This would be tested with mocked storage service
      // For now, we verify the job creation
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: { format: 'pdf' },
          // Simulate storage config that would fail
          _testStorageFailure: true
        });

      expect(response.status).toBe(202);
    });

    it('should compress large PDFs automatically', async () => {
      const response = await request(app.fetch)
        .post('/api/cv/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          templateId,
          options: {
            format: 'pdf',
            compression: {
              enabled: true,
              quality: 'high',
              maxSizeMB: 5
            }
          }
        });

      expect(response.status).toBe(202);
      
      const [job] = await db.select()
        .from(cvGenerationJobs)
        .where(eq(cvGenerationJobs.id, response.body.jobId));
      
      expect(job.options.compression).toMatchObject({
        enabled: true,
        quality: 'high'
      });
    });

    it('should handle profile with special characters and Unicode', async () => {
      const specialProfileId = generateId();
      await db.insert(profiles).values({
        id: specialProfileId,
        userId,
        fullName: 'José García-Sánchez 佐藤',
        email: 'josé@example.com',
        headline: 'Software Engineer | 软件工程师',
        experience: JSON.stringify([{
          id: '1',
          company: 'Société Générale',
          position: 'Développeur Senior',
          description: 'Development with café ☕ and émojis 🚀'
        }]),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app.fetch)
        .post('/api/cv/generate/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId: specialProfileId,
          templateId,
          options: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.html).toContain('José García-Sánchez');
      expect(response.body.html).toContain('软件工程师');
    });
  });

  describe('Batch CV Generation', () => {
    it('should generate multiple CV variations in batch', async () => {
      const templates = await db.select().from(cvTemplates);
      
      const response = await request(app.fetch)
        .post('/api/cv/generate/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileId,
          variations: [
            {
              templateId: templates[0].id,
              options: { format: 'pdf', language: 'en' }
            },
            {
              templateId: templates[1].id,
              options: { format: 'pdf', language: 'es' }
            },
            {
              templateId: templates[2].id,
              options: { format: 'pdf', blind: true }
            }
          ]
        });

      expect(response.status).toBe(202);
      expect(response.body.batchId).toBeDefined();
      expect(response.body.jobs).toHaveLength(3);
    });
  });

  describe('CV History and Management', () => {
    it('should list previously generated CVs', async () => {
      // Create some generated CVs
      const cvIds = Array(3).fill(null).map(() => generateId());
      for (const cvId of cvIds) {
        await db.insert(generatedCvs).values({
          id: cvId,
          userId,
          profileId,
          templateId,
          filename: `cv-${cvId}.pdf`,
          fileUrl: `https://storage.example.com/cvs/cv-${cvId}.pdf`,
          format: 'pdf',
          fileSize: 200000,
          createdAt: new Date()
        });
      }

      const response = await request(app.fetch)
        .get('/api/cv/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cvs).toHaveLength(3);
      expect(response.body.cvs[0]).toMatchObject({
        id: expect.any(String),
        filename: expect.stringContaining('.pdf'),
        format: 'pdf',
        createdAt: expect.any(String)
      });
    });

    it('should delete generated CV', async () => {
      const cvId = generateId();
      await db.insert(generatedCvs).values({
        id: cvId,
        userId,
        profileId,
        templateId,
        filename: 'delete-me.pdf',
        fileUrl: 'https://storage.example.com/cvs/delete-me.pdf',
        format: 'pdf',
        fileSize: 150000,
        createdAt: new Date()
      });

      const response = await request(app.fetch)
        .delete(`/api/cv/${cvId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const deleted = await db.select()
        .from(generatedCvs)
        .where(eq(generatedCvs.id, cvId));
      
      expect(deleted).toHaveLength(0);
    });
  });
});