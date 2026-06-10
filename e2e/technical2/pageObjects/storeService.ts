import { expect, type APIRequestContext } from '@playwright/test';
import { PETSTORE_BASE_URL } from '../utils/constants';

export type StoreInventory = Record<string, number>;

export class StoreService {
  constructor(private readonly request: APIRequestContext) {}

  async getInventory() {
    const response = await this.request.get(`${PETSTORE_BASE_URL}/store/inventory`);

    await expect(response).toBeOK();
    return response.json() as Promise<StoreInventory>;
  }
}
