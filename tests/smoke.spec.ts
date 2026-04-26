import { expect, test } from '@playwright/test';

test('boots the farm shell and accepts visible world words', async ({ page }) => {
  const playerSheetResponse = page.waitForResponse(
    (response) => response.url().includes('/assets/sprites/player_base_v001.png') && response.status() === 200,
  );

  await page.goto('/');
  await playerSheetResponse;

  await expect(page.getByRole('heading', { name: 'Wordharvest' })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('house')).toBeVisible();
  await expect(page.locator('#weather-value')).toHaveText('Sunny');
  await expect(page.locator('#forecast-value')).toHaveText('Sunny');
  await expect(page.locator('#can-value')).toHaveText('Basic');
  await expect(page.locator('#seed-value')).toHaveText('3 turnip seeds');
  await expect(page.locator('#crop-value')).toHaveText('no harvested crops');
  await expect(page.locator('#objective-progress')).toHaveText('Spring Basket: 0/3 crops shipped');
  await expect(page.locator('#week-progress')).toHaveText('Day 1: Plant first seeds open');

  await page.keyboard.type('seed');
  await page.keyboard.press('Enter');

  await expect(page.getByText('Planted turnip seeds.')).toBeVisible();
  await expect(page.locator('#week-progress')).toHaveText('Day 1: Plant first seeds done');

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
  await expect(page.locator('#word-preview')).toContainText('farm');
  await expect(page.locator('#word-preview')).toContainText('shop');
  await expect(page.locator('#word-preview')).toContainText('hello');

  await page.keyboard.type('shop');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/The shop shelf is open:/)).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('radish');
  await expect(page.locator('#word-preview')).toContainText('carrot');
  await expect(page.locator('#word-preview')).toContainText('can');

  await page.keyboard.type('radish');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Bought 2 radish seeds for 8 coins.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('17');
  await expect(page.locator('#seed-value')).toHaveText('3 turnip seeds, 2 radish seeds');

  await page.keyboard.type('can');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Bought the tin watering can for 12 coins.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('5');
  await expect(page.locator('#can-value')).toHaveText('Tin');

  await page.keyboard.type('hello');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Mira says hello and asks how the turnips are growing.')).toBeVisible();

  await page.keyboard.type('farm');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Walked back up the lane to the farm.')).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('town');
  await expect(page.locator('#word-preview')).toContainText('radish');

  await page.keyboard.type('radish');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Planted radish seeds.')).toBeVisible();
  await expect(page.locator('#seed-value')).toHaveText('3 turnip seeds, 1 radish seed');
});

test('opens menu words from typed labels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#word-preview')).toContainText('journal');

  await page.keyboard.type('journal');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Journal: Day 1, Sunny today, sunny tomorrow, 25 coins, 3 turnip seeds, basic can\./)).toBeVisible();
  await expect(page.locator('#farm-log').getByText(/Spring Basket: 0\/3 crops shipped/)).toBeVisible();
  await expect(page.locator('#farm-log').getByText(/First Week: 0\/7 goals done/)).toBeVisible();

  await page.keyboard.type('pack');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Pack: Seeds: 3 turnip seeds. Crops: no harvested crops.')).toBeVisible();
});

test('saves, loads, and resets the local farm slot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wordharvest' })).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('seed');

  await page.keyboard.type('seed');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Planted turnip seeds.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('25');
  await expect(page.locator('#seed-value')).toHaveText('2 turnip seeds');
  await expect(page.locator('#crop-value')).toHaveText('no harvested crops');
  await expect(page.locator('#week-progress')).toHaveText('Day 1: Plant first seeds done');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expect(page.locator('#save-timestamp')).toContainText(/^Last saved: \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/);

  await page.getByRole('button', { name: 'End Day' }).click();
  await expect(page.locator('#day-value')).toHaveText('2');
  await expect(page.locator('#forecast-value')).toHaveText('Rain');
  await expect(page.locator('#week-progress')).toHaveText('Day 2: Water a growing crop open');

  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.locator('#day-value')).toHaveText('1');
  await expect(page.locator('#forecast-value')).toHaveText('Sunny');
  await expect(page.locator('#coin-value')).toHaveText('25');
  await expect(page.locator('#seed-value')).toHaveText('2 turnip seeds');
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
