import { expect, type Page, Locator, BrowserContext, TestInfo } from '@playwright/test';
import {
  FIRST_AUTOMATIC_PROCESS_PHRASE,
  FIRST_AUTOMATIC_PROCESS_YEAR,
  GOOGLE_SESSION_PATH,
  SEARCH_KEYWORD,
} from './constants';

export class TodoPage {
  private readonly searchBox: Locator;
  private readonly nextButton: Locator;
  private readonly wikipediaResult: Locator;
  private readonly acceptCookiesButton: Locator;
  private readonly recaptchaIframe: Locator;
  private readonly captchaForm: Locator;
  private readonly wikipediaContent: Locator;
  private readonly wikipediaTitle: Locator;

  constructor(
    public readonly page: Page,
    private readonly context: BrowserContext,
    private readonly testInfo: TestInfo,
  ) {
    this.searchBox = this.page.locator('#APjFqb');
    this.nextButton = this.page.locator('#pnnext');
    this.wikipediaResult = this.page.locator(
      `#search a[href*="en.wikipedia.org/wiki/${SEARCH_KEYWORD}"]`,
    );
    this.acceptCookiesButton = this.page.locator('button[id="L2AGLb"]');
    this.recaptchaIframe = this.page.locator('iframe[src*="recaptcha"]');
    this.captchaForm = this.page.locator('form#captcha-form');
    this.wikipediaContent = this.page.locator('#mw-content-text');
    this.wikipediaTitle = this.page.getByRole('heading', {
      name: SEARCH_KEYWORD,
      level: 1,
    });
  }

  async goto(url: string) {
    await this.page.goto(url);
    await this.resolveCaptcha();
  }

  async searchAndOpenWikipedia(keyword: string = SEARCH_KEYWORD) {
    await this.searchForAKeyword(keyword);
    await expect(this.page).toHaveURL(new RegExp(`search\\?q=${keyword}`));
    await this.openWikipediaResult();
  }

  async expectOnAutomationWikipediaPage() {
    await expect(this.page).toHaveURL(/en\.wikipedia\.org\/wiki\/Automation/);
    await expect(this.wikipediaTitle).toHaveText(SEARCH_KEYWORD);
  }

  async expectFirstAutomaticProcessYear(
    expectedYear: string = FIRST_AUTOMATIC_PROCESS_YEAR,
  ) {
    const paragraph = await this.searchWikipediaContent(
      FIRST_AUTOMATIC_PROCESS_PHRASE,
    );
    expect(paragraph).toContain(FIRST_AUTOMATIC_PROCESS_PHRASE);
    expect(paragraph).toContain(expectedYear);

    const year = await this.getYearOfFirstAutomaticProcess();
    expect(year).toBe(expectedYear);
  }

  private async resolveCaptcha() {
    if (this.testInfo.project.name === 'ci-pipeline') {
      this.testInfo.skip(true, 'Live Google / CAPTCHA not used in CI');
      return;
    }

    const blocked =
      this.page.url().includes('/sorry/') ||
      this.page.url().includes('google.com/sorry') ||
      (await this.recaptchaIframe.count()) > 0 ||
      (await this.captchaForm.count()) > 0 ||
      (await this.page.getByText(/unusual traffic|not a robot/i).count()) > 0;

    if (blocked) {
      await this.page.pause();
    }

    await this.context.storageState({ path: GOOGLE_SESSION_PATH });
  }

  private async acceptCookies() {
    if (await this.acceptCookiesButton.isVisible()) {
      await this.acceptCookiesButton.click();
    }
  }

  private async searchForAKeyword(keyword: string) {
    await this.acceptCookies();
    await this.searchBox.click();
    await this.searchBox.pressSequentially(keyword, { delay: 80 });
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
    await this.resolveCaptcha();
  }

  private async openWikipediaResult(maxPages = 15) {
    for (let page = 0; page < maxPages; page++) {
      if ((await this.wikipediaResult.count()) > 0) {
        await this.wikipediaResult.first().scrollIntoViewIfNeeded();
        await this.wikipediaResult.first().click();
        return;
      }

      const movedToNextPage = await this.goToNextSearchPage();
      if (!movedToNextPage) {
        throw new Error('Wikipedia result not found and no more result pages');
      }
    }

    throw new Error(`Wikipedia result not found within ${maxPages} pages`);
  }

  private async goToNextSearchPage(): Promise<boolean> {
    if ((await this.nextButton.count()) > 0) {
      await this.nextButton.scrollIntoViewIfNeeded();
      const urlBefore = this.page.url();
      await this.nextButton.click();
      try {
        await this.page.waitForURL((url) => url.toString() !== urlBefore, {
          timeout: 10_000,
        });
        await this.page.waitForLoadState('domcontentloaded');
        return true;
      } catch {
        return false;}
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

  private async getYearOfFirstAutomaticProcess(): Promise<string> {
    const text = await this.searchWikipediaContent(FIRST_AUTOMATIC_PROCESS_PHRASE);
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
}
