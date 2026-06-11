import { defineConfig, devices, type Project } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  PETSTORE_API_KEY,
  PETSTORE_API_KEY_HEADER,
  PETSTORE_API_ROOT,
} from './e2e/technical2/utils/constants';

const petstoreApiHeaders = {
  [PETSTORE_API_KEY_HEADER]: PETSTORE_API_KEY,
};

const PARALLEL_SUITES = process.env.PARALLEL_SUITES === 'true';

/**
 * Google session — local-ui only (no CI/CD handling yet).
 *
 * `storageState` loads `playwright/.auth/google-session.json` when the file exists
 * (created after a successful local run with CAPTCHA resolved). This applies only to
 * `local-ui`; `ci-ui` does not load it and `@google` tests are skipped in CI.
 *
 * CI/CD options if Google UI must run in pipeline later:
 * - Restore a pre-authenticated storageState from a protected CI secret/artifact
 * - Replace live Google with HAR replay, API stubs, or a dedicated manual job
 * - Keep PR gates on `ci-api` only and run `@google` on a scheduled headed workflow
 *
 * @see e2e/technical1/GOOGLE_LOCATORS.md
 */
const googleSession = path.join(
  __dirname,
  'playwright/.auth/google-session.json',
);
const {
  viewport: _viewport,
  deviceScaleFactor: _dsf,
  ...desktopChrome
} = devices['Desktop Chrome'];

const localUse = {
  ...desktopChrome,
  channel: 'chrome' as const,
  headless: false,
  viewport: null,
  video: 'off' as const,
  launchOptions: {
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-fullscreen',
    ],
  },
  ...(fs.existsSync(googleSession) ? { storageState: googleSession } : {}),
};

const ciUse = {
  ...desktopChrome,
  headless: true,
  viewport: _viewport,
  deviceScaleFactor: _dsf,
  launchOptions: {
    args: [] as string[],
  },
};

const localApiUse = {
  ...localUse,
  baseURL: PETSTORE_API_ROOT,
  extraHTTPHeaders: petstoreApiHeaders,
};

const ciApiUse = {
  ...ciUse,
  baseURL: PETSTORE_API_ROOT,
  extraHTTPHeaders: petstoreApiHeaders,
};

const e2eDir = path.join(__dirname, 'e2e');

function listSpecFiles(suiteDir: string): string[] {
  const root = path.join(e2eDir, suiteDir);
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(root);
  return files.sort();
}

function buildSuiteProjects(
  name: string,
  suiteDir: string,
  use: Project['use'],
  dependsOn?: string,
): Project[] {
  const specFiles = listSpecFiles(suiteDir);

  if (!PARALLEL_SUITES) {
    return [
      {
        name,
        testMatch: `**/${suiteDir}/**/*.spec.ts`,
        use,
        fullyParallel: false,
        ...(dependsOn ? { dependencies: [dependsOn] } : {}),
      },
    ];
  }

  return specFiles.map((file, index) => {
    const multiFile = specFiles.length > 1;
    const projectName = multiFile ? `${name}-${index + 1}` : name;
    const previousName = multiFile ? `${name}-${index}` : name;

    return {
      name: projectName,
      testMatch: path.relative(e2eDir, file).replace(/\\/g, '/'),
      use,
      fullyParallel: false,
      ...(index > 0 ? { dependencies: [previousName] } : {}),
    };
  });
}

const localUiProjects = buildSuiteProjects('local-ui', 'technical1', localUse);
const localApiProjects = buildSuiteProjects(
  'local-api',
  'technical2',
  localApiUse,
  PARALLEL_SUITES ? undefined : 'local-ui',
);
const ciUiProjects = buildSuiteProjects('ci-ui', 'technical1', ciUse);
const ciApiProjects = buildSuiteProjects(
  'ci-api',
  'technical2',
  ciApiUse,
  PARALLEL_SUITES ? undefined : 'ci-ui',
);

const reporters: Parameters<typeof defineConfig>[0]['reporter'] = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  [
    'allure-playwright',
    {
      resultsDir: 'allure-results',
      environmentInfo: {
        os_platform: os.platform(),
        os_release: os.release(),
        node_version: process.version,
        parallel_suites: String(PARALLEL_SUITES),
      },
    },
  ],
];

if (process.env.CI) {
  reporters.push(
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'],
  );
}

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  retries: 0,
  fullyParallel: false,
  workers: PARALLEL_SUITES ? 2 : 1,
  reporter: reporters,
  projects: [
    ...localUiProjects,
    ...localApiProjects,
    ...ciUiProjects,
    ...ciApiProjects,
  ],
});
