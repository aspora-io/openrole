// Profile service interface - to be implemented
export interface ProfileService {
  createProfile(userId: string, data: any): Promise<any>;
  getProfile(userId: string): Promise<any>;
  updateProfile(userId: string, data: any): Promise<any>;
  updateProfileCompletion(userId: string, isComplete: boolean): Promise<any>;
  searchProfiles(employerId: string, criteria: any): Promise<any>;
  calculateVerificationStatus(profile: any): boolean;
  verifyEmail(userId: string): Promise<any>;
  verifyIdentity(userId: string): Promise<any>;
}