import type { Page, Locator } from '@playwright/test';

export class TodoPage {
private readonly acceptCookies: Locator;
  private readonly employeePricingGetDetails: Locator;
  private readonly mustang: Locator;
  private readonly suvsAndCars: Locator;
  private readonly year2026: Locator; 

  constructor(public readonly page: Page) {
    this.acceptCookies = this.page.locator('button[id="onetrust-accept-btn-handler"]');
    this.employeePricingGetDetails = this.page.locator('button.cmp-button--primary.background-dark.color-white');
    this.mustang = this.page.getByText('Mustang');
    this.suvsAndCars = this.page.locator('div[id="container-8c1294ff67"].featureCard');
    this.year2026 = this.page.getByText('2026');
}

  async goto() {
    await this.page.goto('https://www.ford.com/');
  }

  async clickAcceptCookies() {
    await this.acceptCookies.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('Cookie banner not found or already dismissed.');
    });
    if (await this.acceptCookies.isVisible()) {
      await this.acceptCookies.click();
      await this.acceptCookies.waitFor({ state: 'hidden' }); // Wait for it to disappear after clicking
    }
  }

  async clickEmployeePricingGetDetails() {
    try {
        await this.employeePricingGetDetails.waitFor({ state: 'visible', timeout: 30000 });        
        await this.employeePricingGetDetails.click();
        
        await this.page.waitForURL(/ford\.com\/employee-pricing/, { timeout: 15000 });
        console.log('Successfully navigated to Employee Pricing page after clicking "Get Details".');
      } catch (error) {
        console.error(`Error clicking 'Employee Pricing Get Details' or navigating: ${error}`);
        throw error;
      }
  }

  async countSuvsAndCars(): Promise<number> {
    return await this.suvsAndCars.count();
  }

  async click2026() { 
    await this.year2026.click();
  }
}