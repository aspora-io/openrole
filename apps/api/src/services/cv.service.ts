// CV service interface - to be implemented
export interface CvService {
  uploadCv(userId: string, data: any): Promise<any>;
  getCvs(userId: string): Promise<any[]>;
  getCv(userId: string, cvId: string): Promise<any>;
  deleteCv(userId: string, cvId: string): Promise<void>;
  generateCv(userId: string, options: any): Promise<any>;
}