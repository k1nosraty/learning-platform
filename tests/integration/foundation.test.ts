import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { handleApi } from "../../apps/web/lib/server/api";
import { deliverOnce } from "../../apps/worker/src/delivery";
import { decryptMail } from "../../packages/adapters/src/mail";
import { getAuth } from "../../packages/application/src/auth";
import * as s from "../../packages/application/src/workspaces";
import { appPool, authPool } from "../../packages/database/src/connections";
import {
  actorTransaction,
  setTenant,
} from "../../packages/database/src/context";
import type { Actor } from "../../packages/domain/src/workspaces/permissions";
import { DomainError } from "../../packages/domain/src/workspaces/permissions";
import { environment, links } from "../helpers/environment";

let env: Awaited<ReturnType<typeof environment>>;
const actors: Actor[] = [];
let org: string,
  other: string,
  personal: string,
  ownerMember: string,
  managerMember: string,
  learnerMember: string;
async function actor(email: string, verified = true): Promise<Actor> {
  const a = {
    id: randomUUID(),
    name: email.split("@")[0],
    email,
    emailVerified: verified,
    preferredLocale: "en",
  };
  await env.admin.query(
    'INSERT INTO identity."user"(id,name,email,email_verified) VALUES($1,$2,$3,$4)',
    [a.id, a.name, a.email, verified],
  );
  return a;
}
async function inviteToken(workspace: string, email: string) {
  const r = await env.admin.query(
    "SELECT d.ciphertext FROM mail_delivery d JOIN invitation i ON i.id=d.invitation_id WHERE i.workspace_id=$1 AND i.email=$2 AND i.status='pending' ORDER BY d.created_at DESC LIMIT 1",
    [workspace, email],
  );
  const mail = decryptMail(r.rows[0].ciphertext);
  const url = mail.text.match(/http[^\s]+/)?.[0];
  return new URL(url ?? "").searchParams.get("token") ?? "";
}
async function grant(
  a: Actor,
  role: "manager" | "mentor" | "learner" | "owner",
  issuer = actors[0],
) {
  await s.createInvitation(issuer, org, { email: a.email, role }, randomUUID());
  return s.acceptInvitation(a, await inviteToken(org, a.email));
}
const denial = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;
before(async () => {
  env = await environment();
  for (const email of [
    "owner@local.test",
    "manager@local.test",
    "learner@local.test",
    "outsider@local.test",
    "mentor@local.test",
  ])
    actors.push(await actor(email));
  personal = (await s.listWorkspaces(actors[0]))[0].id;
  org = (
    await s.createOrganization(
      actors[0],
      { name: "Team A", timezone: "Asia/Tehran", defaultLocale: "fa" },
      randomUUID(),
    )
  ).id;
  other = (
    await s.createOrganization(
      actors[3],
      { name: "Team B", timezone: "UTC", defaultLocale: "en" },
      randomUUID(),
    )
  ).id;
  ownerMember = (await s.listMembers(actors[0], org, undefined)).items[0].id;
  managerMember = (await grant(actors[1], "manager")).membershipId;
  learnerMember = (await grant(actors[2], "learner", actors[1])).membershipId;
  await grant(actors[4], "mentor");
});
after(async () => {
  await env?.stop();
});
test("PostgreSQL 18, non-owner runtime privileges, repeat migrations and verified personal onboarding", async () => {
  assert.match(
    (await env.admin.query("SHOW server_version")).rows[0].server_version,
    /^18\./,
  );
  const r = await appPool().query(
    "SELECT rolname,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
  );
  assert.equal(r.rows[0].rolname, "learning_app");
  assert.equal(r.rows[0].rolsuper, false);
  assert.equal(r.rows[0].rolbypassrls, false);
  assert.equal(
    (await s.listWorkspaces(actors[0])).filter((w) => w.type === "personal")
      .length,
    1,
  );
  const unverified = await actor("unverified@local.test", false);
  await assert.rejects(
    () => s.listWorkspaces(unverified),
    denial("EMAIL_NOT_VERIFIED"),
  );
  await assert.rejects(
    () => appPool().query('SELECT * FROM identity."user"'),
    (e) => (e as { code: string }).code === "42501",
  );
  await assert.rejects(
    () => authPool().query("SELECT * FROM workspace"),
    (e) => (e as { code: string }).code === "42501",
  );
});
test("A07 RLS blocks tenant substitution, no scope, cross-tenant references and pool leakage", async () => {
  assert.equal((await appPool().query("SELECT * FROM membership")).rowCount, 0);
  await actorTransaction(actors[0], async (c) => {
    await setTenant(c, org);
    assert.equal(
      (await c.query("SELECT * FROM membership WHERE workspace_id=$1", [other]))
        .rowCount,
      0,
    );
    await assert.rejects(() =>
      c.query(
        "INSERT INTO manager_learner(workspace_id,manager_membership_id,learner_membership_id) VALUES($1,$2,$3)",
        [other, managerMember, learnerMember],
      ),
    );
  });
  // The failed transaction is rolled back by PostgreSQL even when the assertion catches the SQL error.
  assert.equal((await appPool().query("SELECT * FROM membership")).rowCount, 0);
  await assert.rejects(
    () => s.readWorkspace(actors[0], other),
    denial("NOT_FOUND"),
  );
  await assert.rejects(
    () =>
      s.updateMember(actors[3], other, learnerMember, {
        role: "owner",
        status: "active",
        expectedRevision: 1,
      }),
    denial("NOT_FOUND"),
  );
  const foreignMember = (await s.listMembers(actors[3], other, undefined))
    .items[0].id;
  await assert.rejects(
    () =>
      actorTransaction(actors[0], async (c) => {
        await setTenant(c, org);
        await c.query(
          "INSERT INTO manager_learner(workspace_id,manager_membership_id,learner_membership_id) VALUES($1,$2,$3)",
          [org, foreignMember, learnerMember],
        );
      }),
    (error) => (error as { code: string }).code === "23503",
  );
  await assert.rejects(
    () =>
      s.addRelationship(
        actors[0],
        org,
        {
          managerMembershipId: foreignMember,
          learnerMembershipId: learnerMember,
        },
        randomUUID(),
      ),
    denial("NOT_FOUND"),
  );
});
test("A08 centralized grants, explicit relationships, last owner and personal boundaries", async () => {
  await assert.rejects(
    () =>
      s.createInvitation(
        actors[1],
        org,
        { email: "escalation@local.test", role: "owner" },
        randomUUID(),
      ),
    denial("FORBIDDEN"),
  );
  await assert.rejects(
    () =>
      s.updateMember(actors[1], org, managerMember, {
        role: "owner",
        status: "active",
        expectedRevision: 1,
      }),
    denial("FORBIDDEN"),
  );
  await assert.rejects(
    () =>
      s.updateMember(actors[0], org, ownerMember, {
        role: "learner",
        status: "active",
        expectedRevision: 1,
      }),
    denial("LAST_OWNER"),
  );
  await assert.rejects(
    () =>
      s.createInvitation(
        actors[0],
        personal,
        { email: "personal@local.test", role: "learner" },
        randomUUID(),
      ),
    denial("FORBIDDEN"),
  );
  const managed = await s.listRelationships(actors[1], org);
  assert.equal(managed.items[0].learner_membership_id, learnerMember);
  const visible = await s.listMembers(actors[1], org, undefined);
  assert.equal(visible.items.length, 2);
  assert.ok(!visible.items.some((x) => x.id === ownerMember));
  await assert.rejects(
    () => s.listMembers(actors[4], org, undefined),
    denial("FORBIDDEN"),
  );
});
test("invitation identity, single consumption, expiry, revocation and changed inviter authority", async () => {
  const recipient = await actor("recipient@local.test");
  await s.createInvitation(
    actors[0],
    org,
    { email: recipient.email, role: "learner" },
    randomUUID(),
  );
  const token = await inviteToken(org, recipient.email);
  await assert.rejects(
    () => s.acceptInvitation(actors[3], token),
    denial("NOT_FOUND"),
  );
  const [one, two] = await Promise.all([
    s.acceptInvitation(recipient, token),
    s.acceptInvitation(recipient, token),
  ]);
  assert.deepEqual(one, two);
  const revoked = await actor("revoked@local.test");
  const i = await s.createInvitation(
    actors[0],
    org,
    { email: revoked.email, role: "learner" },
    randomUUID(),
  );
  const revokedToken = await inviteToken(org, revoked.email);
  const revokeKey = randomUUID();
  await s.revokeInvitation(actors[0], org, i.id, i.revision, revokeKey);
  assert.deepEqual(
    await s.revokeInvitation(actors[0], org, i.id, i.revision, revokeKey),
    { id: i.id },
  );
  await assert.rejects(
    () => s.acceptInvitation(revoked, revokedToken),
    denial("INVITATION_INVALID"),
  );
  const expired = await actor("expired@local.test");
  await s.createInvitation(
    actors[0],
    org,
    { email: expired.email, role: "learner" },
    randomUUID(),
  );
  const expiredToken = await inviteToken(org, expired.email);
  await env.admin.query(
    "UPDATE invitation SET expires_at=now()-interval '1 second' WHERE email=$1",
    [expired.email],
  );
  await assert.rejects(
    () => s.acceptInvitation(expired, expiredToken),
    denial("INVITATION_INVALID"),
  );
  const stale = await actor("stale@local.test");
  await s.createInvitation(
    actors[1],
    org,
    { email: stale.email, role: "learner" },
    randomUUID(),
  );
  const staleToken = await inviteToken(org, stale.email);
  await s.updateMember(actors[0], org, managerMember, {
    role: "learner",
    status: "active",
    expectedRevision: 1,
  });
  await assert.rejects(
    () => s.acceptInvitation(stale, staleToken),
    denial("FORBIDDEN"),
  );
  await s.updateMember(actors[0], org, managerMember, {
    role: "manager",
    status: "active",
    expectedRevision: 2,
  });
});
test("commands replay, reject changed payload, CAS rejects stale changes, removal is immediate", async () => {
  const key = randomUUID();
  const input = {
    name: "Idempotent",
    timezone: "UTC",
    defaultLocale: "en" as const,
  };
  const first = await s.createOrganization(actors[0], input, key);
  assert.deepEqual(await s.createOrganization(actors[0], input, key), first);
  await assert.rejects(
    () => s.createOrganization(actors[0], { ...input, name: "Changed" }, key),
    (e) => (e as { code: string }).code === "P0002",
  );
  const inviteKey = randomUUID();
  const payload = { email: "idempotent@local.test", role: "learner" as const };
  const i = await s.createInvitation(actors[0], org, payload, inviteKey);
  assert.deepEqual(
    (await s.createInvitation(actors[0], org, payload, inviteKey)).id,
    i.id,
  );
  await assert.rejects(
    () =>
      s.createInvitation(
        actors[0],
        org,
        { ...payload, role: "mentor" },
        inviteKey,
      ),
    denial("IDEMPOTENCY_CONFLICT"),
  );
  const settings = {
    name: "Updated",
    timezone: "UTC",
    defaultLocale: "en" as const,
    expectedRevision: 1,
  };
  await s.updateSettings(actors[0], org, settings);
  await assert.rejects(
    () => s.updateSettings(actors[0], org, settings),
    denial("REVISION_CONFLICT"),
  );
  await s.updateMember(actors[0], org, learnerMember, {
    role: "learner",
    status: "removed",
    expectedRevision: 1,
  });
  await assert.rejects(
    () => s.readWorkspace(actors[2], org),
    denial("NOT_FOUND"),
  );
  assert.ok(!(await s.listWorkspaces(actors[2])).some((w) => w.id === org));
});
test("concurrent owner demotion serializes and preserves an active owner", async () => {
  const ws = (
    await s.createOrganization(
      actors[0],
      { name: "Owner race", timezone: "UTC", defaultLocale: "en" },
      randomUUID(),
    )
  ).id;
  const second = await actor("second-owner@local.test");
  await s.createInvitation(
    actors[0],
    ws,
    { email: second.email, role: "owner" },
    randomUUID(),
  );
  const accepted = await s.acceptInvitation(
    second,
    await inviteToken(ws, second.email),
  );
  const original = (await s.listMembers(actors[0], ws, undefined)).items.find(
    (m) => m.id !== accepted.membershipId,
  );
  assert.ok(original);
  const outcomes = await Promise.allSettled([
    s.updateMember(actors[0], ws, original.id, {
      role: "learner",
      status: "active",
      expectedRevision: 1,
    }),
    s.updateMember(second, ws, accepted.membershipId, {
      role: "learner",
      status: "active",
      expectedRevision: 1,
    }),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  const rejected = outcomes.find((x) => x.status === "rejected");
  assert.ok(
    rejected &&
      rejected.status === "rejected" &&
      rejected.reason instanceof DomainError &&
      rejected.reason.code === "LAST_OWNER",
  );
  const owners = await env.admin.query(
    "SELECT count(*)::int AS count FROM membership WHERE workspace_id=$1 AND role='owner' AND status='active'",
    [ws],
  );
  assert.equal(owners.rows[0].count, 1);
});
test("A16 real signup, SMTP verification, database sessions, APIs, recovery and revoked sessions", async () => {
  const auth = getAuth();
  const origin = process.env.APP_URL ?? "";
  assert.ok(origin);
  const request = (path: string, body: unknown, cookie = "") =>
    new Request(`${origin}/api/auth/${path}`, {
      method: "POST",
      headers: {
        origin,
        "Content-Type": "application/json",
        cookie: cookie ? `${cookie}; locale=fa` : "locale=fa",
      },
      body: JSON.stringify(body),
    });
  let response = await auth.handler(
    request("sign-up/email", {
      name: "آزمایش",
      email: "flow@local.test",
      password: "long-test-password-123",
      callbackURL: "/fa/workspaces",
    }),
  );
  assert.equal(response.status, 200, await response.clone().text());
  response = await auth.handler(
    request("sign-in/email", {
      email: "flow@local.test",
      password: "long-test-password-123",
    }),
  );
  assert.equal(response.status, 403);
  const delivery = (
    await env.admin.query(
      "SELECT ciphertext FROM mail_delivery WHERE invitation_id IS NULL ORDER BY created_at LIMIT 1",
    )
  ).rows[0];
  assert.ok(decryptMail(delivery.ciphertext).subject.includes("تأیید"));
  while (await deliverOnce(env.worker)) {
    /* Drain real encrypted queue into SMTP server. */
  }
  const verify = env.messages
    .flatMap(links)
    .find((x) => x.includes("/verify-email"));
  assert.ok(verify, "SMTP verification link received");
  response = await auth.handler(
    new Request(verify, { headers: { cookie: "locale=fa" } }),
  );
  assert.equal(response.status, 302, await response.clone().text());
  response = await auth.handler(
    request("sign-in/email", {
      email: "flow@local.test",
      password: "long-test-password-123",
    }),
  );
  assert.equal(response.status, 200, await response.clone().text());
  const cookie = response.headers
    .getSetCookie()
    .map((x) => x.split(";")[0])
    .join("; ");
  assert.ok(cookie.includes("session_token"));
  const session = await auth.api.getSession({
    headers: new Headers({ cookie }),
  });
  assert.equal(session?.user.emailVerified, true);
  assert.equal(session?.user.preferredLocale, "fa");
  let api = await handleApi(
    new Request(`${origin}/api/v1/workspaces`, { headers: { cookie } }),
  );
  assert.equal(api.status, 200);
  const data = (await api.json()).data;
  assert.equal(
    data.items.filter((w: { type: string }) => w.type === "personal").length,
    1,
  );
  api = await handleApi(
    new Request(`${origin}/api/v1/workspaces/${other}`, {
      headers: { cookie },
    }),
  );
  assert.equal(api.status, 404);
  api = await handleApi(
    new Request(`${origin}/api/v1/me/preferences`, {
      method: "PATCH",
      headers: {
        cookie,
        origin: "https://evil.test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preferredLocale: "en" }),
    }),
  );
  assert.equal(api.status, 403);
  api = await handleApi(
    new Request(`${origin}/api/v1/me/preferences`, {
      method: "PATCH",
      headers: { cookie, origin, "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLocale: "en", role: "owner" }),
    }),
  );
  assert.equal(api.status, 422);
  assert.ok(session);
  const authenticatedActor: Actor = {
    ...session.user,
    preferredLocale: session.user.preferredLocale ?? "fa",
  };
  const invitation = await s.createInvitation(
    actors[0],
    org,
    { email: authenticatedActor.email, role: "learner" },
    randomUUID(),
  );
  while (await deliverOnce(env.worker)) {}
  const invitationMessage = env.messages.find(
    (raw) =>
      raw.includes("To: flow@local.test") &&
      links(raw).some((link) => link.includes("/invite?")),
  );
  assert.ok(invitationMessage);
  const invitationLink = links(invitationMessage).find((link) =>
    link.includes("/invite?"),
  );
  assert.ok(invitationLink);
  api = await handleApi(
    new Request(`${origin}/api/v1/invitations/accept`, {
      method: "POST",
      headers: { cookie, origin, "Content-Type": "application/json" },
      body: JSON.stringify({
        token: new URL(invitationLink).searchParams.get("token"),
      }),
    }),
  );
  assert.equal(api.status, 200, await api.clone().text());
  const accepted = (await api.json()).data;
  api = await handleApi(
    new Request(`${origin}/api/v1/workspaces/${org}`, { headers: { cookie } }),
  );
  assert.equal(api.status, 200);
  await s.updateMember(actors[0], org, accepted.membershipId, {
    role: "learner",
    status: "removed",
    expectedRevision: 1,
  });
  api = await handleApi(
    new Request(`${origin}/api/v1/workspaces/${org}`, { headers: { cookie } }),
  );
  assert.equal(api.status, 404);
  assert.ok(invitation.id);
  api = await handleApi(
    new Request(`${origin}/api/v1/workspaces/${personal}/settings`, {
      method: "PATCH",
      headers: { cookie, origin, "Content-Type": "application/json" },
      body: "null",
    }),
  );
  assert.equal(api.status, 422);
  response = await auth.handler(
    request(
      "request-password-reset",
      { email: "flow@local.test", redirectTo: `${origin}/fa/reset-password` },
      cookie,
    ),
  );
  assert.equal(response.status, 200);
  while (await deliverOnce(env.worker)) {}
  const reset = env.messages
    .flatMap(links)
    .find((x) => x.includes("/reset-password/"));
  assert.ok(reset, "SMTP recovery link received");
  response = await auth.handler(new Request(reset));
  assert.equal(response.status, 302);
  const redirect = new URL(response.headers.get("location") ?? "", origin);
  const token = redirect.searchParams.get("token");
  assert.ok(token);
  response = await auth.handler(
    request("reset-password", { token, newPassword: "new-test-password-123" }),
  );
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal(
    await auth.api.getSession({ headers: new Headers({ cookie }) }),
    null,
  );
  api = await handleApi(
    new Request(`${origin}/api/v1/workspaces`, { headers: { cookie } }),
  );
  assert.equal(api.status, 401);
  assert.equal(
    (
      await env.admin.query(
        "SELECT count(*)::int AS count FROM mail_delivery WHERE status='sent' AND ciphertext IS NOT NULL",
      )
    ).rows[0].count,
    0,
  );
});
