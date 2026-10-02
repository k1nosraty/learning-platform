import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { workerPool } from "../../../packages/database/src/connections";
import { deliverOnce } from "./delivery";

const pool = workerPool();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
try {
  while (!stopping) {
    try {
      const delivered = await deliverOnce(pool);
      if (!delivered) await setTimeout(1000);
    } catch {
      console.error('{"event":"worker_dependency_error"}');
      await setTimeout(5000);
    }
  }
} finally {
  await pool.end();
}
