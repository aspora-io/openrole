// Export all hooks for easy importing
export { useProfile } from './useProfile';
export { useSearch } from './useSearch';
export { useFileUpload } from './useFileUpload';
export { useCV } from './useCV';
export { usePortfolio } from './usePortfolio';
export { useExperience } from './useExperience';
export { useEducation } from './useEducation';
export { usePrivacy } from './usePrivacy';

// Re-export types for convenience
export type { ProfileData, ProfileUpdateData } from './useProfile';
export type { SearchCriteria, SearchResult, SearchResponse } from './useSearch';
export type { UploadedFile, UploadProgress } from './useFileUpload';
export type { CVGenerationOptions, GeneratedCV, CVTemplate } from './useCV';
export type { PortfolioItem, PortfolioItemCreate } from './usePortfolio';
export type { WorkExperience, WorkExperienceCreate } from './useExperience';
export type { Education, EducationCreate } from './useEducation';
export type { PrivacySettings, DataExportResult } from './usePrivacy';