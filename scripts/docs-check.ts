import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import {
  contentCatalogs,
  contentIssues,
} from "../packages/contracts/src/content-locales";
import { catalogs, errors } from "../packages/contracts/src/locales";
import { foundationOpenApi } from "../packages/contracts/src/openapi";

for (const catalog of [catalogs, errors, contentCatalogs, contentIssues])
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
for (const [key, value] of Object.entries(contentCatalogs.en)) {
  const placeholders = (s: string) =>
    [...s.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]).sort();
  assert.deepEqual(
    placeholders(value),
    placeholders(contentCatalogs.fa[key as keyof typeof contentCatalogs.en]),
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

assert.deepEqual(
  JSON.parse(await readFile("docs/api/foundation.openapi.json", "utf8")),
  foundationOpenApi(),
);
