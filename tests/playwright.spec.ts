import { test, expect } from '@playwright/test';

test('drawing controls update the count and clear the canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Dandelions');
  await expect(page.locator('#drawing-surface canvas')).toBeVisible();
  await expect(page.getByLabel('Points per dandelion')).toBeVisible();
  await expect(page.locator('#total-points')).toHaveText('20 points');

  await page.getByRole('button', { name: 'Add one dandelion' }).click();
  await expect(page.locator('#dandelion-count')).toHaveValue('2');
  await page.locator('#add-ten').click();
  await expect(page.locator('#dandelion-count')).toHaveValue('12');

  await page.locator('#points-slider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#points-value')).toHaveText('25');
  await expect(page.locator('#total-points')).toHaveText('300 points');

  await page.getByRole('spinbutton', { name: 'Number of dandelions' }).fill('37');
  await page.getByRole('spinbutton', { name: 'Number of dandelions' }).press('Tab');
  await expect(page.locator('#dandelion-count')).toHaveValue('37');
  await expect(page.locator('#total-points')).toHaveText('925 points');

  await page.locator('#clear-button').click();
  await expect(page.locator('#dandelion-count')).toHaveValue('0');
  await expect(page.locator('#total-points')).toHaveText('0 points');
  await expect(page.getByRole('button', { name: 'Remove one dandelion' })).toBeDisabled();

  await page.locator('#drawing-surface').click({ position: { x: 40, y: 40 } });
  await expect(page.locator('#dandelion-count')).toHaveValue('10');
  await expect(page.getByRole('link', { name: 'See the Code' })).toHaveAttribute(
    'href', 'https://github.com/zackJKnight/blazor-dandelions'
  );
});

test('controls fit a phone screen with touch-sized targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await expect(page.locator('#drawing-surface canvas')).toBeVisible();
  await expect(page.locator('#clear-button')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const controls = document.querySelector('.controls-panel')!.getBoundingClientRect();
    const targets = ['#add-one', '#remove-one', '#add-ten', '#clear-button']
      .map(selector => document.querySelector(selector)!.getBoundingClientRect());
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      controlsBottom: controls.bottom,
      viewportHeight: window.innerHeight,
      smallestTargetHeight: Math.min(...targets.map(target => target.height)),
      allTargetsInside: targets.every(target => target.left >= 0 && target.right <= window.innerWidth),
    };
  });

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.controlsBottom).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.smallestTargetHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.allTargetsInside).toBe(true);
  await page.getByRole('button', { name: 'Add one dandelion' }).click();
  await expect(page.locator('#dandelion-count')).toHaveValue('2');
});
