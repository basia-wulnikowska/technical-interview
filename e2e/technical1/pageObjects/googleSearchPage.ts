import { type Page, Locator, BrowserContext, TestInfo } from '@playwright/test';
import {
  FIRST_AUTOMATIC_PROCESS_PHRASE,
  GOOGLE_SESSION_PATH,
  SEARCH_KEYWORD,
  WIKIPEDIA_AUTOMATION_URL,
} from '../utils/constants';
import {
  firstMatchingLocator,
  GOOGLE_CONSENT_FRAME,
  GOOGLE_COOKIE_ACCEPT_SELECTORS,
  GOOGLE_NEXT_PAGE_SELECTORS,
  GOOGLE_SEARCH_SELECTORS,
} from '../utils/googleLocators';

export type WikipediaOpenResult = {
  clickedSerpLink: boolean;
  clickedHref: string | null;
  usedFallbackNavigation: boolean;
};

export class GoogleSearchPage {
  private readonly searchBox: Locator;
  private readonly nextButton: Locator;
  private readonly wikipediaEnResult: Locator;
  private readonly wikipediaAnyResult: Locator;
  private readonly recaptchaIframe: Locator;
  private readonly captchaForm: Locator;
  private readonly wikipediaContent: Locator;
  private readonly wikipediaTitle: Locator;

  constructor(
    public readonly page: Page,
    private readonly context: BrowserContext,
    private readonly testInfo: TestInfo,
  ) {
    this.searchBox = firstMatchingLocator(this.page, GOOGLE_SEARCH_SELECTORS);
    this.nextButton = firstMatchingLocator(
      this.page,
      GOOGLE_NEXT_PAGE_SELECTORS,
    );
    const exactArticle = `:not([href*="${SEARCH_KEYWORD}_"])`;
    this.wikipediaEnResult = this.page.locator(
      `a[href*="en.wikipedia.org/wiki/${SEARCH_KEYWORD}"]${exactArticle}`,
    );
    this.wikipediaAnyResult = this.page.locator(
      `a[href*="wikipedia.org/wiki/${SEARCH_KEYWORD}"]${exactArticle}`,
    );
    this.recaptchaIframe = this.page.locator(
      'iframe[src*="recaptcha"], iframe[title*="reCAPTCHA"]',
    );
    this.captchaForm = this.page.locator('form#captcha-form');
    this.wikipediaContent = this.page.locator('#mw-content-text');
    this.wikipediaTitle = this.page.locator('#firstHeading');
  }

  get automationTitle(): Locator {
    return this.wikipediaTitle;
  }

  async goto(url: string) {
    await this.page.goto(url);
    await this.resolveCaptcha();
  }

  async searchAndOpenWikipedia(
    keyword: string = SEARCH_KEYWORD,
  ): Promise<WikipediaOpenResult> {
    await this.searchForAKeyword(keyword);
    return this.openWikipediaResult();
  }

  async getFirstAutomaticProcessParagraph(): Promise<string> {
    return this.searchWikipediaContent(FIRST_AUTOMATIC_PROCESS_PHRASE);
  }

  async extractFirstAutomaticProcessYear(): Promise<string> {
    const text = await this.getFirstAutomaticProcessParagraph();
    const year = text.match(
      /in (\d{4}), making it the first completely automated industrial process/i,
    )?.[1];

    if (!year) {
      throw new Error(
        `Could not extract year from Wikipedia paragraph: "${text}"`,
      );
    }

    return year;
  }

  private async resolveCaptcha() {
    if (this.testInfo.project.name.startsWith('ci-')) {
      this.testInfo.skip(true, 'Live Google / CAPTCHA not used in CI');
      return;
    }

    const blocked =
      this.page.url().includes('/sorry/') ||
      this.page.url().includes('google.com/sorry') ||
      (await this.recaptchaIframe.count()) > 0 ||
      (await this.captchaForm.count()) > 0;

    if (blocked) {
      await this.page.pause();
    }

    await this.context.storageState({ path: GOOGLE_SESSION_PATH });
  }

