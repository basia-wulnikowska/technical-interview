import type { APIRequestContext } from '@playwright/test';
import type { ApiMessageResponse } from '../utils/apiTypes';
import { parseOkJson } from '../utils/http';

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

  async createUser(user: User): Promise<ApiMessageResponse> {
    const response = await this.request.post('user', {
      data: user,
    });

    return parseOkJson<ApiMessageResponse>(response);
  }

  async getUserByUsername(username: string): Promise<User> {
    const response = await this.request.get(`user/${username}`);

    return parseOkJson<User>(response);
  }

  async deleteUser(username: string): Promise<void> {
    const response = await this.request.delete(`user/${username}`);

    if (response.status() !== 404 && !response.ok()) {
      const body = await response.text();
      throw new Error(
        `HTTP ${response.status()} ${response.statusText()}: ${body}`,
      );
    }
  }
}
