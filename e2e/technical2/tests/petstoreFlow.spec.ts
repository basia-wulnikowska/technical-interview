import { test, expect } from '../utils/apiTest';
import { AuthService } from '../pageObjects/authService';
import { PetService } from '../pageObjects/petService';
import { StoreService } from '../pageObjects/storeService';
import { UserService, type User } from '../pageObjects/userService';
import { PetNameCounter } from '../utils/petNameCounter';
import { writePetstoreOutput } from '../utils/petstoreOutput';
import { generateUsername, USERNAME_REGEX } from '../utils/usernameGenerator';

test.describe('Petstore API flow', () => {
  let createdUsername: string | undefined;

  test.afterEach(async ({ request }) => {
    if (!createdUsername) {
      return;
    }

    await new UserService(request).deleteUser(createdUsername);
    createdUsername = undefined;
  });

  test('auth, user lifecycle, sold pets, and name counts', async ({
    request,
  }, testInfo) => {
    const authService = new AuthService(request);
    const storeService = new StoreService(request);
    const userService = new UserService(request);
    const petService = new PetService(request);

    await test.step('verify login endpoint (exercise requirement)', async () => {
      const loginResponse = await authService.login();

      expect(loginResponse.code).toBe(200);
      expect(loginResponse.message).toMatch(/^logged in user session:/);
    });

    await test.step('verify store inventory with project api_key header', async () => {
      const inventory = await storeService.getInventory();
      expect(inventory.sold).toBeGreaterThan(0);
    });

    const username = generateUsername();
    createdUsername = username;
    expect(username).toMatch(USERNAME_REGEX);
    expect(username).not.toMatch(/basia/i);

    const user: User = {
      username,
      firstName: 'Test',
      lastName: 'User',
      email: `${username}@example.com`,
      password: 'secret123',
      phone: '1234567890',
      userStatus: 1,
    };

    const createResponse = await test.step('create user', async () => {
      const response = await userService.createUser(user);
      expect(response.code).toBe(200);
      return response;
    });

    const retrievedUser =
      await test.step('retrieve user by username', async () => {
        const found = await userService.getUserByUsername(username);

        expect(found).toMatchObject({
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password,
          phone: user.phone,
          userStatus: user.userStatus,
        });
        expect(found.id).toBe(Number(createResponse.message));

        return found;
      });

    const userOutputPath = await writePetstoreOutput(
      'user.json',
      retrievedUser,
    );
    await testInfo.attach('user.json', { path: userOutputPath });

    const soldPetSummaries =
      await test.step('retrieve sold pets as {id, name} tuples', async () => {
        const soldPets = await petService.findPetsByStatus('sold');
        const summaries = petService.listSoldPetSummaries(soldPets);

        expect(summaries.length).toBeGreaterThan(0);

        for (const pet of summaries) {
          expect(pet).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
            }),
          );
        }

        return summaries;
      });

    const soldPetsOutputPath = await writePetstoreOutput(
      'sold-pets.json',
      soldPetSummaries,
    );
    await testInfo.attach('sold-pets.json', { path: soldPetsOutputPath });

    await test.step('count pets that share the same name', async () => {
      const petNameCounter = new PetNameCounter(soldPetSummaries);
      const sharedPetNames = petNameCounter.countSharedPetNames();

      expect(Object.keys(sharedPetNames).length).toBeGreaterThan(0);

      for (const [name, count] of Object.entries(sharedPetNames)) {
        expect(typeof name).toBe('string');
        expect(count).toBeGreaterThan(1);
      }

      const sharedNamesOutputPath = await writePetstoreOutput(
        'shared-pet-names.json',
        sharedPetNames,
      );

      await testInfo.attach('shared-pet-names.json', {
        path: sharedNamesOutputPath,
      });
    });
  });
});
