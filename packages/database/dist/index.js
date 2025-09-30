/**
 * OpenRole Database Package
 *
 * Main entry point for database models, schemas, and utilities.
 * Exports all Drizzle ORM models and TypeScript types for the OpenRole platform.
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
// Export CandidateProfile model
export { candidateProfiles, candidateProfilesRelations, insertCandidateProfileSchema, selectCandidateProfileSchema, updateCandidateProfileSchema, candidateProfileHelpers, candidateProfileQueries, RemotePreference, PrivacyLevel, } from './models/candidate-profile';
// Export CVDocument model
export { cvDocuments, cvDocumentStatusEnum, insertCVDocumentSchema, selectCVDocumentSchema, updateCVDocumentSchema, cvDocumentHelpers, cvDocumentQueries, accessTokenManager, CVDocumentStatus, AllowedMimeTypes, CVDocumentConstants, } from './models/cv-document';
// Export WorkExperience model
export { workExperience, workExperienceRelations, insertWorkExperienceSchema, selectWorkExperienceSchema, updateWorkExperienceSchema, workExperienceHelpers, workExperienceQueries, } from './models/work-experience';
// Export Education model
export { education, educationRelations, insertEducationSchema, selectEducationSchema, updateEducationSchema, educationHelpers, educationQueries, educationCommonQueries, EducationLevel, EDUCATION_HIERARCHY, } from './models/education';
// Export PortfolioItem model
export { portfolioItems, portfolioItemsRelations, insertPortfolioItemSchema, selectPortfolioItemSchema, updatePortfolioItemSchema, portfolioHelpers, portfolioQueries, urlValidationHelpers, technologyHelpers, viewTrackingHelpers, PortfolioItemType, ValidationStatus, } from './models/portfolio-item';
// Export core schema tables and relations
export { companies, users, jobs, applications, savedSearches, savedJobs, jobViews, payments, jobCredits, companiesRelations, usersRelations, jobsRelations, applicationsRelations, userRoleEnum, companySizeEnum, jobStatusEnum, remoteTypeEnum, employmentTypeEnum, applicationStatusEnum, } from './schema';
// Re-export commonly used Drizzle utilities
export { sql, eq, and, or, not, isNull, isNotNull, exists, notExists, inArray, notInArray, between, like, ilike, desc, asc, } from 'drizzle-orm';
//# sourceMappingURL=index.js.map