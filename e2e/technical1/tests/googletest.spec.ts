import { attachFullPageScreenshot, expect } from '../../baseTest';
import {
  FIRST_AUTOMATIC_PROCESS_PHRASE,
  FIRST_AUTOMATIC_PROCESS_YEAR,
  SEARCH_KEYWORD,
  WIKIPEDIA_AUTOMATION_URL,
} from '../utils/constants';
import { test } from '../utils/googleTest';

test.describe('Google Search Functionality', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name.startsWith('ci-')) {
      testInfo.skip(true, 'Live Google / CAPTCHA not used in CI');
    }
  });

  test(
    'should search for "Automation" and navigate to Wikipedia',
    { tag: '@google' },
    async ({ googleSearchPage, page }, testInfo) => {
      const openResult =
        await test.step('search Google and open Wikipedia from SERP', () =>
          googleSearchPage.searchAndOpenWikipedia());

      expect(openResult.clickedSerpLink).toBe(true);
      expect(openResult.clickedHref).toMatch(
        /wikipedia\.org\/wiki\/Automation(?:[#?]|$)/i,
      );

      /* eslint-disable playwright/no-conditional-in-test, playwright/no-conditional-expect -- EN article fallback when SERP lands on a non-EN wiki */
      if (openResult.usedFallbackNavigation) {
        await test.step('navigate to EN Automation article for assertion (SERP landed on different wiki URL)', async () => {
          await expect(page).toHaveURL(WIKIPEDIA_AUTOMATION_URL);
        });
      } else {
        await expect(page).toHaveURL(
          new RegExp(
            `${WIKIPEDIA_AUTOMATION_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/?#]|$)`,
          ),
        );
      }
      /* eslint-enable playwright/no-conditional-in-test, playwright/no-conditional-expect */

      await test.step('verify English Automation article content', async () => {
        await expect(googleSearchPage.automationTitle).toHaveText(
          SEARCH_KEYWORD,
        );

        const paragraph =
          await googleSearchPage.getFirstAutomaticProcessParagraph();
        expect(paragraph).toContain(FIRST_AUTOMATIC_PROCESS_PHRASE);
        expect(paragraph).toContain(FIRST_AUTOMATIC_PROCESS_YEAR);

        const year = await googleSearchPage.extractFirstAutomaticProcessYear();
        expect(year).toBe(FIRST_AUTOMATIC_PROCESS_YEAR);
      });

      await attachFullPageScreenshot(page, testInfo);
    },
  );
});
