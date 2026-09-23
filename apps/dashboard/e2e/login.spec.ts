import { test, expect } from '@playwright/test';

test('login screen is elderly-caregiver readable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'CogniGame NER' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Demo sign-in/ })).toBeVisible();
});
