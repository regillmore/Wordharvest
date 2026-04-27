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
  await expect(page.locator('#collection-value')).toHaveText(
    /Crops 1\/10 found, 0\/10 shipped; Words 11\/\d+ found, 0\/\d+ used/,
  );
  await expect(page.locator('#objective-progress')).toHaveText('Spring Basket: 0/3 crops shipped');
  await expect(page.locator('#objective-completion')).toBeHidden();
  await expect(page.locator('#follow-up-progress')).toBeHidden();
  await expect(page.locator('#week-progress')).toHaveText('Day 1: Plant first seeds open (+3 coins)');
  await expect(page.locator('#request-progress')).toHaveText('Request: Pantry Turnip open (+6 coins)');

  await page.keyboard.type('seed');
  await page.keyboard.press('Enter');

  await expect(page.getByText('Planted turnip seeds.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('28');
  await expect(page.getByText('Day 1 goal complete: first seeds planted. Reward: 3 coins.')).toBeVisible();
  await expect(page.locator('#week-progress')).toHaveText('Day 1: Plant first seeds done (+3 coins)');

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
  await expect(page.locator('#word-preview')).toContainText('board');
  await expect(page.locator('#word-preview')).toContainText('hello');
  await expect(page.locator('#word-preview')).toContainText('favor');

  await page.keyboard.type('board');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Request board: Pantry Turnip - Mira wants 1 turnip. Type favor near Mira to deliver. Reward: 6 coins.')).toBeVisible();

  await page.keyboard.type('favor');
  await page.keyboard.press('Enter');
  await expect(page.getByText("Mira's Pantry Turnip request needs 1 turnip. Your pack has none.")).toBeVisible();

  await page.keyboard.type('shop');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/The shop shelf is open:/)).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('radish');
  await expect(page.locator('#word-preview')).toContainText('carrot');
  await expect(page.locator('#word-preview')).toContainText('can');

  await page.keyboard.type('radish');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Bought 2 radish seeds for 8 coins.')).toBeVisible();
  await expect(page.getByText('Day 4 goal complete: a new seed packet is in the bag. Reward: 5 coins.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('26');
  await expect(page.locator('#seed-value')).toHaveText('3 turnip seeds, 2 radish seeds');
  await expect(page.locator('#collection-value')).toHaveText(
    /Crops 2\/10 found, 0\/10 shipped; Words 27\/\d+ found, 5\/\d+ used/,
  );

  await page.keyboard.type('can');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Bought the tin watering can for 12 coins.')).toBeVisible();
  await expect(page.getByText('Day 6 goal complete: the tin watering can is ready. Reward: 8 coins.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('22');
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
  await expect(page.locator('#collection-value')).toHaveText(
    /Crops 2\/10 found, 0\/10 shipped; Words 28\/\d+ found, 8\/\d+ used/,
  );
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
  await expect(
    page.getByText(
      /Pack: Seeds: 3 turnip seeds\. Crops: no harvested crops\. Collection: Crops 1\/10 found, 0\/10 shipped; Words 11\/\d+ found, 2\/\d+ used\..*Used words: journal, pack\./,
    ),
  ).toBeVisible();
});

test('shows persistent affordances for a completed Spring Basket', async ({ page }) => {
  await page.addInitScript((rawSave) => {
    localStorage.setItem('wordharvest:save:v1', rawSave);
  }, completedSpringBasketSave());

  await page.goto('/');
  await page.getByRole('button', { name: 'Load' }).click();

  await expect(page.locator('#objective-progress')).toHaveText('Spring Basket: complete');
  await expect(page.locator('#objective-progress')).toHaveClass(/is-complete/);
  await expect(page.locator('#objective-completion')).toHaveText(
    "Mira's market table is stocked for spring. Reward received: 25 coins. Next: Ship five different spring crop varieties for Market Encore.",
  );
  await expect(page.locator('#follow-up-progress')).toHaveText(
    "Market Encore: 3/5 crop varieties shipped. 2 more varieties will broaden Mira's market stall.",
  );
  await expect(page.locator('#collection-value')).toHaveText(
    /Crops 3\/10 found, 3\/10 shipped; Words 8\/\d+ found, 0\/\d+ used/,
  );

  await page.keyboard.type('journal');
  await page.keyboard.press('Enter');
  await expect(page.locator('#farm-log').getByText(/Spring Basket: complete/)).toBeVisible();
  await expect(page.locator('#farm-log').getByText(/Mira's market table is stocked for spring/)).toBeVisible();
  await expect(page.locator('#farm-log').getByText(/Market Encore: 3\/5 crop varieties shipped/)).toBeVisible();
});

test('saves, loads, and resets the local farm slot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wordharvest' })).toBeVisible();
  await expect(page.locator('#word-preview')).toContainText('seed');

  await page.keyboard.type('seed');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Planted turnip seeds.')).toBeVisible();
  await expect(page.locator('#coin-value')).toHaveText('28');
  await expect(page.locator('#seed-value')).toHaveText('2 turnip seeds');
  await expect(page.locator('#crop-value')).toHaveText('no harvested crops');
  await expect(page.locator('#collection-value')).toHaveText(
    /Crops 1\/10 found, 0\/10 shipped; Words 13\/\d+ found, 1\/\d+ used/,
  );
  await expect(page.locator('#week-progress')).toHaveText('Day 1: Plant first seeds done (+3 coins)');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expect(page.locator('#save-timestamp')).toContainText(/^Last saved: \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/);

  await page.getByRole('button', { name: 'End Day' }).click();
  await expect(page.locator('#day-value')).toHaveText('2');
  await expect(page.locator('#forecast-value')).toHaveText('Rain');
  await expect(page.locator('#week-progress')).toHaveText('Day 2: Water a growing crop open (+4 coins)');
  await expect(page.locator('#request-progress')).toHaveText('Request: Radish Crunch open (+8 coins)');

  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.locator('#day-value')).toHaveText('1');
  await expect(page.locator('#forecast-value')).toHaveText('Sunny');
  await expect(page.locator('#coin-value')).toHaveText('28');
  await expect(page.locator('#seed-value')).toHaveText('2 turnip seeds');
  await expect(page.locator('#collection-value')).toHaveText(
    /Crops 1\/10 found, 0\/10 shipped; Words 13\/\d+ found, 1\/\d+ used/,
  );
  await expect(page.locator('#request-progress')).toHaveText('Request: Pantry Turnip open (+6 coins)');
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

function completedSpringBasketSave(): string {
  const cropCounts = {
    turnip: 0,
    radish: 0,
    pea: 0,
    strawberry: 0,
    carrot: 0,
    lettuce: 0,
    potato: 0,
    onion: 0,
    tulip: 0,
    spinach: 0,
  };

  return JSON.stringify({
    schemaVersion: 6,
    savedAt: '2026-04-25T00:00:00.000Z',
    state: {
      day: 8,
      coins: 87,
      stamina: 10,
      player: { x: 2, y: 4.4 },
      location: 'farm',
      weather: 'sunny',
      forecast: 'sunny',
      pendingAction: null,
      seeds: { ...cropCounts, turnip: 3 },
      inventory: cropCounts,
      upgrades: { wateringCan: true },
      seasonObjective: {
        id: 'springBasket',
        shipped: { ...cropCounts, turnip: 1, radish: 1, carrot: 1 },
        completed: true,
      },
      weekGoals: {
        plantFirstSeeds: true,
        waterFirstCrop: true,
        visitTownShop: true,
        buySpringSeeds: true,
        shipFirstCrop: true,
        buyTinCan: true,
        completeSpringBasket: true,
      },
      plots: [
        { id: 1, position: { x: -1, y: 3 }, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
        { id: 2, position: { x: 0, y: 3 }, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
        { id: 3, position: { x: 1, y: 3 }, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
        { id: 4, position: { x: -1, y: 4 }, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
        { id: 5, position: { x: 0, y: 4 }, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
        { id: 6, position: { x: 1, y: 4 }, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
      ],
      log: ['Spring Basket complete! Mira added 25 coins for the market table.'],
    },
  });
}
