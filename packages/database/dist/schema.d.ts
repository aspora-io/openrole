/**
 * OpenRole Database Schema
 *
 * Complete database schema for the OpenRole platform.
 * Combines existing tables with new CV & Profile Tools tables.
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
export declare const userRoleEnum: any;
export declare const companySizeEnum: any;
export declare const jobStatusEnum: any;
export declare const remoteTypeEnum: any;
export declare const employmentTypeEnum: any;
export declare const applicationStatusEnum: any;
export declare const companies: any;
export declare const users: any;
export declare const jobs: any;
export declare const applications: any;
export declare const savedSearches: any;
export declare const savedJobs: any;
export declare const jobViews: any;
export declare const payments: any;
export declare const jobCredits: any;
export declare const companiesRelations: any;
export declare const usersRelations: any;
export declare const jobsRelations: any;
export declare const applicationsRelations: any;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
//# sourceMappingURL=schema.d.ts.map