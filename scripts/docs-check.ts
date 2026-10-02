import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { catalogs, errors } from "../packages/contracts/src/locales";

for (const catalog of [catalogs, errors])
  assert.deepEqual(
    Object.keys(catalog.en).sort(),
    Object.keys(catalog.fa).sort(),
  );
for (const [key, value] of Object.entries(catalogs.en)) {
  const placeholders = (x: string) =>
    [...x.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((x) => x[1]).sort();
  assert.deepEqual(
    placeholders(value),
    placeholders(catalogs.fa[key as keyof typeof catalogs.en]),
  );
}
const schema = JSON.parse(
  await readFile("schemas/learning-path-draft.schema.json", "utf8"),
);
assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.ok((await readdir("docs")).length >= 24);
console.log(
  "Documentation schema and fa/en catalog key/placeholder parity passed.",
);
