/**
 * OpenRole Validation Package
 * 
 * Centralized validation schemas for the OpenRole CV & Profile Tools
 * 
 * @author OpenRole.net
 * @version 1.0.0
 */

// Export all profile validation schemas and types
export * from './profile-schemas';

// Export all CV validation schemas and types
export * from './cv-schemas';

// Re-export default schema collections
export { default as profileSchemas } from './profile-schemas';
export { default as cvSchemas } from './cv-schemas';