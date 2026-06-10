import { test, expect } from '../../baseTest';
import { UserService } from '../pageObjects/userService';

test.describe('Petstore User API', () => {
  test('should create a user and retrieve it by username', async ({ request }) => {
    const userService = new UserService(request);
    const username = `basia_${Date.now()}`;

    const user = {
      username,
      firstName: 'Basia',
      lastName: 'Test',
      email: `${username}@example.com`,
      password: 'secret123',
      phone: '1234567890',
      userStatus: 1,
    };

    const createResponse = await userService.createUser(user);
    expect(createResponse.code).toBe(200);

    const retrievedUser = await userService.getUserByUsername(username);

    expect(retrievedUser).toMatchObject({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      phone: user.phone,
      userStatus: user.userStatus,
    });
    expect(retrievedUser.id).toBe(Number(createResponse.message));
  });
});
