import { chmod, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { SMTPServer } from "smtp-server";
import { migrate } from "../../scripts/migrate";
export async function freePort() {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}
export async function environment() {
  if (process.getuid?.() === 0)
    throw new Error(
      "PostgreSQL requires a non-root system user. Run integration/E2E as an ordinary user or in GitHub Actions.",
    );
  const port = await freePort();
  const dir = await mkdtemp(join(tmpdir(), "learning-pg-"));
  await chmod(dir, 0o755);
  const postgres = new EmbeddedPostgres({
    databaseDir: join(dir, "db"),
    port,
    user: "postgres",
    password: "test-admin-only",
    persistent: false,
    createPostgresUser: false,
    onLog: () => {},
    onError: () => {},
  });
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase("learning");
  const adminUrl = `postgres://postgres:test-admin-only@127.0.0.1:${port}/learning`;
  const admin = new Pool({ connectionString: adminUrl });
  await admin.query(
    await readFile(
      new URL("../../infra/init-roles.sql", import.meta.url),
      "utf8",
    ),
  );
  await migrate(adminUrl);
  await migrate(adminUrl);
  process.env.DATABASE_MIGRATION_URL = adminUrl;
  process.env.DATABASE_URL = `postgres://learning_app:development-app@127.0.0.1:${port}/learning`;
  process.env.DATABASE_AUTH_URL = `postgres://learning_auth:development-auth@127.0.0.1:${port}/learning`;
  process.env.DATABASE_WORKER_URL = `postgres://learning_worker:development-worker@127.0.0.1:${port}/learning`;
  process.env.APP_URL = "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET =
    "test-secret-that-is-longer-than-thirty-two-characters";
  process.env.MAIL_ENCRYPTION_KEY = "b".repeat(64);
  Object.assign(process.env, { NODE_ENV: "test" });
  const messages: string[] = [];
  const smtpPort = await freePort();
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, _session, callback) {
      let data = "";
      stream.on("data", (chunk) => {
        data += chunk.toString();
      });
      stream.on("end", () => {
        messages.push(data);
        callback();
      });
    },
  });
  await new Promise<void>((resolve) =>
    smtp.listen(smtpPort, "127.0.0.1", resolve),
  );
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(smtpPort);
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_FROM = "Learning <no-reply@localhost.test>";
  const worker = new Pool({
    connectionString: process.env.DATABASE_WORKER_URL,
  });
  return {
    admin,
    worker,
    messages,
    async stop() {
      const { closePools } = await import(
        "../../packages/database/src/connections"
      );
      await closePools();
      await worker.end();
      await admin.end();
      await new Promise<void>((resolve) => smtp.close(() => resolve()));
      await postgres.stop();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
export function links(message: string) {
  const body = message
    .split(/\r?\n\r?\n/)
    .slice(1)
    .join("\n\n");
  const decoded = /Content-Transfer-Encoding: base64/i.test(message)
    ? Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8")
    : message;
  const unfolded = decoded.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
  return unfolded.match(/https?:\/\/[^\s<>]+/g) ?? [];
}
