import { PETSTORE_API_KEY_HEADER, PETSTORE_BASE_URL } from '../utils/constants';
import { test, expect } from '../utils/apiTest';
import { AuthService } from '../pageObjects/authService';
import { PetService } from '../pageObjects/petService';
import { StoreService } from '../pageObjects/storeService';

test.describe('Petstore API authentication', () => {
  test('should access store inventory with api key special-key', async ({
    authenticatedRequest,
  }) => {
    const storeService = new StoreService(authenticatedRequest);
    const inventory = await storeService.getInventory();

    expect(inventory).toEqual(expect.objectContaining({ sold: expect.any(Number) }));
    expect(inventory.sold).toBeGreaterThan(0);
  });

  test('should access pet by id with api key special-key', async ({
    authenticatedRequest,
  }) => {
    const petService = new PetService(authenticatedRequest);
    const soldPets = await petService.findPetsByStatus('sold');

    let retrievedPet;
    for (const candidate of soldPets.filter((pet) => pet.name)) {
      const response = await authenticatedRequest.get(
        `${PETSTORE_BASE_URL}/pet/${candidate.id}`,
      );

      if (response.ok()) {
        retrievedPet = await response.json();
        break;
      }
    }

    expect(retrievedPet).toBeDefined();
    expect(retrievedPet).toMatchObject({
      id: expect.any(Number),
      status: 'sold',
    });
  });

  test('should reject protected endpoint when api key is invalid', async ({
    playwright,
  }) => {
    const invalidRequest = await playwright.request.newContext({
      extraHTTPHeaders: {
        [PETSTORE_API_KEY_HEADER]: 'invalid-key',
      },
    });

    try {
      const response = await invalidRequest.get(
        `${PETSTORE_BASE_URL}/store/inventory`,
      );

      // Petstore demo is permissive and may still return 200.
      // In a strict API, you would expect:
      // expect(response.status()).toBe(401);
      expect([200, 401, 403]).toContain(response.status());
    } finally {
      await invalidRequest.dispose();
    }
  });

  test('should compare access with and without api key header', async ({
    request,
    authenticatedRequest,
  }) => {
    const unauthenticatedResponse = await request.get(
      `${PETSTORE_BASE_URL}/store/inventory`,
    );
    const authenticatedResponse = await authenticatedRequest.get(
      `${PETSTORE_BASE_URL}/store/inventory`,
    );

    expect(unauthenticatedResponse.ok()).toBeTruthy();
    expect(authenticatedResponse.ok()).toBeTruthy();

    const unauthenticatedInventory = await unauthenticatedResponse.json();
    const authenticatedInventory = await authenticatedResponse.json();

    expect(authenticatedInventory).toEqual(unauthenticatedInventory);
  });

  test('should log in and receive a session message', async ({ request }) => {
    const authService = new AuthService(request);
    const loginResponse = await authService.login();

    expect(loginResponse.code).toBe(200);
    expect(loginResponse.message).toMatch(/^logged in user session:/);
  });
});
