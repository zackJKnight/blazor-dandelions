import { test, expect } from '@playwright/test';

test('Blazor and SkiaSharp initialize without a runtime error', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      messages.push('Console ' + message.type() + ': ' + message.text());
    }
  });
  page.on('pageerror', error => messages.push('Page error: ' + (error.stack ?? error.message)));
  page.on('requestfailed', request => messages.push(
    'Request failed: ' + request.url() + ' ' + (request.failure()?.errorText ?? '')
  ));

  await page.goto('/');
  await expect(page).toHaveTitle('Dandelions');
  await expect(page.locator('#drawing-surface canvas')).toBeVisible();
  await page.waitForTimeout(2500);

  const errorUi = page.locator('#blazor-error-ui');
  if (await errorUi.isVisible()) {
    console.error('Blazor error UI is VISIBLE. Browser diagnostics:');
    for (const line of messages) console.error(line);
    console.error('Blazor error element:', await errorUi.textContent());
  }
  await expect(errorUi).toBeHidden({ timeout: 2000 });
  await page.getByRole('button', { name: 'Add one dandelion' }).click({ timeout: 5000 });
  await expect(page.locator('#dandelion-count')).toHaveValue('2');
});
