# Playwright Test Automation

End-to-end and API test suite built with [Playwright](https://playwright.dev/). It covers a **UI flow** (Google search → Wikipedia) and a **Petstore API flow** (auth, users, pets) against the [Swagger Petstore](https://petstore.swagger.io/).

Tests are organised by exercise area, use the Page Object pattern, and produce both **Playwright HTML** and **Allure** reports.

---

## Quick start (local)

```bash
git clone <repository-url>
cd playwright

npm install
npx playwright install chrome

npm run test:local
npm run report:html          # Playwright HTML report (full-page Wikipedia screenshot)
npm run report:allure:serve  # Allure report (viewport Wikipedia screenshot)
```

The first UI run may pause for Google CAPTCHA — see [Resolving Google CAPTCHA](#resolving-google-captcha) below.

---

## Project structure

```
e2e/
├── baseTest.ts                      # Shared helpers (screenshot + Allure attachment)
├── technical1/                      # UI tests
│   ├── tests/
│   │   └── googletest.spec.ts       # Google → Wikipedia test
│   ├── pageObjects/
│   │   └── googleSearchPage.ts      # Page object (search, CAPTCHA, pagination)
│   ├── GOOGLE_LOCATORS.md           # Google selector maintenance & fallbacks
│   └── utils/
│       ├── googleTest.ts            # googleSearchPage fixture
│       ├── googleLocators.ts        # Language-neutral Google selector chains
│       └── constants.ts             # URLs, keywords, session path
└── technical2/                      # API tests
    ├── tests/
    │   ├── petstoreFlow.spec.ts     # End-to-end API flow + file output
    │   └── petstoreNegative.spec.ts # Negative / edge API cases
    ├── pageObjects/
    │   ├── authService.ts
    │   ├── userService.ts
    │   ├── petService.ts
    │   └── storeService.ts
    ├── output/                      # Generated JSON (gitignored except .gitkeep)
    └── utils/
        ├── apiTest.ts               # Re-exports base test (API key on project config)
        ├── apiTypes.ts              # Shared API response types
        ├── constants.ts             # Petstore base URL, credentials
        ├── http.ts                  # parseOkJson — HTTP error handling for services
        ├── petNameCounter.ts        # Counts sold pets by name (shared names only)
        ├── petstoreOutput.ts        # Writes JSON results under output/
        └── usernameGenerator.ts     # Regex-based test username generation
```

Both `technical1` and `technical2` follow the same layout: **`tests/`** for specs, **`pageObjects/`** for page/service classes, **`utils/`** for constants and custom fixtures.

### UI tests (`technical1`)

| File | Description |
|------|-------------|
| `e2e/technical1/tests/googletest.spec.ts` | Searches Google for "Automation", opens the Wikipedia result, verifies the first automatic process year (1785), attaches a screenshot |
| `e2e/technical1/pageObjects/googleSearchPage.ts` | Page object: language-neutral Google UI (stable IDs / `name="q"`), CAPTCHA, pagination, Wikipedia content helpers |
| `e2e/technical1/utils/googleTest.ts` | Custom fixture that injects `googleSearchPage` |

Runs in **headed Chrome** locally. Skipped automatically in CI (live Google / CAPTCHA is not suitable for pipelines).

### API tests (`technical2`)

| File | Description |
|------|-------------|
| `e2e/technical2/tests/petstoreFlow.spec.ts` | One ordered flow: login check → user create/retrieve → sold pets → shared name counts (API key via project config) |
| `e2e/technical2/tests/petstoreNegative.spec.ts` | Negative / edge cases: 404 user, invalid pet status, inventory without / wrong api key |
| `e2e/technical2/utils/apiTest.ts` | API test entrypoint; `api_key` header set on `local-api` / `ci-api` projects |
| `e2e/technical2/utils/http.ts` | Shared HTTP helper (`parseOkJson`) — services throw on non-OK responses; specs assert business rules |

API tests use Playwright's `request` fixture (no browser). Service classes live under `pageObjects/` and use relative paths with `baseURL` from the Playwright config.

After a run, Petstore results are written to `e2e/technical2/output/`:

| File | Contents |
|------|----------|
| `user.json` | Retrieved user from create + GET |
| `sold-pets.json` | Sold pets as `{id, name}` tuples |
| `shared-pet-names.json` | Names shared by more than one pet, e.g. `{"William": 11, "Floyd": 2}` |

---

## Prerequisites

| Requirement | Needed for |
|-------------|------------|
| **Node.js** 18+ (20 recommended) | All tests |
| **npm** | Install dependencies |
| **Google Chrome** | Local UI tests (`local-ui`) |
| Internet access | Google, Wikipedia, Petstore API |

No `.env` file is required for local runs. Petstore settings read from `e2e/technical2/utils/constants.ts` with optional env overrides (see [Configuration reference](#configuration-reference)).

---

## Installation

There is no compile/build step — TypeScript is run directly by Playwright.

```bash
cd playwright
npm install
npx playwright install chrome
npm run typecheck
npm run lint
npm run format:check
```

The `playwright/.auth/` folder is included in the repo (for session storage). The session file itself is gitignored.

### Before committing

Run the same checks as CI (fast API-only test gate):

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test:ci
```

For a full local validation including the Google UI test, use `npm run test:local` instead of `npm run test:ci`.

---

## Resolving Google CAPTCHA

Local UI tests run in **headed Chrome**. Google may show a CAPTCHA or "unusual traffic" page — this is expected on automated searches.

### When CAPTCHA is detected

The test pauses automatically and the **Playwright Inspector** opens. You will see the browser window and a paused test.

### What to do

1. Run the local suite:
   ```bash
   npm run test:local
   ```
   Or UI only:
   ```bash
   npx playwright test --project=local-ui
   ```

2. When the browser opens on Google, accept cookies if prompted.

3. If the test **pauses** (CAPTCHA, `/sorry/` page, or reCAPTCHA iframe):
   - Solve the challenge in the browser window
   - In the **Playwright Inspector**, click **Resume** (or press the resume shortcut)

4. CAPTCHA can also appear **after the search**. If the test pauses again, solve it and click **Resume** once more.

5. After a successful run, your session is saved to:
   ```
   playwright/.auth/google-session.json
   ```
   Later runs reuse this file automatically (configured in `playwright.config.ts`).

### Tips

- Always use `--project=local-ui` or `npm run test:local` — headed mode is required for manual CAPTCHA solving.
- Do not commit `google-session.json` — it is gitignored and personal to your machine.
- If CAPTCHA appears on every run, delete the session and authenticate again:
  ```bash
  rm playwright/.auth/google-session.json
  npx playwright test --project=local-ui
  ```
- In CI (`npm run test:ci`), UI tests are **skipped** automatically — no CAPTCHA handling needed there.

---

## How to run tests

### Recommended commands

| Command | What it does |
|---------|----------------|
| `npm test` | Alias for `npm run test:local` |
| `npm run test:local` | Full local run: **UI first**, then **API** (cleans Allure output first) |
| `npm run test:local:parallel` | Local run with **UI and API in parallel** (one worker per suite) |
| `npm run test:google` | Google UI only (`@google` tag, headed Chrome) |
| `npm run test:ci` | CI-style run: UI skipped, API only (cleans Allure output first) |
| `npm run test:ci:parallel` | CI API tests in parallel (`ci-api-1` → `ci-api-2`); `ci-ui` does not run |
| `npm run typecheck` | Static TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint (TypeScript + Playwright rules) |
| `npm run lint:fix` | ESLint with auto-fix where possible |
| `npm run format` | Prettier — format all tracked source files |
| `npm run format:check` | Prettier — verify formatting (CI) |
| `npm run report:html` | Open Playwright HTML report from the last run |
| `npm run report:allure` | Generate static Allure HTML from `allure-results/` |
| `npm run report:allure:serve` | Open Allure UI from raw `allure-results/` (no static HTML build) |

### Test execution order

**Default (sequential):** projects use **dependencies** so UI always runs before API:

```
local-ui  →  local-api
ci-ui     →  ci-api   (UI skipped in CI)
```

`npm run test:local` runs the **full local suite**: **1 UI test** (`local-ui`) then **6 API tests** (`local-api`). The script cleans Allure output, then runs:

```bash
npx playwright test --project=local-api
```

You only pass `--project=local-api`, but Playwright also runs `local-ui` first because `local-api` depends on it. Same full suite explicitly:

```bash
npx playwright test --project=local-ui --project=local-api
```

This mode uses **1 worker**.

`npm run test:ci` runs **6 API tests** (`ci-api`). The script passes `--project=ci-api`; Playwright runs `ci-ui` first, but that project **skips** the Google test in CI:

```bash
npx playwright test --project=ci-api
```

API only, without the skipped UI project:

```bash
npx playwright test --project=ci-api --no-deps
```

**Optional (parallel suites):** set `PARALLEL_SUITES=true` to run `technical1` and `technical2` at the same time on **2 workers** — one worker per suite. Tests within a single suite still run **serially** (no parallel execution across multiple specs in `technical1` or `technical2`). If you add more spec files to one suite, they are chained as dependent projects (`local-ui-1` → `local-ui-2`, etc.) so order is preserved.

```bash
npm run test:local:parallel
# or
PARALLEL_SUITES=true npx playwright test --project=local-ui --project=local-api-2
```

With `PARALLEL_SUITES=true`, each API spec file gets its own project (`local-api-1` → `local-api-2`, `ci-api-1` → `ci-api-2`). The npm parallel scripts target `local-api-2` / `ci-api-2`, which pulls in the chained API projects automatically.

Parallel mode is **off by default**. Enable it via the env var or set `PARALLEL_SUITES` to `true` in `playwright.config.ts`.

Both modes run the **same 7 test cases** in 3 spec files (1 UI + 6 API locally; 6 API in CI with UI skipped). Verified commands:

| Mode | Local | CI |
|------|-------|-----|
| Sequential (default) | `npm run test:local` | `npm run test:ci` |
| Parallel suites | `npm run test:local:parallel` | `npm run test:ci:parallel` |

### Projects

| Project | UI tests | API tests | Browser |
|---------|----------|-----------|---------|
| `local-ui` | Yes (headed Chrome) | — | Headed |
| `local-api` | — (runs after `local-ui` by default) | Yes (flow + negative) | No browser |
| `ci-ui` | Skipped | — | Headless |
| `ci-api` | — (runs after `ci-ui`) | Yes (flow + negative) | No browser |

With `PARALLEL_SUITES=true`, API specs split into `local-api-1` / `local-api-2` (and `ci-api-1` / `ci-api-2`) — one project per spec file, chained in order.

### Useful Playwright CLI options

You can pass any [Playwright CLI argument](https://playwright.dev/docs/test-cli) after `--`:

```bash
# UI only (1 test)
npx playwright test --project=local-ui

# Full local suite — UI first, then API (7 tests); same as npm run test:local
npx playwright test --project=local-api

# API only, skip UI dependency (6 tests)
npx playwright test --project=local-api --no-deps

# Run a single spec file
npx playwright test technical2/tests/petstoreFlow.spec.ts --project=ci-api

# Run tests matching a title pattern
npx playwright test -g "Automation" --project=local-ui

# Debug mode (step through UI test)
npx playwright test --project=local-ui --debug

# Headed override (if needed)
npx playwright test --project=local-ui --headed

# List tests without running
npx playwright test --list
```

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PARALLEL_SUITES` | off | Set to `true` to run `technical1` and `technical2` in parallel (2 workers, serial within each suite) |
| `CI` | — | Set automatically in most CI runners; enables JUnit + GitHub reporters |
| `PETSTORE_BASE_URL` | `https://petstore.swagger.io/v2` | API host |
| `PETSTORE_API_KEY` | `special-key` | Demo API key (Swagger Petstore documents this value) |
| `PETSTORE_LOGIN_USER` | `user1` | Login username |
| `PETSTORE_LOGIN_PASSWORD` | `pass` | Login password |

The demo Petstore does not enforce API-key auth on inventory — the `api_key` header is applied via Playwright project config for all API tests; negative tests use a plain context when no header is needed.

---

## Reports

Every test run produces output for **three** reporters configured in `playwright.config.ts`:

- `list` — terminal output
- `html` — Playwright HTML report
- `allure-playwright` — raw Allure results

### Playwright HTML report

```bash
npm run report:html
# or
npx playwright show-report
```

Opens `playwright-report/index.html` (generated automatically after every run). For the UI test, open **local-ui** → **Screenshots** to see the **full-page Wikipedia** capture (`attachFullPageScreenshot` in `e2e/baseTest.ts`).

### Allure report

```bash
# After a test run — open Allure UI from raw results (recommended)
npm run report:allure:serve

# Or generate static report, then open separately
npm run report:allure
npm run report:allure:open
```

| Output folder | Contents |
|---------------|----------|
| `allure-results/` | Raw results (gitignored) |
| `allure-report/` | Generated HTML report (gitignored) |

**Tip:** `npm run test:local` and `npm run test:ci` clean `allure-results` before each run so you do not see duplicate tests or false "retries" from old runs.

For the Google UI test in Allure, open **local-ui** → the Wikipedia test → step **"Attach Wikipedia screenshot"** for the **viewport** PNG. The API flow test attaches `user.json`, `sold-pets.json`, and `shared-pet-names.json` under **local-api**.

| Report | UI screenshot | API attachments |
|--------|---------------|-----------------|
| Playwright HTML | Full-page PNG | — |
| Allure | Viewport PNG (Wikipedia step) | `user.json`, `sold-pets.json`, `shared-pet-names.json` |

---

## CI/CD readiness

The project is structured for pipeline adoption:

| Feature | Status |
|---------|--------|
| Separate `ci-ui` / `ci-api` projects | Ready |
| UI tests auto-skipped in CI | Ready (`ci-*` projects) |
| API tests run headless, no browser | Ready |
| `retries: 0` (explicit, predictable runs) | Configured |
| HTML + Allure reporters | Configured |
| `npm run test:ci` one-liner | Ready |
| Google session / auth folder gitignored | Ready |
| Project dependencies (UI → API order) | Configured (default sequential mode) |
| Optional parallel suites (`PARALLEL_SUITES`) | Configured (off by default) |
| `npm run typecheck` in CI | Configured |
| ESLint + Prettier in CI | Configured (`npm run lint`, `npm run format:check`) |
| JUnit + GitHub reporters in CI | Configured (`test-results/junit.xml`) |
| `@google` tag for UI suite | Configured |
| User cleanup after API flow | `deleteUser` in `afterEach` |
| Negative API spec | `petstoreNegative.spec.ts` |

### CI pipeline

The repo ships a working workflow at `.github/workflows/playwright.yml`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. `npm run test:ci` (with `CI=true`)
6. `npm run report:allure`
7. Upload `test-results/junit.xml`, `playwright-report/`, and `allure-report/`

No `npx playwright install` is required for the current API-only CI gate. Add browser install if you later run `@google` tests in the pipeline.

### Optional CI enhancements (not yet implemented)

- Shard API tests with `npx playwright test --shard=1/3` if the suite grows
- Store Allure history for trend charts across builds

---

## Configuration reference

Main settings live in `playwright.config.ts`:

- **Timeout:** 120 seconds per test
- **Retries:** 0
- **Workers:** 1 by default; 2 when `PARALLEL_SUITES=true` (one per suite)
- **Parallel suites:** off by default (`PARALLEL_SUITES` env var or config constant)
- **Within-suite parallelism:** disabled (`fullyParallel: false`); multiple spec files in one suite run serially via project dependencies
- **API `baseURL`:** `PETSTORE_API_ROOT` (`https://petstore.swagger.io/v2/`) on `local-api` / `ci-api` projects — trailing slash required for relative paths
- **API `api_key`:** sent via `extraHTTPHeaders` on API projects (not a separate fixture); login is called explicitly in the flow test as an exercise step
- **Credentials:** env overrides in `e2e/technical2/utils/constants.ts`; defaults match Swagger Petstore demo docs
- **CI reporters:** `junit` → `test-results/junit.xml`, `github` for Actions annotations (when `CI=true`)
- **Local UI:** headed Chrome, optional saved Google session
- **CI:** headless, standard viewport

### Code conventions

- **Page objects / services** expose actions and data; **specs** own `expect` assertions
- **UI locators** are language-neutral — see `e2e/technical1/GOOGLE_LOCATORS.md`; Google tests tagged `@google`
- **Wikipedia flow** asserts the SERP link `href` before content checks; fallback navigation to EN article is a named `test.step`
- **API services** use relative paths and throw on HTTP errors via `parseOkJson`
- **ESLint** (`eslint.config.mjs`) — TypeScript recommended rules + `eslint-plugin-playwright` on `*.spec.ts`
- **Prettier** (`.prettierrc.json`) — single quotes, trailing commas, 80-char width; run `npm run format` before committing

---

## Repository files

| File / folder | Purpose |
|---------------|---------|
| `playwright.config.ts` | Projects, reporters, timeouts |
| `tsconfig.json` | TypeScript settings for IDE support |
| `eslint.config.mjs` | ESLint flat config (TypeScript + Playwright) |
| `.prettierrc.json` | Prettier formatting rules |
| `package.json` | Dependencies and npm scripts |
| `.gitignore` | Ignores reports, test results, session cookies |
| `.github/workflows/playwright.yml` | CI pipeline (typecheck, lint, format, `test:ci`, reports) |
| `.prettierignore` | Paths excluded from Prettier |
| `playwright/.auth/` | Google session storage (folder tracked, session file ignored) |
| `e2e/` | All tests, page objects, and utilities |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Project(s) "local" not found` | Use `npm run test:local` (UI + API) or `--project=local-ui` / `--project=local-api` |
| Test paused on Google | Solve CAPTCHA in the browser, then click **Resume** in Playwright Inspector — see [Resolving Google CAPTCHA](#resolving-google-captcha) |
| Google CAPTCHA on every run | Delete `playwright/.auth/google-session.json` and run `--project=local-ui` again to create a fresh session |
| Empty Allure attachments | Open the **Google UI** test under `local-ui`, not the API test; check step **"Attach Wikipedia screenshot"** |
| Duplicate tests in Allure | Use `npm run test:local` / `test:ci` (they clean `allure-results` first) |
| `ENOENT` for `google-session.json` on first run | Normal — the file is created after the first successful Google visit with CAPTCHA resolved |

---

## License

ISC
