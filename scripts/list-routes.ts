// Enumerate every in-app route the SPA can render. Imported and called by
// `scripts/lighthouserc.cjs` so the Lighthouse audit covers whatever the
// application currently routes — no manual list to keep in sync.
//
// `ROUTES` is a nested object of factory functions (one per page). Calling a
// factory with no arguments returns the path. Param-bearing factories throw
// when called without params; we skip those (Lighthouse can't audit a URL
// containing `:id` anyway).
//
// Run via tsx: `pnpm exec tsx scripts/list-routes.ts <output.json>`

import { writeFileSync } from "node:fs";
import { PATHS, ROUTES } from "@/libs/routes";

function walk(value: unknown, out: string[]): void {
  if (typeof value === "function") {
    try {
      const result = (value as () => unknown)();
      if (typeof result === "string") out.push(result);
    } catch {
      // factory requires params — not auditable as a static URL
    }
    return;
  }
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) walk(v, out);
  }
}

const collected: string[] = [];
// PATHS catches routes that are mounted as <Route path={PATHS.auth.foo}> in
// JSX but never wrapped as a factory in ROUTES (e.g. supportLogin, handleOidc).
walk(PATHS, collected);
// ROUTES catches nested paths assembled at runtime (e.g. /account/general,
// built from `/${ACCOUNT_PATHS.root}/${ACCOUNT_PATHS.general}`).
walk(ROUTES, collected);

const paths = [
  ...new Set(
    collected
      // In-app routes only — drop external URLs and bare fragments like
      // "instances" that are used as nested-route segments.
      .filter((p) => p.startsWith("/"))
      // Strip any query string a factory may have inserted.
      .map((p) => p.split("?")[0])
      // Skip param routes, wildcard catch-alls, and the noise that comes from
      // calling an optional-param factory with no arg (-> "/foo/undefined").
      .filter(
        (p) =>
          !p.includes(":") &&
          !p.includes("*") &&
          !/\/(undefined|null)(\/|$)/.test(p),
      ),
  ),
].sort();

const outPath = process.argv[2];
const json = JSON.stringify(paths, null, 2);
if (outPath) {
  writeFileSync(outPath, json);
} else {
  process.stdout.write(json + "\n");
}
