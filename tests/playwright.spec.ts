import { test, expect } from '@playwright/test';

test('Dandelions loads, exposes controls, and clears the drawing', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Dandelions');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('Points', { exact: true })).toBeVisible();
  await expect(page.locator('#clear-button')).toBeVisible();
  await expect(page.getByRole('link', { name: 'See the Code' })).toHaveAttribute(
    'href', 'https://github.com/zackJKnight/blazor-dandelions'
  );
  await page.locator('#clear-button').click();
  await expect(page.getByText('Total: 0')).toBeVisible();
});
