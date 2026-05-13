---
"landscape-ui": patch
---

Wire up `@lhci/cli` to enforce a Lighthouse accessibility floor on every pull request. `pnpm a11y:ci` builds the app in a new `audit` mode (`vite build --mode audit`, configured in `.env.audit`) that bundles MSW for deterministic API responses and switches the auth/feature guards out of the way so Lighthouse can render the real dashboard pages instead of bouncing to `/login`. The list of routes to audit is discovered from `@/libs/routes` by `scripts/list-routes.ts` — adding a new page picks it up automatically. The check fails when any audited route's accessibility score drops below `LIGHTHOUSE_MIN_SCORE` (default `1.0`).
