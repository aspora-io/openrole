/**
 * Database Configuration and Connection
 *
 * Production-ready database configuration with connection pooling
 * and complete Drizzle ORM schema integration.
 *
 * @author OpenRole Team
 * @date 2025-10-30 (Refactored)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection with pooling configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/openrole';

// Configure postgres client with connection pooling for production
const client = postgres(connectionString, {
  max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections in pool
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'), // Close idle connections after 20s
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'), // Connection timeout
});

// Initialize Drizzle with complete schema
export const db = drizzle(client, { schema });

// Export raw postgres client for direct SQL queries (used by auth)
export const pgClient = client;

// Export all schema tables for convenient access
export {
  users,
  companies,
  jobs,
  applications,
  profiles,
  jobAnalytics,
  jobViews,
  savedJobs,
  importHistory,
} from './schema';

// Export all types for type-safe database operations
export type {
  User,
  NewUser,
  Company,
  NewCompany,
  Job,
  NewJob,
  Application,
  NewApplication,
  Profile,
  NewProfile,
  JobAnalytics,
  NewJobAnalytics,
  JobView,
  NewJobView,
  SavedJob,
  NewSavedJob,
  ImportHistory,
  NewImportHistory,
} from './schema';

// Legacy placeholder models (DEPRECATED - Use schema tables instead)
// Kept temporarily for backward compatibility with CV/Profile features
export const candidateProfiles = {
  id: 'id',
  userId: 'userId',
  headline: 'headline',
  summary: 'summary',
  location: 'location',
  phoneNumber: 'phoneNumber',
  linkedinUrl: 'linkedinUrl',
  portfolioUrl: 'portfolioUrl',
  githubUrl: 'githubUrl',
  skills: 'skills',
  industries: 'industries',
  salaryExpectationMin: 'salaryExpectationMin',
  salaryExpectationMax: 'salaryExpectationMax',
  remotePreference: 'remotePreference',
  privacyLevel: 'privacyLevel',
  isVerified: 'isVerified',
  completionPercentage: 'completionPercentage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

export const workExperience = {
  id: 'id',
  userId: 'userId',
  jobTitle: 'jobTitle',
  companyName: 'companyName',
  location: 'location',
  employmentType: 'employmentType',
  companySize: 'companySize',
  industry: 'industry',
  startDate: 'startDate',
  endDate: 'endDate',
  isCurrentRole: 'isCurrentRole',
  description: 'description',
  achievements: 'achievements',
  technologies: 'technologies',
  salary: 'salary',
  references: 'references',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

export const education = {
  id: 'id',
  userId: 'userId',
  institution: 'institution',
  degree: 'degree',
  degreeType: 'degreeType',
  fieldOfStudy: 'fieldOfStudy',
  location: 'location',
  startDate: 'startDate',
  endDate: 'endDate',
  graduationYear: 'graduationYear',
  isCurrentlyEnrolled: 'isCurrentlyEnrolled',
  gpa: 'gpa',
  maxGpa: 'maxGpa',
  description: 'description',
  achievements: 'achievements',
  coursework: 'coursework',
  activities: 'activities',
  honors: 'honors',
  thesis: 'thesis',
  isVerified: 'isVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

export const portfolioItems = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  description: 'description',
  type: 'type',
  externalUrl: 'externalUrl',
  technologies: 'technologies',
  projectDate: 'projectDate',
  role: 'role',
  isPublic: 'isPublic',
  sortOrder: 'sortOrder',
  validationStatus: 'validationStatus',
  fileName: 'fileName',
  filePath: 'filePath',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

export const cvDocuments = {
  id: 'id',
  userId: 'userId',
  fileName: 'fileName',
  filePath: 'filePath',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  label: 'label',
  isDefault: 'isDefault',
  status: 'status',
  checksum: 'checksum',
  metadata: 'metadata',
  uploadedAt: 'uploadedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

// Type definitions
export interface SelectCandidateProfile {
  id: string;
  userId: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  phoneNumber: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  skills: string[];
  industries: string[];
  salaryExpectationMin: number | null;
  salaryExpectationMax: number | null;
  remotePreference: RemotePreference;
  privacyLevel: PrivacyLevel;
  isVerified: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertCandidateProfile extends Omit<SelectCandidateProfile, 'id'> {}

export interface SelectWorkExperience {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  location: string | null;
  employmentType: EmploymentType;
  companySize: CompanySize | null;
  industry: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrentRole: boolean;
  description: string | null;
  achievements: string[];
  technologies: string[];
  salary: any;
  references: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertWorkExperience extends Omit<SelectWorkExperience, 'id'> {}

export interface SelectEducation {
  id: string;
  userId: string;
  institution: string;
  degree: string;
  degreeType: DegreeType;
  fieldOfStudy: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  graduationYear: number | null;
  isCurrentlyEnrolled: boolean;
  gpa: number | null;
  maxGpa: number | null;
  description: string | null;
  achievements: string[];
  coursework: string[];
  activities: string[];
  honors: string[];
  thesis: any;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertEducation extends Omit<SelectEducation, 'id'> {}

export interface SelectPortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: PortfolioType;
  externalUrl: string | null;
  technologies: string[];
  projectDate: Date | null;
  role: string | null;
  isPublic: boolean;
  sortOrder: number;
  validationStatus: PortfolioValidationStatus;
  fileName: string | null;
  filePath: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertPortfolioItem extends Omit<SelectPortfolioItem, 'id'> {}

export interface SelectCVDocument {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  label: string;
  isDefault: boolean;
  status: CVStatus;
  checksum: string;
  metadata: any;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertCVDocument extends Omit<SelectCVDocument, 'id'> {}

// Enums
export enum RemotePreference {
  REMOTE_ONLY = 'REMOTE_ONLY',
  HYBRID = 'HYBRID',
  ON_SITE = 'ON_SITE',
  NO_PREFERENCE = 'NO_PREFERENCE'
}

export enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  SEMI_PRIVATE = 'SEMI_PRIVATE',
  PRIVATE = 'PRIVATE'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  VOLUNTEER = 'VOLUNTEER'
}

export enum CompanySize {
  STARTUP = 'STARTUP',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE'
}

export enum DegreeType {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  ASSOCIATE = 'ASSOCIATE',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  PHD = 'PHD',
  CERTIFICATE = 'CERTIFICATE',
  DIPLOMA = 'DIPLOMA',
  OTHER = 'OTHER'
}

export enum PortfolioType {
  PROJECT = 'PROJECT',
  ARTICLE = 'ARTICLE',
  DESIGN = 'DESIGN',
  CODE = 'CODE',
  VIDEO = 'VIDEO',
  PRESENTATION = 'PRESENTATION',
  CERTIFICATE = 'CERTIFICATE',
  LINK = 'LINK'
}

export enum PortfolioValidationStatus {
  PENDING = 'PENDING',
  VALID = 'VALID',
  INVALID = 'INVALID',
  UNREACHABLE = 'UNREACHABLE'
}

export enum CVStatus {
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR'
}