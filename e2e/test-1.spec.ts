import { test, expect } from '@playwright/test';
import assert from 'assert';

test('test', async ({ page }) => {
  await page.goto('https://www.google.com/');
  await page.getByRole('button', { name: 'Zaakceptuj wszystko' }).click();
  await page.getByRole('combobox', { name: 'Szukaj' }).click();
  await page.getByRole('combobox', { name: 'Szukaj' }).fill('marvel');
  assert.equal
});