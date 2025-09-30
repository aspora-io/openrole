// Work experience service interface - to be implemented
export interface WorkExperienceService {
  addExperience(userId: string, data: any): Promise<any>;
  getExperiences(userId: string): Promise<any[]>;
  updateExperience(userId: string, experienceId: string, data: any): Promise<any>;
  deleteExperience(userId: string, experienceId: string): Promise<void>;
}