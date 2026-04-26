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

test('travels between the farm and town edge through typed labels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#word-preview')).toContainText('town');

  await page.keyboard.type('town');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Followed the south path toward town.')).toBeVisible();
  await expect(page.locator('#word-preview')).toHaveText('farm');

  await page.keyboard.type('farm');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Walked back up the lane to the farm.')).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('town');
});

test('saves, loads, and resets the local farm slot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wordharvest' })).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('seed');

  await page.keyboard.type('seed');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Planted turnip seeds.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('25');
  await expect(page.locator('#seed-value')).toHaveText('2');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expect(page.locator('#save-timestamp')).toContainText(/^Last saved: \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/);

  await page.getByRole('button', { name: 'End Day' }).click();
  await expect(page.locator('#day-value')).toHaveText('2');

  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.locator('#day-value')).toHaveText('1');
  await expect(page.locator('#coin-value')).toHaveText('25');
  await expect(page.locator('#seed-value')).toHaveText('2');
  await expect(page.locator('#save-timestamp')).toContainText(/^Restored save: \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/);

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('#coin-value')).toHaveText('25');
  await expect(page.locator('#save-timestamp')).toHaveText('No save restored.');

  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByText('No save found.')).toBeVisible();
});

test('persists audio options locally', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wordharvest' })).toBeVisible();

  await page.getByLabel('Mute').check();
  await page.locator('#effects-volume').evaluate((input) => {
    const slider = input as HTMLInputElement;
    slider.value = '0.25';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.reload();

  await expect(page.getByLabel('Mute')).toBeChecked();
  await expect(page.locator('#effects-volume')).toHaveValue('0.25');
});
