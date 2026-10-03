import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const log = await readFile(process.argv[2], "utf8");
const dependencySteps = [
  ...log.matchAll(
    /(#\d+) \[[^\]]*dependencies[^\]]*\] RUN .*pnpm install[^\n]*/g,
  ),
];
assert.ok(
  dependencySteps.length >= 2,
  "Build and worker dependency layers were inspected",
);
for (const [, step] of dependencySteps)
  assert.match(
    log,
    new RegExp(`${step} CACHED`),
    "Source-only update must reuse installed dependencies",
  );
console.log(
  "Source update reused both dependency layers; no package reinstall/download.",
);
