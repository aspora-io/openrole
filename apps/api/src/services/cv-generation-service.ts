/**
 * CVGenerationService - Dynamic CV generation with Puppeteer
 * 
 * Generates professional CVs from candidate profiles using customizable
 * templates, with support for PDF export, multiple formats, and real-time preview.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { eq, and } from 'drizzle-orm';
import { db, candidateProfiles, workExperience, education, portfolioItems, cvDocuments } from '../lib/database';
import { fileUploadService } from './file-upload-service';

// Type definitions - TODO: Add proper types from database schema
type SelectCandidateProfile = any;
type SelectWorkExperience = any;
type SelectEducation = any;
type SelectPortfolioItem = any;
type InsertCVDocument = any;
type CVGenerationRequest = any;
type CVSections = any;
type CVCustomizations = any;

enum CVStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ats-safe' | 'modern' | 'classic' | 'creative';
  preview: string; // URL to preview image
  htmlTemplate: string; // Path to HTML template
  cssStyles: string; // Path to CSS styles
  isActive: boolean;
  createdAt: Date;
}

export interface CVGenerationOptions {
  templateId: string;
  label: string;
  isDefault?: boolean;
  sections: CVSections;
  customizations?: CVCustomizations;
  format?: 'pdf' | 'html' | 'png';
  quality?: 'draft' | 'standard' | 'high';
}

export interface CVGenerationResult {
  cvId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  format: string;
  generatedAt: Date;
  templateUsed: string;
  previewUrl?: string;
  downloadUrl: string;
}

export interface CVPreviewResult {
  previewHtml: string;
  previewUrl: string;
  templateId: string;
  sections: string[];
  estimatedPages: number;
}

export interface CVData {
  profile: SelectCandidateProfile;
  workExperience: SelectWorkExperience[];
  education: SelectEducation[];
  portfolioItems: SelectPortfolioItem[];
  user?: any; // User data from auth system
}

export interface ICVGenerationService {
  // Template management
  getAvailableTemplates(): Promise<CVTemplate[]>;
  getTemplate(templateId: string): Promise<CVTemplate | null>;
  
  // CV generation
  generateCV(userId: string, options: CVGenerationOptions): Promise<CVGenerationResult>;
  regenerateCV(cvId: string, userId: string, options?: Partial<CVGenerationOptions>): Promise<CVGenerationResult>;
  
  // Preview generation
  previewCV(userId: string, options: CVGenerationOptions): Promise<CVPreviewResult>;
  previewTemplate(templateId: string, sampleData?: boolean): Promise<CVPreviewResult>;
  
  // Data collection and processing
  collectCVData(userId: string): Promise<CVData>;
  processCVSections(data: CVData, sections: CVSections): Promise<any>;
  
  // Template rendering
  renderTemplate(template: CVTemplate, data: any, customizations?: CVCustomizations): Promise<string>;
  generatePDF(htmlContent: string, options?: any): Promise<Buffer>;
  
  // Utility functions
  estimatePages(htmlContent: string): Promise<number>;
  optimizeForATS(htmlContent: string): Promise<string>;
  validateGeneration(options: CVGenerationOptions): Promise<{ isValid: boolean; errors: string[] }>;
}

export class CVGenerationService implements ICVGenerationService {
  private browser: Browser | null = null;
  private readonly templatesPath: string;
  private readonly outputPath: string;
  private readonly defaultTemplates: CVTemplate[];

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/cv');
    this.outputPath = process.env.OUTPUT_PATH || './generated';
    this.defaultTemplates = this.initializeDefaultTemplates();
    this.ensureDirectories();
  }

  /**
   * Get browser instance (singleton)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Get available CV templates
   */
  async getAvailableTemplates(): Promise<CVTemplate[]> {
    return this.defaultTemplates.filter(t => t.isActive);
  }

  /**
   * Get specific template by ID
   */
  async getTemplate(templateId: string): Promise<CVTemplate | null> {
    return this.defaultTemplates.find(t => t.id === templateId) || null;
  }

  /**
   * Generate CV from profile data
   */
  async generateCV(userId: string, options: CVGenerationOptions): Promise<CVGenerationResult> {
    // Validate generation options
    const validation = await this.validateGeneration(options);
    if (!validation.isValid) {
      throw new Error(`CV generation validation failed: ${validation.errors.join(', ')}`);
    }

    // Collect user data
    const cvData = await this.collectCVData(userId);
    if (!cvData.profile) {
      throw new Error('User profile not found');
    }

    // Get template
    const template = await this.getTemplate(options.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Process sections based on configuration
    const processedData = await this.processCVSections(cvData, options.sections);

    // Render template with data
    const htmlContent = await this.renderTemplate(template, processedData, options.customizations);

    // Generate output based on format
    let outputBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    switch (options.format || 'pdf') {
      case 'pdf':
        outputBuffer = await this.generatePDF(htmlContent, {
          quality: options.quality || 'standard'
        });
        fileName = `${options.label.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        mimeType = 'application/pdf';
        break;
      
      case 'html':
        outputBuffer = Buffer.from(htmlContent, 'utf8');
        fileName = `${options.label.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        mimeType = 'text/html';
        break;
      
      case 'png':
        outputBuffer = await this.generateImage(htmlContent);
        fileName = `${options.label.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        mimeType = 'image/png';
        break;
      
      default:
        throw new Error('Unsupported output format');
    }

    // Save to file system
    const outputDir = path.join(this.outputPath, userId);
    await fs.promises.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, fileName);
    await writeFile(filePath, outputBuffer);

    // Save to database
    const cvRecord: InsertCVDocument = {
      userId,
      fileName,
      filePath: fileName, // Store relative path
      fileSize: outputBuffer.length,
      mimeType,
      label: options.label,
      isDefault: options.isDefault || false,
      status: CVStatus.ACTIVE,
      checksum: await this.generateChecksum(outputBuffer),
      metadata: {
        templateId: template.id,
        templateName: template.name,
        sections: Object.keys(options.sections).filter(key => options.sections[key]),
        customizations: options.customizations,
        generatedAt: new Date(),
        format: options.format || 'pdf'
      },
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If setting as default, unset other defaults
    if (options.isDefault) {
      await db
        .update(cvDocuments)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(cvDocuments.userId, userId));
    }

    const [savedCV] = await db
      .insert(cvDocuments)
      .values(cvRecord)
      .returning();

    return {
      cvId: savedCV.id,
      fileName,
      filePath: fileName,
      fileSize: outputBuffer.length,
      format: options.format || 'pdf',
      generatedAt: new Date(),
      templateUsed: template.name,
      downloadUrl: `/api/cv/${savedCV.id}/download`
    };
  }

  /**
   * Regenerate existing CV with new options
   */
  async regenerateCV(cvId: string, userId: string, options?: Partial<CVGenerationOptions>): Promise<CVGenerationResult> {
    // Get existing CV
    const [existingCV] = await db
      .select()
      .from(cvDocuments)
      .where(
        and(
          eq(cvDocuments.id, cvId),
          eq(cvDocuments.userId, userId)
        )
      )
      .limit(1);

    if (!existingCV) {
      throw new Error('CV not found or access denied');
    }

    // Merge options with existing metadata
    const metadata = existingCV.metadata as any || {};
    const generationOptions: CVGenerationOptions = {
      templateId: options?.templateId || metadata.templateId || this.defaultTemplates[0].id,
      label: options?.label || existingCV.label,
      isDefault: options?.isDefault ?? existingCV.isDefault,
      sections: options?.sections || metadata.sections || {
        includePersonalDetails: true,
        includeWorkExperience: true,
        includeEducation: true,
        includeSkills: true,
        includePortfolio: false
      },
      customizations: options?.customizations || metadata.customizations,
      format: options?.format || metadata.format || 'pdf',
      quality: options?.quality || 'standard'
    };

    // Delete old file
    try {
      const oldFilePath = path.join(this.outputPath, userId, existingCV.filePath);
      await fs.promises.unlink(oldFilePath);
    } catch (error) {
      console.error('Failed to delete old CV file:', error);
    }

    // Generate new CV
    const result = await this.generateCV(userId, generationOptions);

    // Delete old database record
    await db
      .delete(cvDocuments)
      .where(eq(cvDocuments.id, cvId));

    return result;
  }

  /**
   * Generate CV preview without saving
   */
  async previewCV(userId: string, options: CVGenerationOptions): Promise<CVPreviewResult> {
    // Collect user data
    const cvData = await this.collectCVData(userId);
    if (!cvData.profile) {
      throw new Error('User profile not found');
    }

    // Get template
    const template = await this.getTemplate(options.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Process sections
    const processedData = await this.processCVSections(cvData, options.sections);

    // Render template
    const htmlContent = await this.renderTemplate(template, processedData, options.customizations);

    // Estimate pages
    const estimatedPages = await this.estimatePages(htmlContent);

    // Generate preview URL (temporary)
    const previewId = `preview_${userId}_${Date.now()}`;
    const previewPath = path.join(this.outputPath, 'previews', `${previewId}.html`);
    await fs.promises.mkdir(path.dirname(previewPath), { recursive: true });
    await writeFile(previewPath, htmlContent);

    return {
      previewHtml: htmlContent,
      previewUrl: `/api/cv/preview/${previewId}`,
      templateId: template.id,
      sections: Object.keys(options.sections).filter(key => options.sections[key]),
      estimatedPages
    };
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(templateId: string, sampleData = true): Promise<CVPreviewResult> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Use sample data or minimal data
    const data = sampleData ? this.getSampleCVData() : this.getMinimalCVData();
    
    const htmlContent = await this.renderTemplate(template, data);
    const estimatedPages = await this.estimatePages(htmlContent);

    return {
      previewHtml: htmlContent,
      previewUrl: '',
      templateId: template.id,
      sections: Object.keys(data).filter(key => data[key]),
      estimatedPages
    };
  }

  /**
   * Collect all CV data for user
   */
  async collectCVData(userId: string): Promise<CVData> {
    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1);

    const workHistory = await db
      .select()
      .from(workExperience)
      .where(eq(workExperience.userId, userId))
      .orderBy(workExperience.startDate);

    const educationHistory = await db
      .select()
      .from(education)
      .where(eq(education.userId, userId))
      .orderBy(education.startDate);

    const portfolio = await db
      .select()
      .from(portfolioItems)
      .where(
        and(
          eq(portfolioItems.userId, userId),
          eq(portfolioItems.isPublic, true)
        )
      )
      .orderBy(portfolioItems.sortOrder);

    return {
      profile,
      workExperience: workHistory,
      education: educationHistory,
      portfolioItems: portfolio
    };
  }

  /**
   * Process CV sections based on configuration
   */
  async processCVSections(data: CVData, sections: CVSections): Promise<any> {
    const processedData: any = {};

    if (sections.includePersonalDetails && data.profile) {
      processedData.profile = {
        headline: data.profile.headline,
        summary: data.profile.summary,
        location: data.profile.location,
        phoneNumber: data.profile.phoneNumber,
        linkedinUrl: data.profile.linkedinUrl,
        portfolioUrl: data.profile.portfolioUrl,
        githubUrl: data.profile.githubUrl
      };
    }

    if (sections.includeSkills && data.profile?.skills) {
      processedData.skills = data.profile.skills;
    }

    if (sections.includeWorkExperience) {
      processedData.workExperience = data.workExperience.map(exp => ({
        ...exp,
        duration: this.calculateDuration(exp.startDate, exp.endDate)
      }));
    }

    if (sections.includeEducation) {
      processedData.education = data.education;
    }

    if (sections.includePortfolio) {
      processedData.portfolio = data.portfolioItems;
    }

    // Add custom sections if any
    if (sections.customSections) {
      processedData.customSections = sections.customSections;
    }

    return processedData;
  }

  /**
   * Render template with data and customizations
   */
  async renderTemplate(template: CVTemplate, data: any, customizations?: CVCustomizations): Promise<string> {
    try {
      // Load template HTML
      let htmlTemplate = await this.loadTemplate(template.htmlTemplate);
      
      // Load and apply CSS
      const cssStyles = await this.loadCSS(template.cssStyles);
      
      // Apply customizations to CSS
      let customizedCSS = cssStyles;
      if (customizations) {
        customizedCSS = this.applyCSSCustomizations(cssStyles, customizations);
      }

      // Replace template variables with data
      htmlTemplate = this.replaceTemplateVariables(htmlTemplate, data);
      
      // Inject CSS into HTML
      const finalHTML = htmlTemplate.replace('{{CSS_STYLES}}', customizedCSS);
      
      return finalHTML;
      
    } catch (error) {
      console.error('Failed to render template:', error);
      throw new Error('Template rendering failed');
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePDF(htmlContent: string, options: any = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfOptions = {
        format: 'A4' as const,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      };

      // Adjust quality settings
      if (options.quality === 'high') {
        pdfOptions.margin = {
          top: '0.3in',
          right: '0.3in',
          bottom: '0.3in',
          left: '0.3in'
        };
      } else if (options.quality === 'draft') {
        // Keep default margins but could adjust other settings
      }

      const pdf = await page.pdf(pdfOptions);
      return Buffer.from(pdf);

    } finally {
      await page.close();
    }
  }

  /**
   * Generate PNG image from HTML content
   */
  private async generateImage(htmlContent: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 794, height: 1123 }); // A4 proportions
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
        quality: 90
      });

      return Buffer.from(screenshot);

    } finally {
      await page.close();
    }
  }

  /**
   * Estimate number of pages in HTML content
   */
  async estimatePages(htmlContent: string): Promise<number> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const metrics = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );
        return { height };
      });

      // A4 page height is approximately 1123px at 96 DPI
      const pageHeight = 1123;
      const estimatedPages = Math.ceil(metrics.height / pageHeight);
      
      return Math.max(1, estimatedPages);

    } finally {
      await page.close();
    }
  }

  /**
   * Optimize HTML for ATS systems
   */
  async optimizeForATS(htmlContent: string): Promise<string> {
    // Remove complex CSS and JavaScript
    let optimized = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/style="[^"]*"/gi, '');

    // Simplify structure for better parsing
    optimized = optimized
      .replace(/<div/gi, '<p')
      .replace(/<\/div>/gi, '</p>')
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '');

    return optimized;
  }

  /**
   * Validate CV generation options
   */
  async validateGeneration(options: CVGenerationOptions): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate template
    const template = await this.getTemplate(options.templateId);
    if (!template) {
      errors.push('Invalid template ID');
    }

    // TODO: Add proper Zod validation
    // Simple validation for now
    if (!options.label || typeof options.label !== 'string' || options.label.length === 0) {
      errors.push('CV label is required');
    }

    // Validate sections
    if (!options.sections || Object.keys(options.sections).length === 0) {
      errors.push('At least one section must be included');
    }

    // Simple customizations validation
    if (options.customizations) {
      if (typeof options.customizations !== 'object') {
        errors.push('Invalid customizations format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Load HTML template from file
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(this.templatesPath, templatePath);
    return await readFile(fullPath, 'utf8');
  }

  /**
   * Load CSS styles from file
   */
  private async loadCSS(cssPath: string): Promise<string> {
    const fullPath = path.join(this.templatesPath, cssPath);
    return await readFile(fullPath, 'utf8');
  }

  /**
   * Apply CSS customizations
   */
  private applyCSSCustomizations(css: string, customizations: CVCustomizations): string {
    let customizedCSS = css;

    if (customizations.primaryColor) {
      // Replace primary color variables
      customizedCSS = customizedCSS
        .replace(/--primary-color:\s*[^;]+;/g, `--primary-color: ${customizations.primaryColor};`)
        .replace(/#2563eb/gi, customizations.primaryColor);
    }

    if (customizations.fontSize) {
      const fontSizes = {
        small: '12px',
        medium: '14px',
        large: '16px'
      };
      const fontSize = fontSizes[customizations.fontSize];
      customizedCSS = customizedCSS
        .replace(/--base-font-size:\s*[^;]+;/g, `--base-font-size: ${fontSize};`);
    }

    return customizedCSS;
  }

  /**
   * Replace template variables with actual data
   */
  private replaceTemplateVariables(template: string, data: any): string {
    let html = template;

    // Replace simple variables
    if (data.profile) {
      html = html
        .replace(/{{profile\.headline}}/g, data.profile.headline || '')
        .replace(/{{profile\.summary}}/g, data.profile.summary || '')
        .replace(/{{profile\.location}}/g, data.profile.location || '')
        .replace(/{{profile\.phoneNumber}}/g, data.profile.phoneNumber || '')
        .replace(/{{profile\.linkedinUrl}}/g, data.profile.linkedinUrl || '')
        .replace(/{{profile\.portfolioUrl}}/g, data.profile.portfolioUrl || '')
        .replace(/{{profile\.githubUrl}}/g, data.profile.githubUrl || '');
    }

    // Replace skills array
    if (data.skills) {
      const skillsHtml = data.skills.map(skill => `<span class="skill">${skill}</span>`).join('');
      html = html.replace(/{{skills}}/g, skillsHtml);
    }

    // Replace work experience
    if (data.workExperience) {
      const workHtml = data.workExperience.map(exp => `
        <div class="work-item">
          <h3>${exp.jobTitle}</h3>
          <h4>${exp.companyName}</h4>
          <p class="duration">${exp.duration}</p>
          <p class="description">${exp.description || ''}</p>
        </div>
      `).join('');
      html = html.replace(/{{workExperience}}/g, workHtml);
    }

    // Replace education
    if (data.education) {
      const educationHtml = data.education.map(edu => `
        <div class="education-item">
          <h3>${edu.degree}</h3>
          <h4>${edu.institution}</h4>
          <p class="date">${edu.graduationYear || ''}</p>
          <p class="description">${edu.description || ''}</p>
        </div>
      `).join('');
      html = html.replace(/{{education}}/g, educationHtml);
    }

    return html;
  }

  /**
   * Calculate duration between dates
   */
  private calculateDuration(startDate: Date, endDate: Date | null): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) {
      const remainingMonths = months % 12;
      return remainingMonths > 0 
        ? `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
        : `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return 'Less than a month';
    }
  }

  /**
   * Generate checksum for buffer
   */
  private async generateChecksum(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get sample CV data for template previews
   */
  private getSampleCVData(): any {
    return {
      profile: {
        headline: 'Senior Software Engineer',
        summary: 'Experienced software engineer with 5+ years of experience in full-stack development.',
        location: 'San Francisco, CA',
        phoneNumber: '+1 (555) 123-4567',
        linkedinUrl: 'https://linkedin.com/in/sample',
        githubUrl: 'https://github.com/sample'
      },
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      workExperience: [
        {
          jobTitle: 'Senior Software Engineer',
          companyName: 'Tech Company Inc.',
          duration: '2 years, 3 months',
          description: 'Led development of key features and mentored junior developers.'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of Technology',
          graduationYear: '2019'
        }
      ]
    };
  }

  /**
   * Get minimal CV data
   */
  private getMinimalCVData(): any {
    return {
      profile: {
        headline: 'Professional Title',
        summary: 'Brief professional summary here.',
        location: 'City, State'
      },
      skills: ['Skill 1', 'Skill 2', 'Skill 3']
    };
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): CVTemplate[] {
    return [
      {
        id: 'modern-professional',
        name: 'Modern Professional',
        description: 'Clean, modern design perfect for tech roles',
        category: 'modern',
        preview: '/templates/previews/modern-professional.png',
        htmlTemplate: 'modern-professional.html',
        cssStyles: 'modern-professional.css',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'classic-ats',
        name: 'Classic ATS-Safe',
        description: 'Simple, ATS-friendly format for maximum compatibility',
        category: 'ats-safe',
        preview: '/templates/previews/classic-ats.png',
        htmlTemplate: 'classic-ats.html',
        cssStyles: 'classic-ats.css',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'executive-classic',
        name: 'Executive Classic',
        description: 'Traditional format for senior positions',
        category: 'classic',
        preview: '/templates/previews/executive-classic.png',
        htmlTemplate: 'executive-classic.html',
        cssStyles: 'executive-classic.css',
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.promises.mkdir(this.templatesPath, { recursive: true });
      await fs.promises.mkdir(this.outputPath, { recursive: true });
      await fs.promises.mkdir(path.join(this.outputPath, 'previews'), { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const cvGenerationService = new CVGenerationService();