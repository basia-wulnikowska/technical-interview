import { expect, type APIRequestContext } from '@playwright/test';
import { PETSTORE_BASE_URL } from '../utils/constants';

export type User = {
  id?: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
};

export class UserService {
  constructor(private readonly request: APIRequestContext) {}

  async createUser(user: User) {
    const response = await this.request.post(`${PETSTORE_BASE_URL}/user`, {
      data: user,
    });

    await expect(response).toBeOK();
    return response.json() as Promise<{ code: number; type: string; message: string }>;
  }

  async getUserByUsername(username: string) {
    const response = await this.request.get(
      `${PETSTORE_BASE_URL}/user/${username}`,
    );

    await expect(response).toBeOK();
    return response.json() as Promise<User>;
  }
}
