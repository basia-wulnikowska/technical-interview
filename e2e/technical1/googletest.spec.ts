import { attachFullPageScreenshot, test } from '../baseTest';
import { GOOGLE_URL } from './constants';
import { TodoPage } from './todoPage';

type GoogleFixtures = {
  todoPage: TodoPage;
};

const testWithTodoPage = test.extend<GoogleFixtures>({
  todoPage: async ({ page, context }, use, testInfo) => {
    const todoPage = new TodoPage(page, context, testInfo);
    await todoPage.goto(GOOGLE_URL);
    await use(todoPage);
  },
});

testWithTodoPage.describe('Google Search Functionality', () => {
  testWithTodoPage(
    'should search for "Automation" and navigate to Wikipedia',
    async ({ todoPage, page }, testInfo) => {
      await todoPage.searchAndOpenWikipedia();
      await todoPage.expectOnAutomationWikipediaPage();
      await todoPage.expectFirstAutomaticProcessYear();
      await attachFullPageScreenshot(page, testInfo);
    },
  );
});
