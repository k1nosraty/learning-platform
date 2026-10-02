import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
export async function migrate(url: string) {
  const pool = new Pool({ connectionString: url });
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(829451007)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migration(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const dir = fileURLToPath(
      new URL("../packages/database/migrations/", import.meta.url),
    );
    for (const name of (await readdir(dir))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(`${dir}/${name}`, "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      const old = await c.query(
        "SELECT checksum FROM schema_migration WHERE name=$1",
        [name],
      );
      if (old.rowCount) {
        if (old.rows[0].checksum !== hash)
          throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await c.query(sql);
      await c.query(
        "INSERT INTO schema_migration(name,checksum) VALUES($1,$2)",
        [name, hash],
      );
      console.log(`Applied ${name}`);
    }
    await c.query("COMMIT");
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
    await pool.end();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.DATABASE_MIGRATION_URL)
    throw new Error("Missing DATABASE_MIGRATION_URL");
  await migrate(process.env.DATABASE_MIGRATION_URL);
}
