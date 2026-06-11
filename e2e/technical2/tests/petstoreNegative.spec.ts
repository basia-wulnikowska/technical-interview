import { test, expect } from '../utils/apiTest';
import { PETSTORE_API_KEY_HEADER, PETSTORE_API_ROOT } from '../utils/constants';

test.describe('Petstore API negative cases', () => {
  test('returns 404 for unknown user', async ({ request }) => {
    const response = await request.get('user/qa_nonexistent_user_test');

    expect(response.status()).toBe(404);
  });

  test('returns empty list for invalid pet status', async ({ request }) => {
    const response = await request.get('pet/findByStatus', {
      params: { status: 'not-a-valid-status' },
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  test('store inventory responds without api key on demo API', async ({
    playwright,
  }) => {
    const context = await playwright.request.newContext({
      baseURL: PETSTORE_API_ROOT,
    });

    try {
      const response = await context.get('store/inventory');
      expect(response.status()).toBe(200);
      const inventory = await response.json();
      expect(typeof inventory).toBe('object');
    } finally {
      await context.dispose();
    }
  });

  test('store inventory accepts unknown api key on demo API', async ({
    playwright,
  }) => {
    const context = await playwright.request.newContext({
      baseURL: PETSTORE_API_ROOT,
      extraHTTPHeaders: {
        [PETSTORE_API_KEY_HEADER]: 'invalid-api-key',
      },
    });

    try {
      const response = await context.get('store/inventory');
      expect(response.status()).toBe(200);
    } finally {
      await context.dispose();
    }
  });

  test('store inventory uses project-configured api key header', async ({
    request,
  }) => {
    const response = await request.get('store/inventory');

    expect(response.status()).toBe(200);
  });
});
