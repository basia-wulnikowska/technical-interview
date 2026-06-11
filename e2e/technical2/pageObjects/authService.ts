import type { APIRequestContext } from '@playwright/test';
import type { ApiMessageResponse } from '../utils/apiTypes';
import {
  PETSTORE_LOGIN_PASSWORD,
  PETSTORE_LOGIN_USER,
} from '../utils/constants';
import { parseOkJson } from '../utils/http';

export class AuthService {
  constructor(private readonly request: APIRequestContext) {}

  async login(
    username = PETSTORE_LOGIN_USER,
    password = PETSTORE_LOGIN_PASSWORD,
  ): Promise<ApiMessageResponse> {
    const response = await this.request.get('user/login', {
      params: { username, password },
    });

    return parseOkJson<ApiMessageResponse>(response);
  }
}
