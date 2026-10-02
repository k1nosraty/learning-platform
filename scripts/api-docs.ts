import { mkdir, writeFile } from "node:fs/promises";
import { foundationOpenApi } from "../packages/contracts/src/openapi";

await mkdir("docs/api", { recursive: true });
await writeFile(
  "docs/api/foundation.openapi.json",
  `${JSON.stringify(foundationOpenApi(), null, 2)}\n`,
);
