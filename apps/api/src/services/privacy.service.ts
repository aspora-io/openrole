// Privacy service interface - to be implemented
export interface PrivacyService {
  updatePrivacySettings(userId: string, settings: any): Promise<any>;
  getPrivacySettings(userId: string): Promise<any>;
}