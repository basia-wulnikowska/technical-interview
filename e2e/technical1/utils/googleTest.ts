import { test as base } from '../../baseTest';
import { GOOGLE_URL } from './constants';
import { GoogleSearchPage } from '../pageObjects/googleSearchPage';

type GoogleFixtures = {
  googleSearchPage: GoogleSearchPage;
};

export const test = base.extend<GoogleFixtures>({
  googleSearchPage: async ({ page, context }, use, testInfo) => {
    const googleSearchPage = new GoogleSearchPage(page, context, testInfo);
    await googleSearchPage.goto(GOOGLE_URL);
    await use(googleSearchPage);
  },
});

export { expect } from '@playwright/test';
