import type { Page } from '@playwright/test';

export const GOOGLE_SEARCH_SELECTORS = [
  'textarea[name="q"]',
  'input[name="q"]',
  '#APjFqb',
] as const;

export const GOOGLE_NEXT_PAGE_SELECTORS = ['#pnnext', 'a#pnnext'] as const;

export const GOOGLE_COOKIE_ACCEPT_SELECTORS = [
  '#L2AGLb',
  'button#L2AGLb',
] as const;

export const GOOGLE_CONSENT_FRAME = 'iframe[src*="consent.google.com"]';

export function firstMatchingLocator(page: Page, selectors: readonly string[]) {
  return selectors
    .slice(1)
    .reduce(
      (locator, selector) => locator.or(page.locator(selector)),
      page.locator(selectors[0]),
    );
}
