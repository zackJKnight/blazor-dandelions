import { test, expect } from '@playwright/test';

test('Blazor initializes the WebGL2 renderer and draws actual GPU frames', async ({ page }) => {
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
  const canvas = page.locator('#gpu-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl2');
  await expect.poll(async () => Number(await canvas.getAttribute('data-gpu-frames')), {
    timeout: 15000,
    message: 'WebGL2 instanced draw calls must be producing frames',
  }).toBeGreaterThan(0);
  const details = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl2');
    return {
      isWebGL2: gl instanceof WebGL2RenderingContext,
      version: gl?.getParameter(gl.VERSION),
    };
  });
  expect(details.isWebGL2).toBe(true);
  expect(details.version).toContain('WebGL 2.0');
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
  await expect.poll(async () => Number(await canvas.getAttribute('data-gpu-frames')), { timeout: 10000 })
    .toBeGreaterThan(30);
});
