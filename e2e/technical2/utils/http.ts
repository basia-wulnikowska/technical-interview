import type { APIResponse } from '@playwright/test';

export async function parseOkJson<T>(response: APIResponse): Promise<T> {
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `HTTP ${response.status()} ${response.statusText()}: ${body}`,
    );
  }

  return response.json() as Promise<T>;
}
