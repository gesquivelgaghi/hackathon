import { promises as fs } from "fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

const BLOCKING_IMPACTS = new Set(["serious", "critical"]);
const DEFAULT_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface ScanOptions {
  readonly include?: string;
  readonly exclude?: readonly string[];
  readonly tags?: readonly string[];
  readonly disableRules?: readonly string[];
}

interface Violation {
  readonly id: string;
  readonly impact?: string | null;
  readonly help: string;
  readonly nodes: readonly unknown[];
}

function formatViolations(label: string, violations: Violation[]): string {
  const lines = violations.map((violation) => {
    const count = violation.nodes.length;
    const noun = count === 1 ? "node" : "nodes";
    return `  - [${violation.impact}] ${violation.id} (${count} ${noun}): ${violation.help}`;
  });
  return `Serious/critical a11y violations at "${label}":\n${lines.join("\n")}`;
}

export async function scanA11y(
  page: Page,
  testInfo: TestInfo,
  label: string,
  options: ScanOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([
    ...(options.tags ?? DEFAULT_TAGS),
  ]);
  if (options.include) builder = builder.include(options.include);
  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }
  if (options.disableRules?.length) {
    builder = builder.disableRules([...options.disableRules]);
  }

  const results = await builder.analyze();

  // Write to disk so the CI artifact step (which globs
  // `test-results/**/axe-*.json`) can pick up the JSON. Attaching by `path`
  // also keeps the file embedded in the Playwright HTML report.
  const outputPath = testInfo.outputPath(`axe-${label}.json`);
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  await testInfo.attach(`axe-${label}.json`, {
    path: outputPath,
    contentType: "application/json",
  });

  const blocking = results.violations.filter((violation) =>
    BLOCKING_IMPACTS.has(violation.impact ?? ""),
  );
  expect(blocking, formatViolations(label, blocking)).toEqual([]);
}
