import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { emailMessage, enqueueMail } from "../../adapters/src/mail";
import type { InviteInput } from "../../contracts/src/foundation";
import { authPool } from "../../database/src/connections";
import {
  actorTransaction,
  type Membership,
  setTenant,
  tenantTransaction,
  type Workspace,
} from "../../database/src/context";
import {
  type Actor,
  DomainError,
  type Locale,
  type Role,
  requireGrant,
  requireOwner,
} from "../../domain/src/workspaces/permissions";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
async function audit(
  c: PoolClient,
  actor: Actor,
  ws: string,
  action: string,
  id: string,
) {
  await c.query(
    "INSERT INTO audit_record(workspace_id,actor_id,action,object_id) VALUES($1,$2,$3,$4)",
    [ws, actor.id, action, id],
  );
}
async function command<T>(
  c: PoolClient,
  actor: Actor,
  ws: string,
  operation: string,
  key: string,
  input: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  const hash = digest(JSON.stringify(input));
  const old = await c.query(
    "SELECT request_hash,response FROM command_receipt WHERE workspace_id=$1 AND actor_id=$2 AND operation=$3 AND key=$4 AND expires_at>now()",
    [ws, actor.id, operation, key],
  );
  if (old.rowCount) {
    if (old.rows[0].request_hash !== hash)
      throw new DomainError("IDEMPOTENCY_CONFLICT", 409);
    return old.rows[0].response;
  }
  const result = await fn();
  await c.query(
    "INSERT INTO command_receipt(workspace_id,actor_id,operation,key,request_hash,response) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(workspace_id,actor_id,operation,key) DO UPDATE SET request_hash=excluded.request_hash,response=excluded.response,expires_at=excluded.expires_at",
    [ws, actor.id, operation, key, hash, JSON.stringify(result)],
  );
  return result;
}
export async function listWorkspaces(actor: Actor) {
  return actorTransaction(actor, async (c) => {
    await c.query("SELECT ensure_personal_workspace()");
    return (await c.query("SELECT * FROM list_my_workspaces()")).rows;
  });
}
export async function createOrganization(
  actor: Actor,
  input: { name: string; timezone: string; defaultLocale: Locale },
  key: string,
) {
  return actorTransaction(actor, async (c) => {
    const r = await c.query(
      "SELECT create_organization($1,$2,$3,$4,$5) AS id",
      [
        input.name,
        input.timezone,
        input.defaultLocale,
        key,
        digest(JSON.stringify(input)),
      ],
    );
    return { id: r.rows[0].id };
  });
}
export async function readWorkspace(actor: Actor, ws: string) {
  return tenantTransaction(actor, ws, false, async (_c, m, w) => ({
    ...w,
    role: m.role,
  }));
}
export async function updateSettings(
  actor: Actor,
  ws: string,
  input: {
    name: string;
    timezone: string;
    defaultLocale: Locale;
    expectedRevision: number;
  },
) {
  return tenantTransaction(actor, ws, true, async (c, m, w) => {
    requireOwner(m.role);
    if (w.revision !== input.expectedRevision)
      throw new DomainError("REVISION_CONFLICT", 409);
    const r = await c.query(
      "UPDATE workspace SET name=$2,timezone=$3,default_locale=$4,revision=revision+1 WHERE id=$1 RETURNING id,name,timezone,default_locale,revision",
      [ws, input.name, input.timezone, input.defaultLocale],
    );
    await audit(c, actor, ws, "workspace.settings", ws);
    return r.rows[0];
  });
}
export async function listMembers(
  actor: Actor,
  ws: string,
  cursor: string | undefined,
  limit = 25,
) {
  return tenantTransaction(actor, ws, false, async (c, m) => {
    if (m.role !== "owner" && m.role !== "manager")
      throw new DomainError("FORBIDDEN", 403);
    const r = await c.query(
      "SELECT id,display_name,email,role,status,revision FROM membership WHERE workspace_id=$1 AND ($2::uuid IS NULL OR id>$2) AND ($3='owner' OR id=$4 OR id IN(SELECT learner_membership_id FROM manager_learner WHERE manager_membership_id=$4)) ORDER BY id LIMIT $5",
      [ws, cursor ?? null, m.role, m.id, limit + 1],
    );
    return {
      items: r.rows.slice(0, limit),
      nextCursor: r.rows.length > limit ? r.rows[limit - 1].id : null,
    };
  });
}
async function activeMember(c: PoolClient, id: string) {
  const r = await c.query<Membership>(
    "SELECT id,role,workspace_id,user_id,status,revision FROM membership WHERE id=$1 AND status='active'",
    [id],
  );
  if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
  return r.rows[0];
}
export async function updateMember(
  actor: Actor,
  ws: string,
  id: string,
  input: { role: Role; status: string; expectedRevision: number },
) {
  return tenantTransaction(actor, ws, true, async (c, m, w) => {
    requireOwner(m.role);
    if (w.type !== "organization") throw new DomainError("FORBIDDEN", 403);
    const r = await c.query<Membership>(
      "SELECT id,role,workspace_id,user_id,status,revision FROM membership WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
    const target = r.rows[0];
    if (target.revision !== input.expectedRevision)
      throw new DomainError("REVISION_CONFLICT", 409);
    if (
      target.role === "owner" &&
      target.status === "active" &&
      (input.role !== "owner" || input.status !== "active")
    ) {
      const count = await c.query(
        "SELECT count(*)::int AS count FROM membership WHERE role='owner' AND status='active'",
      );
      if (count.rows[0].count <= 1) throw new DomainError("LAST_OWNER", 409);
    }
    if (input.status === "removed" || input.role !== target.role)
      await c.query(
        "DELETE FROM manager_learner WHERE manager_membership_id=$1 OR learner_membership_id=$1",
        [id],
      );
    const updated = await c.query(
      "UPDATE membership SET role=$2,status=$3,revision=revision+1 WHERE id=$1 RETURNING id,display_name,email,role,status,revision",
      [id, input.role, input.status],
    );
    await audit(c, actor, ws, "membership.updated", id);
    return updated.rows[0];
  });
}
async function relationPair(
  c: PoolClient,
  managerId: string,
  learnerId: string,
) {
  const manager = await activeMember(c, managerId);
  const learner = await activeMember(c, learnerId);
  if (manager.role !== "manager" || learner.role !== "learner")
    throw new DomainError("INVALID_RELATIONSHIP", 422);
}
export async function addRelationship(
  actor: Actor,
  ws: string,
  input: { managerMembershipId: string; learnerMembershipId: string },
  key: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m, w) => {
    requireOwner(m.role);
    if (w.type !== "organization") throw new DomainError("FORBIDDEN", 403);
    return command(
      c,
      actor,
      ws,
      "relationship.create",
      key,
      input,
      async () => {
        await relationPair(
          c,
          input.managerMembershipId,
          input.learnerMembershipId,
        );
        const r = await c.query(
          "INSERT INTO manager_learner(workspace_id,manager_membership_id,learner_membership_id) VALUES($1,$2,$3) ON CONFLICT(workspace_id,manager_membership_id,learner_membership_id) DO NOTHING RETURNING id,manager_membership_id,learner_membership_id",
          [ws, input.managerMembershipId, input.learnerMembershipId],
        );
        const pair =
          r.rows[0] ??
          (
            await c.query(
              "SELECT id,manager_membership_id,learner_membership_id FROM manager_learner WHERE manager_membership_id=$1 AND learner_membership_id=$2",
              [input.managerMembershipId, input.learnerMembershipId],
            )
          ).rows[0];
        await audit(c, actor, ws, "relationship.created", pair.id);
        return pair;
      },
    );
  });
}
export async function listRelationships(actor: Actor, ws: string) {
  return tenantTransaction(actor, ws, false, async (c, m) => {
    if (m.role !== "owner" && m.role !== "manager")
      throw new DomainError("FORBIDDEN", 403);
    return (
      await c.query(
        "SELECT id,manager_membership_id,learner_membership_id FROM manager_learner WHERE ($1='owner' OR manager_membership_id=$2) ORDER BY id LIMIT 100",
        [m.role, m.id],
      )
    ).rows;
  });
}
export async function removeRelationship(actor: Actor, ws: string, id: string) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    requireOwner(m.role);
    const r = await c.query(
      "DELETE FROM manager_learner WHERE id=$1 RETURNING id",
      [id],
    );
    if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
    await audit(c, actor, ws, "relationship.removed", id);
    return { id };
  });
}
export async function createInvitation(
  actor: Actor,
  ws: string,
  input: InviteInput,
  key: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m, w) => {
    requireGrant(m.role, input.role, w.type);
    return command(c, actor, ws, "invitation.create", key, input, async () => {
      let managerId = input.managerMembershipId ?? null;
      if (m.role === "manager") {
        if (managerId && managerId !== m.id)
          throw new DomainError("FORBIDDEN", 403);
        managerId = input.role === "learner" ? m.id : null;
      }
      if (managerId) {
        if (input.role !== "learner")
          throw new DomainError("INVALID_RELATIONSHIP", 422);
        const manager = await activeMember(c, managerId);
        if (manager.role !== "manager")
          throw new DomainError("INVALID_RELATIONSHIP", 422);
      }
      const exists = await c.query(
        "SELECT id FROM membership WHERE email=$1 AND status='active'",
        [input.email],
      );
      if (exists.rowCount) throw new DomainError("ALREADY_MEMBER", 409);
      await c.query(
        "UPDATE invitation SET status='revoked',revision=revision+1 WHERE email=$1 AND status='pending' AND expires_at<=now()",
        [input.email],
      );
      const token = randomBytes(32).toString("base64url");
      const r = await c.query(
        "INSERT INTO invitation(workspace_id,token_hash,email,role,inviter_membership_id,manager_membership_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email,role,status,revision,expires_at",
        [ws, digest(token), input.email, input.role, m.id, managerId],
      );
      const recipient = await authPool().query(
        'SELECT preferred_locale FROM identity."user" WHERE email=$1',
        [input.email],
      );
      const locale = (recipient.rows[0]?.preferred_locale ??
        w.default_locale) as Locale;
      const url = new URL(`/${locale}/invite`, process.env.APP_URL);
      url.searchParams.set("token", token);
      await enqueueMail(
        c,
        { to: input.email, ...emailMessage("invite", locale, url.toString()) },
        ws,
        r.rows[0].id,
        86400,
      );
      await audit(c, actor, ws, "invitation.created", r.rows[0].id);
      return r.rows[0];
    });
  });
}
export async function listInvitations(
  actor: Actor,
  ws: string,
  cursor: string | undefined,
  limit = 25,
) {
  return tenantTransaction(actor, ws, false, async (c, m) => {
    if (m.role !== "owner" && m.role !== "manager")
      throw new DomainError("FORBIDDEN", 403);
    const r = await c.query(
      "SELECT id,email,role,status,revision,expires_at FROM invitation WHERE ($1='owner' OR inviter_membership_id=$2) AND ($3::uuid IS NULL OR id>$3) ORDER BY id LIMIT $4",
      [m.role, m.id, cursor ?? null, limit + 1],
    );
    return {
      items: r.rows.slice(0, limit),
      nextCursor: r.rows.length > limit ? r.rows[limit - 1].id : null,
    };
  });
}
export async function revokeInvitation(
  actor: Actor,
  ws: string,
  id: string,
  revision: number,
) {
  return tenantTransaction(actor, ws, true, async (c, m, w) => {
    const r = await c.query("SELECT * FROM invitation WHERE id=$1 FOR UPDATE", [
      id,
    ]);
    if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
    const i = r.rows[0];
    requireGrant(m.role, i.role, w.type);
    if (m.role !== "owner" && i.inviter_membership_id !== m.id)
      throw new DomainError("FORBIDDEN", 403);
    if (i.revision !== revision)
      throw new DomainError("REVISION_CONFLICT", 409);
    if (i.status !== "pending")
      throw new DomainError("INVITATION_INVALID", 409);
    await c.query(
      "UPDATE invitation SET status='revoked',revision=revision+1 WHERE id=$1",
      [id],
    );
    await audit(c, actor, ws, "invitation.revoked", id);
    return { id };
  });
}
export async function acceptInvitation(actor: Actor, token: string) {
  return actorTransaction(actor, async (c) => {
    const hash = digest(token);
    const locate = await c.query("SELECT locate_invitation($1) AS id", [hash]);
    const ws = locate.rows[0].id;
    if (!ws) throw new DomainError("NOT_FOUND", 404);
    await setTenant(c, ws);
    const w = (
      await c.query<Workspace>(
        "SELECT id,type,name,timezone,default_locale,revision FROM workspace WHERE id=$1 FOR UPDATE",
        [ws],
      )
    ).rows[0];
    const i = (
      await c.query("SELECT * FROM invitation WHERE token_hash=$1 FOR UPDATE", [
        hash,
      ])
    ).rows[0];
    if (i.status === "accepted" && i.accepted_by === actor.id) {
      const m = await c.query(
        "SELECT id FROM membership WHERE user_id=$1 AND status='active'",
        [actor.id],
      );
      if (!m.rowCount) throw new DomainError("NOT_FOUND", 404);
      return { workspaceId: ws, membershipId: m.rows[0].id };
    }
    if (
      i.status !== "pending" ||
      new Date(i.expires_at) <= new Date() ||
      i.email !== actor.email
    )
      throw new DomainError("INVITATION_INVALID", 409);
    const inviter = await activeMember(c, i.inviter_membership_id);
    requireGrant(inviter.role, i.role, w.type);
    if (
      inviter.role === "manager" &&
      i.manager_membership_id &&
      i.manager_membership_id !== inviter.id
    )
      throw new DomainError("FORBIDDEN", 403);
    if (i.manager_membership_id) {
      const manager = await activeMember(c, i.manager_membership_id);
      if (manager.role !== "manager")
        throw new DomainError("INVALID_RELATIONSHIP", 422);
    }
    const existing = await c.query(
      "SELECT id FROM membership WHERE user_id=$1 AND status='active'",
      [actor.id],
    );
    if (existing.rowCount) throw new DomainError("ALREADY_MEMBER", 409);
    const member = await c.query(
      "INSERT INTO membership(workspace_id,user_id,role,display_name,email) VALUES($1,$2,$3,$4,$5) ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=excluded.role,status='active',revision=membership.revision+1 RETURNING id",
      [ws, actor.id, i.role, actor.name, actor.email],
    );
    if (i.manager_membership_id)
      await c.query(
        "INSERT INTO manager_learner(workspace_id,manager_membership_id,learner_membership_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [ws, i.manager_membership_id, member.rows[0].id],
      );
    await c.query(
      "UPDATE invitation SET status='accepted',accepted_by=$2,revision=revision+1 WHERE id=$1",
      [i.id, actor.id],
    );
    await audit(c, actor, ws, "invitation.accepted", i.id);
    return { workspaceId: ws, membershipId: member.rows[0].id };
  });
}
export async function updatePreference(actor: Actor, locale: Locale) {
  await authPool().query(
    'UPDATE identity."user" SET preferred_locale=$2,updated_at=now() WHERE id=$1',
    [actor.id, locale],
  );
  return { preferredLocale: locale };
}
