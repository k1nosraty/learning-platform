import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { deliverOnce } from "../apps/worker/src/delivery";
import { environment, links } from "../tests/helpers/environment";

const env = await environment();
process.env.APP_URL = "http://127.0.0.1:3100";
Object.assign(process.env, {
  NODE_ENV: "development",
  NEXT_TELEMETRY_DISABLED: "1",
});
// Test harness inbox is isolated from the application and binds only to loopback.
const inbox = createServer((_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify(env.messages.map((raw) => ({ raw, links: links(raw) }))),
  );
});
inbox.listen(3101, "127.0.0.1");
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/next/dist/bin/next", import.meta.url),
    ),
    "dev",
    "apps/web",
    "--port",
    "3100",
    "--hostname",
    "127.0.0.1",
  ],
  { stdio: "inherit", env: process.env },
);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    stopping = true;
    child.kill(signal);
  });
child.on("exit", () => {
  stopping = true;
});
try {
  while (!stopping) {
    await deliverOnce(env.worker);
    await setTimeout(200);
  }
} finally {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => inbox.close(() => resolve()));
  await env.stop();
}
