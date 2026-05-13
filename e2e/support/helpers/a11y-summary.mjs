import { readFileSync, globSync } from "fs";
import { basename } from "path";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const IMPACT_COLOR = { critical: RED, serious: RED, moderate: YELLOW, minor: DIM };

const rawFiles = globSync("test-results/**/axe-*.json");

if (rawFiles.length === 0) {
  console.log(`\n${DIM}No axe-*.json files found under test-results/${RESET}\n`);
  process.exit(0);
}

const deduped = new Map();
for (const file of rawFiles) {
  const base = basename(file, ".json");
  const label = base.replace(/^axe-/, "").replace(/-json-[0-9a-f]+$/, "");
  if (!deduped.has(label) || file.length < deduped.get(label).length) {
    deduped.set(label, file);
  }
}
const files = [...deduped.values()];

const scans = [];
let totalViolations = 0;
let totalSerious = 0;
let totalCritical = 0;

for (const [label, file] of deduped) {
  const raw = JSON.parse(readFileSync(file, "utf-8"));
  const violations = (raw.violations ?? []).sort(
    (a, b) =>
      (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9),
  );
  const serious = violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  totalViolations += violations.length;
  totalSerious += serious.filter((v) => v.impact === "serious").length;
  totalCritical += serious.filter((v) => v.impact === "critical").length;
  scans.push({ label, violations });
}

const divider = `${DIM}${"─".repeat(72)}${RESET}`;

console.log(`\n${BOLD} A11Y Report${RESET}  ${DIM}${scans.length} scan(s)${RESET}\n`);
console.log(divider);

for (const { label, violations } of scans) {
  const hasBlocking = violations.some(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const icon = violations.length === 0
    ? `${GREEN}✓${RESET}`
    : hasBlocking
      ? `${RED}✗${RESET}`
      : `${YELLOW}⚠${RESET}`;

  const summary = violations.length === 0
    ? `${GREEN}clean${RESET}`
    : violations
      .slice(0, 3)
      .map((v) => `${IMPACT_COLOR[v.impact] ?? DIM}${v.id}${RESET}`)
      .join(", ") + (violations.length > 3 ? ", …" : "");

  console.log(
    ` ${icon} ${BOLD}${label.padEnd(24)}${RESET} ${String(violations.length).padStart(2)} violation${violations.length === 1 ? " " : "s"}  ${summary}`,
  );

  for (const v of violations) {
    const nodeCount = v.nodes.length;
    const impact = v.impact ?? "minor";
    const color = IMPACT_COLOR[impact] ?? DIM;
    const rule = `${color}[${impact}]${RESET} ${v.id}`;
    const help = DIM + v.help + RESET;
    console.log(
      `     ${rule.padEnd(36)} ${help.padEnd(36)} ${nodeCount} element${nodeCount === 1 ? "" : "s"}`,
    );
  }
}

console.log(divider);

const blocking =
  totalCritical > 0
    ? `${RED}${BOLD}${totalCritical} critical${RESET}`
    : totalSerious > 0
      ? `${RED}${totalSerious} serious${RESET}`
      : null;

const status = blocking
  ? `${RED}${BOLD}BLOCKING${RESET} — ${blocking} violation(s) must be fixed before merging`
  : `${GREEN}PASS${RESET} — no serious or critical violations`;

console.log(
  ` ${status}\n${DIM} ${totalViolations} total  |  ${totalSerious} serious  |  ${totalCritical} critical  |  ${scans.length} scans${RESET}\n`,
);
