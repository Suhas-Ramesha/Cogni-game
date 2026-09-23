import { test, expect } from '@playwright/test';

test.describe('caregiver login', () => {
  test('login screen is elderly-caregiver readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'CogniGame NER' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in|Send SMS code/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();
    await expect(page.getByLabel('Phone')).toBeVisible();
  });
});
