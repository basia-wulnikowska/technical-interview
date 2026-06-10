import { test as base, type TestInfo } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function attachFullPageScreenshot(page: Page, testInfo: TestInfo) {
  const screenshotPath = testInfo.outputPath('test-finished.png');
  await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 60_000 });
  await testInfo.attach('screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

export const test = base;

export { expect } from '@playwright/test';
