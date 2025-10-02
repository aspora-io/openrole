import { test, expect } from '@playwright/test';

test.describe('Simple OpenRole Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/OpenRole/);
    await expect(page.locator('h1')).toContainText('Find your perfect job');
  });

  test('can navigate to jobs page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Find Jobs');
    await expect(page).toHaveURL(/jobs\.html/);
  });

  test('job search form exists', async ({ page }) => {
    await page.goto('/');
    const searchForm = page.locator('form');
    await expect(searchForm).toBeVisible();
    
    const jobInput = page.locator('input[placeholder*="Job title"]');
    await expect(jobInput).toBeVisible();
    
    const locationInput = page.locator('input[placeholder*="Location"]');
    await expect(locationInput).toBeVisible();
    
    const searchButton = page.locator('button:has-text("Search")');
    await expect(searchButton).toBeVisible();
  });

  test('footer is present on all pages', async ({ page }) => {
    const pages = ['/', '/jobs.html', '/employers.html', '/career-advice.html'];
    
    for (const url of pages) {
      await page.goto(url);
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      await expect(footer).toContainText('2024 OpenRole');
    }
  });
});