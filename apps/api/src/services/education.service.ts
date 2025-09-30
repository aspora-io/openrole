// Education service interface - to be implemented
export interface EducationService {
  addEducation(userId: string, data: any): Promise<any>;
  getEducation(userId: string): Promise<any[]>;
  updateEducation(userId: string, educationId: string, data: any): Promise<any>;
  deleteEducation(userId: string, educationId: string): Promise<void>;
}