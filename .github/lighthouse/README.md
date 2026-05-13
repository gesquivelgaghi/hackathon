# Lighthouse a11y — config, comment, and reusable workflow

This directory holds the Lighthouse-accessibility surface used by Landscape UI's CI: the Markdown PR-comment generator, hand-built fixtures for testing it, and a reusable `workflow_call` workflow (plus its shared base config) that other Canonical projects can adopt.

## How Landscape UI uses it today

Landscape UI's own PR check is **not** the reusable workflow in this directory. The actual config lives in [`scripts/lighthouserc.cjs`](../../scripts/lighthouserc.cjs) and is invoked inline by [`.github/workflows/lighthouse-a11y.yml`](../workflows/lighthouse-a11y.yml). That config:

- Builds the SPA in `audit` mode (`vite build --mode audit`) so MSW is bundled and auth guards are bypassed.
- Auto-discovers routes by importing `@/libs/routes` via [`scripts/list-routes.ts`](../../scripts/list-routes.ts).
- Asserts `categories:accessibility ≥ LIGHTHOUSE_MIN_SCORE` (default `1.0`).
- Uploads `.lighthouseci/` as the `lighthouse-a11y-reports` artifact.

The workflow then pipes the resulting `manifest.json` + `lhr-*.json` set through [`build-comment.cjs`](build-comment.cjs) and posts the output as a sticky PR comment.

## For external adopters: the reusable workflow

The remaining files (`audit-sets.cjs`, `lighthouserc.base.cjs`, `urls.*.txt`, and the reusable workflow under `../workflows/lighthouse-a11y.reusable.yml`) are an opinionated, parameterised path Canonical projects can adopt with one `uses:` line. They are independent of Landscape UI's own inline runner; the two paths coexist.

### Quick start

In a consumer repo, drop a workflow under `.github/workflows/`:

```yaml
name: Lighthouse a11y

on:
  pull_request:
    branches: [main]

jobs:
  a11y:
    uses: canonical/landscape-ui/.github/workflows/lighthouse-a11y.reusable.yml@main
    with:
      wcag-level: aa
      mode: annotate
      urls-file: .github/lighthouse/urls.public.txt
```

Add a `urls.public.txt` listing one path per line; that's the minimum viable adoption.

### Input reference

Declared at the top of [`../workflows/lighthouse-a11y.reusable.yml`](../workflows/lighthouse-a11y.reusable.yml). Common inputs:

| Input                  | Default                                   | Notes                                                                |
| ---------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `wcag-level`           | `aa`                                      | `a` / `aa` / `aaa`. Selects an audit set from `audit-sets.cjs`.      |
| `min-score`            | `""`                                      | Empty = use the per-level default (`0.85` / `0.90` / `0.95`).        |
| `urls-file`            | `""`                                      | Newline-separated paths; joined against `serve-url`.                 |
| `urls`                 | `""`                                      | Inline newline-separated URL list. Use either `urls` or `urls-file`. |
| `mode`                 | `block`                                   | `block` fails on assertion violation; `annotate` only comments.      |
| `config-path`          | `./lighthouserc.cjs`                      | Caller's consumer config (can wrap `createBaseConfig`).              |
| `serve-command`        | `pnpm preview --host 0.0.0.0 --port 4173` | Must serve at `serve-url`.                                           |
| `serve-url`            | `http://localhost:4173`                   | Base URL for relative paths from `urls-file`.                        |
| `pr-comment`           | `true`                                    | Post the sticky score-table comment.                                 |
| `upload-artifact-name` | `lighthouse-report`                       | Artifact name for the LHCI bundle.                                   |

### Extending the base config

```js
const {
  createBaseConfig,
} = require("./.github/lighthouse/lighthouserc.base.cjs");

const config = createBaseConfig({
  wcagLevel: process.env.LHCI_WCAG_LEVEL ?? "aa",
  urls: ["http://localhost:4173/"],
});

// Override an audit while remediating a known regression:
config.ci.assert.assertions["heading-order"] = ["warn"];

module.exports = config;
```

Signature is locked in [`lighthouse-a11y/specs/00-foundation.md` §2](../../lighthouse-a11y/specs/00-foundation.md).

### WCAG levels (audit-sets.cjs)

| Level | Floor  | Coverage                                                                                                                                        |
| ----- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `a`   | `0.85` | Document basics — `image-alt`, `document-title`, `html-has-lang`, `link-name`, `button-name`, `valid-lang`, `meta-viewport` (warn).             |
| `aa`  | `0.90` | All of A plus `color-contrast`, `label`, ARIA validity audits, `tabindex`, `frame-title`, `bypass`, list-structure audits, `duplicate-id-aria`. |
| `aaa` | `0.95` | All of AA plus `target-size`, `focus-traps`, `focusable-controls`, `heading-order`, `skip-link`, `use-landmarks` (all `warn`).                  |

Each entry in [`audit-sets.cjs`](audit-sets.cjs) carries an inline comment naming the WCAG criterion it most closely covers.

## Layout

| Path                                        | Used by                 | Purpose                                                                     |
| ------------------------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `build-comment.cjs`                         | Landscape UI workflow   | Markdown PR-comment generator. Zero runtime deps; safe on missing manifest. |
| `__fixtures__/`                             | `build-comment.test.ts` | Synthetic `manifest-*.json` + `lhr-*.json` for unit tests.                  |
| `audit-sets.cjs`                            | Reusable workflow       | WCAG-keyed audit matrices (`a` / `aa` / `aaa`).                             |
| `lighthouserc.base.cjs`                     | Reusable workflow       | `createBaseConfig` factory.                                                 |
| `urls.public.txt`, `urls.authenticated.txt` | Reusable workflow       | Example URL lists.                                                          |

## build-comment.cjs env contract

| Env                  | Meaning                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `LHCI_MODE`          | `block` or `annotate`. Picks the banner text. Default `annotate`.            |
| `LHCI_ARTIFACT_URL`  | URL embedded as the "Full report artifact" link. Omit to suppress.           |
| `LHCI_RESULTS_DIR`   | Override the manifest directory (default `./.lighthouseci`). Tests use this. |
| `LHCI_MANIFEST_FILE` | Override the manifest filename (default `manifest.json`). Tests use this.    |

## Links

- [Lighthouse CI docs](https://github.com/GoogleChrome/lighthouse-ci/tree/main/docs)
- [Lighthouse accessibility audit reference](https://developer.chrome.com/docs/lighthouse/accessibility)
- Per-workstream specs: [`../../lighthouse-a11y/`](../../lighthouse-a11y/)
