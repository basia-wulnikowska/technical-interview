import { expect, type APIRequestContext } from '@playwright/test';
import {
  PETSTORE_BASE_URL,
  PETSTORE_LOGIN_PASSWORD,
  PETSTORE_LOGIN_USER,
} from '../utils/constants';

export class AuthService {
  constructor(private readonly request: APIRequestContext) {}

  async login(username = PETSTORE_LOGIN_USER, password = PETSTORE_LOGIN_PASSWORD) {
    const response = await this.request.get(`${PETSTORE_BASE_URL}/user/login`, {
      params: { username, password },
    });

    await expect(response).toBeOK();
    return response.json() as Promise<{ code: number; type: string; message: string }>;
  }
}
