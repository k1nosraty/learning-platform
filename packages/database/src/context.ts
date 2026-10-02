import type { PoolClient } from "pg";
import {
  type Actor,
  DomainError,
  type Locale,
  type Role,
} from "../../domain/src/workspaces/permissions";
import { appPool } from "./connections";
export async function actorTransaction<T>(
  actor: Actor,
  fn: (c: PoolClient) => Promise<T>,
) {
  if (!actor.emailVerified) throw new DomainError("EMAIL_NOT_VERIFIED", 403);
  const c = await appPool().connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('app.user_id',$1,true)", [actor.id]);
    const value = await fn(c);
    await c.query("COMMIT");
    return value;
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
}
export async function setTenant(c: PoolClient, workspaceId: string) {
  await c.query("SELECT set_config('app.workspace_id',$1,true)", [workspaceId]);
}
export interface Membership {
  id: string;
  role: Role;
  workspace_id: string;
  user_id: string;
  status: string;
  revision: number;
}
export interface Workspace {
  id: string;
  type: "personal" | "organization";
  name: string;
  timezone: string;
  default_locale: Locale;
  revision: number;
}
export async function tenantTransaction<T>(
  actor: Actor,
  id: string,
  write: boolean,
  fn: (c: PoolClient, m: Membership, w: Workspace) => Promise<T>,
) {
  return actorTransaction(actor, async (c) => {
    await setTenant(c, id);
    const w = await c.query<Workspace>(
      `SELECT id,type,name,timezone,default_locale,revision FROM workspace WHERE id=$1 ${write ? "FOR UPDATE" : ""}`,
      [id],
    );
    const m = await c.query<Membership>(
      "SELECT id,role,workspace_id,user_id,status,revision FROM membership WHERE workspace_id=$1 AND user_id=$2 AND status='active'",
      [id, actor.id],
    );
    if (!w.rowCount || !m.rowCount) throw new DomainError("NOT_FOUND", 404);
    return fn(c, m.rows[0], w.rows[0]);
  });
}
