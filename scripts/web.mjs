import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
const command = process.argv[2] ?? "dev";
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/next/dist/bin/next", import.meta.url),
    ),
    command,
    ...(command === "build" ? [] : ["--hostname", "0.0.0.0"]),
  ],
  {
    cwd: fileURLToPath(new URL("../apps/web/", import.meta.url)),
    stdio: "inherit",
    env: process.env,
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
