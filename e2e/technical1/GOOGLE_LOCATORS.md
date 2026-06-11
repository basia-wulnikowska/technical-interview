# Google UI — locator maintenance

The `technical1` UI test targets live Google and Wikipedia. Google changes DOM IDs and layout without notice.

## Primary selectors (language-neutral)

| Element       | Primary                                 | Fallback                                   |
| ------------- | --------------------------------------- | ------------------------------------------ |
| Search        | `textarea[name="q"]`, `input[name="q"]` | `#APjFqb`                                  |
| Next page     | `#pnnext`                               | URL `start=` increment                     |
| Cookie accept | `#L2AGLb`                               | Same ID inside `consent.google.com` iframe |

Definitions live in `e2e/technical1/utils/googleLocators.ts`.

## Maintenance risk

- **High:** `#APjFqb`, `#L2AGLb`, `#pnnext` — internal Google IDs, can change anytime.
- **Medium:** `name="q"` — stable for years but not guaranteed.
- **Low:** Wikipedia `#mw-content-text`, `#firstHeading` — MediaWiki IDs.

## Fallback strategy

1. **Search** — chain `name="q"` → `#APjFqb`.
2. **Pagination** — if `#pnnext` is missing, advance via `?start=` query param (`goToNextSearchPageByUrl`).
3. **Cookies** — try main page, then consent iframe; skip if banner absent (saved session).
4. **CAPTCHA** — pause for manual solve; persist session to `playwright/.auth/google-session.json`.
5. **Wikipedia** — prefer `en.wikipedia.org/wiki/Automation` SERP link; assert `clickedHref` in the spec. English article fallback navigation is explicit in reports when SERP lands elsewhere.

## Running Google tests

Tagged `@google` — excluded from CI (`ci-ui` skips them).

```bash
npm run test:google
npx playwright test --grep @google --project=local-ui
```

Do not run `@google` tests in headless CI without a recorded session and CAPTCHA plan.
