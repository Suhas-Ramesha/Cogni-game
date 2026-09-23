import { test, expect } from '@playwright/test';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

test.describe('caseload', () => {
  test.beforeEach(async ({ request }) => {
    const health = await request.get(`${API}/health`).catch(() => null);
    test.skip(!health || !health.ok(), `API not reachable at ${API}`);
  });

  test('demo sign-in reaches patients, detail, and alerts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Demo sign-in/ }).click();
    await expect(page.getByRole('heading', { name: 'Your patients' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Rita Sharma/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bah Nongkynrih/ })).toBeVisible();

    await page.getByRole('link', { name: /Bah Nongkynrih/ }).click();
    await expect(page.getByRole('heading', { name: 'Bah Nongkynrih' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Cognitive trend/ })).toBeVisible();

    await page.getByRole('link', { name: 'Alerts' }).click();
    await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
  });
});
