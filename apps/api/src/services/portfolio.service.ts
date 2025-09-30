// Portfolio service interface - to be implemented
export interface PortfolioService {
  addPortfolioItem(userId: string, data: any): Promise<any>;
  getPortfolioItems(userId: string): Promise<any[]>;
  updatePortfolioItem(userId: string, itemId: string, data: any): Promise<any>;
  deletePortfolioItem(userId: string, itemId: string): Promise<void>;
}