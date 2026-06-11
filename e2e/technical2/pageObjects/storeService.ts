import type { APIRequestContext } from '@playwright/test';
import { parseOkJson } from '../utils/http';

export type StoreInventory = Record<string, number>;

export class StoreService {
  constructor(private readonly request: APIRequestContext) {}

  async getInventory(): Promise<StoreInventory> {
    const response = await this.request.get('store/inventory');

    return parseOkJson<StoreInventory>(response);
  }
}
