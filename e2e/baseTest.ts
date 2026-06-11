import { test as base, type TestInfo } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachment, ContentType, step } from 'allure-js-commons';
import fs from 'fs/promises';

export async function attachFullPageScreenshot(page: Page, testInfo: TestInfo) {
  const screenshotPath = testInfo.outputPath('test-finished.png');
  const fullPageBuffer = await page.screenshot({
    fullPage: true,
    timeout: 60_000,
  });
  await fs.writeFile(screenshotPath, fullPageBuffer);

  await testInfo.attach('screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  });

  const viewportBuffer = await page.screenshot({ fullPage: false });
  await step('Attach Wikipedia screenshot', async () => {
    await attachment(
      'Wikipedia page screenshot',
      viewportBuffer,
      ContentType.PNG,
    );
  });
}

export const test = base;

export { expect } from '@playwright/test';
