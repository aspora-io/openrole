/**
 * OpenRole Database Package
 *
 * Main entry point for database models, schemas, and utilities.
 * Exports all Drizzle ORM models and TypeScript types for the OpenRole platform.
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
export { candidateProfiles, candidateProfilesRelations, insertCandidateProfileSchema, selectCandidateProfileSchema, updateCandidateProfileSchema, candidateProfileHelpers, candidateProfileQueries, RemotePreference, PrivacyLevel, type SkillsArray, type IndustriesArray, type RemotePreferenceType, type PrivacyLevelType, type InsertCandidateProfile, type SelectCandidateProfile, type UpdateCandidateProfile, type CandidateProfileWithComputed, } from './models/candidate-profile';
export { cvDocuments, cvDocumentStatusEnum, insertCVDocumentSchema, selectCVDocumentSchema, updateCVDocumentSchema, cvDocumentHelpers, cvDocumentQueries, accessTokenManager, CVDocumentStatus, AllowedMimeTypes, CVDocumentConstants, type ScanResults, type CVDocumentStatusType, type AllowedMimeTypesType, type InsertCVDocument, type SelectCVDocument, type UpdateCVDocument, type CVDocumentWithAccess, } from './models/cv-document';
export { workExperience, workExperienceRelations, insertWorkExperienceSchema, selectWorkExperienceSchema, updateWorkExperienceSchema, workExperienceHelpers, workExperienceQueries, type AchievementsArray, type SkillsArray as WorkExperienceSkillsArray, type InsertWorkExperience, type SelectWorkExperience, type UpdateWorkExperience, type WorkExperienceWithDuration, } from './models/work-experience';
export { education, educationRelations, insertEducationSchema, selectEducationSchema, updateEducationSchema, educationHelpers, educationQueries, educationCommonQueries, EducationLevel, EDUCATION_HIERARCHY, type EducationLevelType, type InsertEducation, type SelectEducation, type UpdateEducation, type EducationWithDuration, } from './models/education';
export { portfolioItems, portfolioItemsRelations, insertPortfolioItemSchema, selectPortfolioItemSchema, updatePortfolioItemSchema, portfolioHelpers, portfolioQueries, urlValidationHelpers, technologyHelpers, viewTrackingHelpers, PortfolioItemType, ValidationStatus, type TechnologiesArray, type PortfolioItemTypeEnum, type ValidationStatusEnum, type InsertPortfolioItem, type SelectPortfolioItem, type UpdatePortfolioItem, type PortfolioItemWithValidation, } from './models/portfolio-item';
export { companies, users, jobs, applications, savedSearches, savedJobs, jobViews, payments, jobCredits, companiesRelations, usersRelations, jobsRelations, applicationsRelations, userRoleEnum, companySizeEnum, jobStatusEnum, remoteTypeEnum, employmentTypeEnum, applicationStatusEnum, type Company, type NewCompany, type User, type NewUser, type Job, type NewJob, type Application, type NewApplication, } from './schema';
export { sql, eq, and, or, not, isNull, isNotNull, exists, notExists, inArray, notInArray, between, like, ilike, desc, asc, } from 'drizzle-orm';
export type { InferInsertModel, InferSelectModel, } from 'drizzle-orm';
//# sourceMappingURL=index.d.ts.map