  private async acceptCookies() {
    for (const selector of GOOGLE_COOKIE_ACCEPT_SELECTORS) {
      const button = this.page.locator(selector);
      if (await button.isVisible()) {
        await button.click();
        return;
      }
    }

    const consentFrame = this.page.frameLocator(GOOGLE_CONSENT_FRAME);
    for (const selector of GOOGLE_COOKIE_ACCEPT_SELECTORS) {
      const button = consentFrame.locator(selector);
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        return;
      }
    }
  }

  private async searchForAKeyword(keyword: string) {
    await this.acceptCookies();
    await this.searchBox.fill(keyword);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
    await this.resolveCaptcha();
  }

  private async openWikipediaResult(
    maxPages = 15,
  ): Promise<WikipediaOpenResult> {
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      if (pageIndex === 0) {
        await this.wikipediaEnResult
          .first()
          .waitFor({ state: 'visible', timeout: 10_000 })
          .catch(() => undefined);
      }

      const clickedHref = await this.clickVisibleWikipediaResult();
      if (clickedHref) {
        const usedFallbackNavigation =
          await this.ensureEnglishAutomationArticle();
        return {
          clickedSerpLink: true,
          clickedHref,
          usedFallbackNavigation,
        };
      }

      const movedToNextPage = await this.goToNextSearchPage();
      if (!movedToNextPage) {
        throw new Error('Wikipedia result not found and no more result pages');
      }
    }

    throw new Error(`Wikipedia result not found within ${maxPages} pages`);
  }

  private async clickVisibleWikipediaResult(): Promise<string | null> {
    const enHref = await this.clickFirstVisibleHref(this.wikipediaEnResult);
    if (enHref) {
      return enHref;
    }

    return this.clickFirstVisibleHref(this.wikipediaAnyResult);
  }

  private async clickFirstVisibleHref(
    locator: Locator,
  ): Promise<string | null> {
    const count = await locator.count();

    for (let i = 0; i < count; i++) {
      const link = locator.nth(i);
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        await link.scrollIntoViewIfNeeded();
        await link.click();
        return href;
      }
    }

    return null;
  }

  private async ensureEnglishAutomationArticle(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded');

    if (this.isEnglishAutomationArticle(this.page.url())) {
      return false;
    }

    await this.page.goto(WIKIPEDIA_AUTOMATION_URL);
    await this.page.waitForLoadState('domcontentloaded');
    return true;
  }

  private isEnglishAutomationArticle(url: string): boolean {
    try {
      const { hostname, pathname } = new URL(url);
      return (
        hostname === 'en.wikipedia.org' &&
        pathname.toLowerCase() === `/wiki/${SEARCH_KEYWORD.toLowerCase()}`
      );
    } catch {
      return false;
    }
  }

  private async goToNextSearchPage(): Promise<boolean> {
    if ((await this.nextButton.count()) > 0) {
      await this.nextButton.first().scrollIntoViewIfNeeded();
      const urlBefore = this.page.url();
      await this.nextButton.first().click();
      try {
        await this.page.waitForURL((url) => url.toString() !== urlBefore, {
          timeout: 10_000,
        });
        await this.page.waitForLoadState('domcontentloaded');
        return true;
      } catch {
        return false;
      }
    }

    return this.goToNextSearchPageByUrl();
  }

  private async goToNextSearchPageByUrl(): Promise<boolean> {
    const url = new URL(this.page.url());
    if (!url.searchParams.get('q')) {
      return false;
    }

    const nextStart = Number(url.searchParams.get('start') ?? 0) + 10;
    url.searchParams.set('start', String(nextStart));

    const urlBefore = this.page.url();
    await this.page.goto(url.toString());
    await this.page.waitForLoadState('domcontentloaded');

    return this.page.url() !== urlBefore;
  }

  private async searchWikipediaContent(searchPhrase: string): Promise<string> {
    await this.wikipediaContent.waitFor({ state: 'visible' });

    const matchingParagraph = this.wikipediaContent
      .locator('p')
      .filter({ hasText: searchPhrase })
      .first();

    await matchingParagraph.scrollIntoViewIfNeeded();

    const text = await matchingParagraph.textContent();
    if (!text) {
      throw new Error(`No Wikipedia paragraph found for: "${searchPhrase}"`);
    }

    return text;
  }
}
