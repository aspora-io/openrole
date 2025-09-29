import { test as base, Page } from '@playwright/test';

export class WordPressPage {
  constructor(public page: Page) {}

  async login(username: string, password: string) {
    await this.page.goto('/wp-login.php');
    await this.page.fill('#user_login', username);
    await this.page.fill('#user_pass', password);
    await this.page.click('#wp-submit');
    await this.page.waitForURL(/wp-admin|dashboard/);
  }

  async logout() {
    await this.page.goto('/wp-login.php?action=logout');
    await this.page.click('a:has-text("log out")');
  }

  async isLoggedIn(): Promise<boolean> {
    await this.page.goto('/wp-admin');
    return !this.page.url().includes('wp-login.php');
  }
}

export class JobPage {
  constructor(public page: Page) {}

  async postJob(jobData: {
    title: string;
    description: string;
    salaryMin: number;
    salaryMax: number;
    location: string;
    company?: string;
  }) {
    await this.page.goto('/submit-job/');
    
    // Fill job details
    await this.page.fill('input[name="job_title"]', jobData.title);
    await this.page.fill('.job-description textarea', jobData.description);
    
    // Fill mandatory salary fields
    await this.page.fill('input[name="job_salary_min"]', jobData.salaryMin.toString());
    await this.page.fill('input[name="job_salary_max"]', jobData.salaryMax.toString());
    
    // Location
    await this.page.fill('input[name="job_location"]', jobData.location);
    
    // Company (if provided)
    if (jobData.company) {
      await this.page.fill('input[name="company_name"]', jobData.company);
    }
    
    // Submit
    await this.page.click('input[type="submit"][value*="Preview"]');
    await this.page.waitForSelector('.job_listing_preview');
  }

  async searchJobs(keyword: string) {
    await this.page.goto('/jobs/');
    await this.page.fill('input[name="search_keywords"]', keyword);
    await this.page.click('.search_submit input[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  async applyForJob(jobUrl: string, coverLetter?: string) {
    await this.page.goto(jobUrl);
    await this.page.click('.application_button');
    
    if (coverLetter) {
      await this.page.fill('textarea[name="application_message"]', coverLetter);
    }
    
    await this.page.click('input[type="submit"][value*="Apply"]');
  }
}

type TestFixtures = {
  wordpressPage: WordPressPage;
  jobPage: JobPage;
};

export const test = base.extend<TestFixtures>({
  wordpressPage: async ({ page }, use) => {
    const wordpressPage = new WordPressPage(page);
    await use(wordpressPage);
  },
  
  jobPage: async ({ page }, use) => {
    const jobPage = new JobPage(page);
    await use(jobPage);
  },
});

export { expect } from '@playwright/test';