import { test, expect } from '@playwright/test';
import { TodoPage } from './todo.spec';

type MyFixtures = {
  todoPage: TodoPage;
};

const testWithTodoPage = test.extend<MyFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto(); 
    await todoPage.clickAcceptCookies(); 
    await use(todoPage); 
  },
});

testWithTodoPage.describe('Ford page tests', {
  tag: '@regression',
}, () => {

  testWithTodoPage('Verify SUV and Car counts for different years', async ({ todoPage }) => {
    // 1. Click on the "Get Details" button for Employee Pricing
    await todoPage.clickEmployeePricingGetDetails();

    // 2. Count SUVs and Cars for the initial year (assuming this is the default 2023 or similar)
    const initialSuvsAndCarsCount = await todoPage.countSuvsAndCars();
    console.log(`Initial SUVs and Cars count: ${initialSuvsAndCarsCount}`); // For debugging
    await expect(initialSuvsAndCarsCount).toBe(3); // Assert that the count is 3

    // 3. Click on the "2026" link/button
    await todoPage.click2026();

    // 4. Count SUVs and Cars again after switching to 2026
    const year2026SuvsAndCarsCount = await todoPage.countSuvsAndCars();
    console.log(`2026 SUVs and Cars count: ${year2026SuvsAndCarsCount}`); // For debugging
    await expect(year2026SuvsAndCarsCount).toBe(6); // Assert that the count is 6
  });
});
