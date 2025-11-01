/**
 * Feature Flags Configuration
 *
 * Enable or disable features across the application.
 * Set to true to enable, false to disable.
 */

export const FEATURES = {
  // CV Upload and Management
  CV_UPLOAD: false,
  CV_LIBRARY: false,
  CV_GENERATION: false,

  // Profile and Portfolio
  PORTFOLIO: false,
  WORK_EXPERIENCE: false,
  EDUCATION: false,

  // Job Features
  JOB_ALERTS: true,
  SAVED_JOBS: true,
  JOB_APPLICATIONS: true,

  // Employer Features
  EMPLOYERS: false,
  EMPLOYER_DASHBOARD: true,
  POST_JOBS: true,
  CV_SEARCH: false,
  FEATURED_EMPLOYERS: false,

  // Advanced Features
  PRIVACY_SETTINGS: false,
  FILE_UPLOAD: false,
  CAREER_ADVICE: false,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}
