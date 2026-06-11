export const PETSTORE_BASE_URL =
  process.env.PETSTORE_BASE_URL ?? 'https://petstore.swagger.io/v2';

export const PETSTORE_API_ROOT = `${PETSTORE_BASE_URL}/`;

export const PETSTORE_API_KEY_HEADER = 'api_key';
export const PETSTORE_API_KEY = process.env.PETSTORE_API_KEY ?? 'special-key';

export const PETSTORE_LOGIN_USER = process.env.PETSTORE_LOGIN_USER ?? 'user1';
export const PETSTORE_LOGIN_PASSWORD =
  process.env.PETSTORE_LOGIN_PASSWORD ?? 'pass';

export const PETSTORE_OUTPUT_DIR = 'e2e/technical2/output';
