import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const googleSession = path.join(__dirname, 'playwright/.auth/google-session.json');
const { viewport: _viewport, deviceScaleFactor: _dsf, ...desktopChrome } =
  devices['Desktop Chrome'];

export default defineConfig({
  timeout: 120_000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    ...desktopChrome,
    channel: 'chrome',
    headless: false,
    viewport: null,
    video: 'off',
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--start-fullscreen',
      ],
    },
  },
  projects: [
    {
      name: 'local',
      use: {
        ...(fs.existsSync(googleSession) ? { storageState: googleSession } : {}),
      },
    },
    {
      name: 'ci-pipeline',
      use: {
        headless: true,
        viewport: _viewport,
        deviceScaleFactor: _dsf,
        launchOptions: {
          args: [],
        },
      },
    },
  ],
});
