import { expect, test } from '@playwright/test';

test('boots the farm shell and accepts visible world words', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Wordharvest' })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('house')).toBeVisible();

  await page.keyboard.type('seed');
  await page.keyboard.press('Enter');

  await expect(page.getByText('Planted turnip seeds.')).toBeVisible();

  await page.keyboard.type('house');
  await page.keyboard.press('Enter');
  await expect(page.getByText('door')).toBeVisible();
});
