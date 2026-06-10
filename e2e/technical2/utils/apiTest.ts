import { test as base, type APIRequestContext } from '@playwright/test';
import {
  PETSTORE_API_KEY,
  PETSTORE_API_KEY_HEADER,
} from './constants';

type AuthFixtures = {
  authenticatedRequest: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  authenticatedRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      extraHTTPHeaders: {
        [PETSTORE_API_KEY_HEADER]: PETSTORE_API_KEY,
      },
    });

    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
