import "dotenv/config";
import { Pool } from "pg";

function connection(name: string) {
  const url = process.env[name];
  if (!url) throw new Error(`Missing ${name}`);
  return new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}
let app: Pool | undefined;
let identity: Pool | undefined;
export function appPool() {
  app ??= connection("DATABASE_URL");
  return app;
}
export function authPool() {
  identity ??= connection("DATABASE_AUTH_URL");
  return identity;
}
export const workerPool = () => connection("DATABASE_WORKER_URL");
export async function closePools() {
  await Promise.all([app?.end(), identity?.end()]);
  app = undefined;
  identity = undefined;
}
