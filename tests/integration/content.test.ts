import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { ZipFile } from "yazl";
import { handleApi } from "../../apps/web/lib/server/api";
import {
  exportPackage,
  propose,
  readArchive,
} from "../../packages/adapters/src/content-package";
import { getAuth } from "../../packages/application/src/auth";
import * as s from "../../packages/application/src/content";
import * as foundation from "../../packages/application/src/workspaces";
import { type Canonical, newNode } from "../../packages/contracts/src/content";
import { appPool } from "../../packages/database/src/connections";
import {
  actorTransaction,
  setTenant,
} from "../../packages/database/src/context";
import { ContentError } from "../../packages/domain/src/content";
import {
  type Actor,
  DomainError,
} from "../../packages/domain/src/workspaces/permissions";
import { environment } from "../helpers/environment";

let env: Awaited<ReturnType<typeof environment>>,
  personal: string,
  org: string,
  other: string;
const actors: Actor[] = [];
async function actor(email: string): Promise<Actor> {
  const a = {
    id: randomUUID(),
    email,
    name: email.split("@")[0],
    emailVerified: true,
    preferredLocale: "en",
  };
  await env.admin.query(
    'INSERT INTO identity."user"(id,name,email,email_verified) VALUES($1,$2,$3,true)',
    [a.id, a.name, a.email],
  );
  return a;
}
const doc = (): Canonical => ({
  schemaVersion: "1.0",
  title: "Content path",
  description: "Test",
  language: "en",
  nodes: [
    {
      ...newNode("lesson", "lesson", "Lesson", null, 0),
      body: "Learn DNS.",
      completion: { required: true, rule: "self" },
    },
  ],
});
const denied = (code: string) => (e: unknown) =>
  e instanceof DomainError && e.code === code;
async function populated(ws = org, canonical = doc()) {
  const p = await s.createPath(
    actors[0],
    ws,
    { title: canonical.title, language: canonical.language },
    randomUUID(),
  );
  await s.saveDraft(actors[0], ws, p.id, { canonical, expectedRevision: 1 });
  return p.id;
}
before(async () => {
  env = await environment();
  for (const email of [
    "content-owner@local.test",
    "content-manager@local.test",
    "content-learner@local.test",
    "content-outsider@local.test",
    "content-mentor@local.test",
  ]) {
    actors.push(await actor(email));
  }
  personal = (await foundation.listWorkspaces(actors[0]))[0].id;
  org = (
    await foundation.createOrganization(
      actors[0],
      { name: "Content A", timezone: "UTC", defaultLocale: "en" },
      randomUUID(),
    )
  ).id;
  other = (
    await foundation.createOrganization(
      actors[3],
      { name: "Content B", timezone: "UTC", defaultLocale: "en" },
      randomUUID(),
    )
  ).id;
  for (const [index, role] of [
    [1, "manager"],
    [2, "learner"],
    [4, "mentor"],
  ] as const)
    await env.admin.query(
      "INSERT INTO membership(workspace_id,user_id,role,display_name,email) VALUES($1,$2,$3,$4,$5)",
      [org, actors[index].id, role, actors[index].name, actors[index].email],
    );
});
after(async () => {
  await env?.stop();
});

test("content drafts enforce active editor scope, real RLS, no-context isolation, strict candidate rejection and CAS races", async () => {
  const id = await populated();
  const read = await s.readDraft(actors[1], org, id);
  assert.equal(read.revision, 2);
  await assert.rejects(s.readDraft(actors[3], other, id), denied("NOT_FOUND"));
  await assert.rejects(s.readDraft(actors[2], org, id), denied("FORBIDDEN"));
  await assert.rejects(s.listPaths(actors[4], org), denied("FORBIDDEN"));
  const bad = doc();
  bad.nodes[0].body = "[Bad](javascript:evil())";
  await assert.rejects(
    s.saveDraft(actors[0], org, id, { canonical: bad, expectedRevision: 2 }),
    (e) => e instanceof ContentError,
  );
  assert.equal((await s.readDraft(actors[0], org, id)).revision, 2);
  const raced = await Promise.allSettled([
    s.saveDraft(actors[0], org, id, {
      canonical: { ...doc(), title: "First" },
      expectedRevision: 2,
    }),
    s.saveDraft(actors[1], org, id, {
      canonical: { ...doc(), title: "Second" },
      expectedRevision: 2,
    }),
  ]);
  assert.equal(raced.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(
    raced.some(
      (r) => r.status === "rejected" && denied("REVISION_CONFLICT")(r.reason),
    ),
  );
  assert.equal(
    (await appPool().query("SELECT count(*) AS n FROM path_draft")).rows[0].n,
    "0",
  );
  await actorTransaction(actors[2], async (c) => {
    await setTenant(c, org);
    assert.equal(
      (await c.query("SELECT count(*) AS n FROM path_draft")).rows[0].n,
      "0",
    );
    await assert.rejects(
      c.query(
        "INSERT INTO learning_path(workspace_id,title) VALUES($1,'bypass')",
        [org],
      ),
    );
  });
});
test("publish derives snapshot nodes and units, seals atomically, rejects mutations/late inserts and preserves old versions after editing/archive", async () => {
  const fixture = JSON.parse(
    await readFile(
      "examples/sample-learning-path/canonical.expected.json",
      "utf8",
    ),
  ) as Canonical;
  const id = await populated(org, fixture),
    key = randomUUID();
  const v1 = await s.publishPath(actors[0], org, id, 2, key);
  assert.deepEqual(await s.publishPath(actors[0], org, id, 2, key), v1);
  assert.equal(
    (
      await env.admin.query(
        "SELECT count(*) AS n FROM completion_unit WHERE path_version_id=$1 AND required",
        [v1.versionId],
      )
    ).rows[0].n,
    "4",
  );
  assert.equal(
    (
      await env.admin.query(
        "SELECT count(*) AS n FROM completion_unit WHERE path_version_id=$1 AND NOT required",
        [v1.versionId],
      )
    ).rows[0].n,
    "1",
  );
  await actorTransaction(actors[0], async (c) => {
    await setTenant(c, org);
    await assert.rejects(
      c.query("UPDATE path_version SET canonical_json='{}' WHERE id=$1", [
        v1.versionId,
      ]),
    );
  });
  await assert.rejects(
    env.admin.query("UPDATE path_version SET canonical_json='{}' WHERE id=$1", [
      v1.versionId,
    ]),
  );
  await assert.rejects(
    env.admin.query(
      "UPDATE content_node SET title='tamper' WHERE path_version_id=$1",
      [v1.versionId],
    ),
  );
  await assert.rejects(
    env.admin.query(
      "INSERT INTO content_node(workspace_id,path_version_id,logical_id,kind,sort_order,title,body_markdown,metadata_json) VALUES($1,$2,'late','lesson',999,'Late','','{}')",
      [org, v1.versionId],
    ),
  );
  const changed = structuredClone(fixture);
  changed.title = "Second version";
  changed.nodes[0].title = "Changed stage";
  await s.saveDraft(actors[1], org, id, {
    canonical: changed,
    expectedRevision: v1.revision,
  });
  const v2 = await s.publishPath(
    actors[1],
    org,
    id,
    v1.revision + 1,
    randomUUID(),
  );
  assert.equal(v2.number, 2);
  assert.notEqual(v2.versionId, v1.versionId);
  assert.deepEqual(
    (await s.readVersion(actors[0], org, id, v1.versionId)).canonical,
    fixture,
  );
  assert.deepEqual(
    (await s.readVersion(actors[0], org, id, v2.versionId)).canonical,
    changed,
  );
  await s.archivePath(actors[0], org, id, v2.revision, randomUUID());
  await assert.rejects(
    s.saveDraft(actors[0], org, id, {
      canonical: changed,
      expectedRevision: v2.revision + 1,
    }),
    denied("PATH_ARCHIVED"),
  );
  assert.deepEqual(
    (await s.readVersion(actors[0], org, id, v1.versionId)).canonical,
    fixture,
  );
  const exported = propose(
    await readArchive(await s.exportVersion(actors[0], org, id, v1.versionId)),
    "structured",
  );
  assert.deepEqual(exported.canonical, fixture);
});
test("publication races and injected failure produce one sealed result or complete rollback", async () => {
  const id = await populated();
  const result = await Promise.allSettled([
    s.publishPath(actors[0], org, id, 2, randomUUID()),
    s.publishPath(actors[1], org, id, 2, randomUUID()),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.ok(
    result.some(
      (x) => x.status === "rejected" && denied("REVISION_CONFLICT")(x.reason),
    ),
  );
  assert.equal(
    (
      await env.admin.query(
        "SELECT count(*) AS n FROM path_version WHERE path_id=$1",
        [id],
      )
    ).rows[0].n,
    "1",
  );
  const rollbackId = await populated();
  await env.admin.query(
    "CREATE FUNCTION test_publish_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='path.published' THEN RAISE EXCEPTION 'injected'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_publish_failure BEFORE INSERT ON audit_record FOR EACH ROW EXECUTE FUNCTION test_publish_failure()",
  );
  try {
    await assert.rejects(
      s.publishPath(actors[0], org, rollbackId, 2, randomUUID()),
    );
  } finally {
    await env.admin.query(
      "DROP TRIGGER test_publish_failure ON audit_record; DROP FUNCTION test_publish_failure()",
    );
  }
  const afterFailure = await s.readDraft(actors[0], org, rollbackId);
  assert.equal(afterFailure.revision, 2);
  assert.equal(afterFailure.publishedVersionId, null);
  assert.equal(afterFailure.versions.length, 0);
});
test("personal publication requires explicit self-rule conversion and atomic start pins exactly one enrollment", async () => {
  const approval = doc();
  approval.nodes = [
    {
      ...newNode("project", "project", "Project", null, 0),
      completion: { required: true, rule: "approval" },
    },
  ];
  const id = await populated(personal, approval);
  await assert.rejects(
    s.publishPath(actors[0], personal, id, 2, randomUUID(), true),
    (e) =>
      e instanceof ContentError &&
      e.issues.some((i) => i.code === "PERSONAL_APPROVAL"),
  );
  assert.equal((await s.readDraft(actors[0], personal, id)).versions.length, 0);
  assert.equal(
    (
      await env.admin.query(
        "SELECT count(*) AS n FROM enrollment WHERE workspace_id=$1",
        [personal],
      )
    ).rows[0].n,
    "0",
  );
  approval.nodes[0].completion = { required: true, rule: "self" };
  await s.saveDraft(actors[0], personal, id, {
    canonical: approval,
    expectedRevision: 2,
  });
  const key = randomUUID();
  const started = await s.publishPath(actors[0], personal, id, 3, key, true);
  assert.deepEqual(
    await s.publishPath(actors[0], personal, id, 3, key, true),
    started,
  );
  assert.ok(started.enrollmentId);
  const again = await s.publishPath(
    actors[0],
    personal,
    id,
    started.revision,
    randomUUID(),
    true,
  );
  assert.equal(again.versionId, started.versionId);
  assert.equal(again.enrollmentId, started.enrollmentId);
  const changed = structuredClone(approval);
  changed.nodes[0].title = "New project";
  await s.saveDraft(actors[0], personal, id, {
    canonical: changed,
    expectedRevision: again.revision,
  });
  const next = await s.publishPath(
    actors[0],
    personal,
    id,
    again.revision + 1,
    randomUUID(),
  );
  assert.notEqual(next.versionId, started.versionId);
  assert.equal(
    (
      await env.admin.query(
        "SELECT path_version_id FROM enrollment WHERE id=$1",
        [started.enrollmentId],
      )
    ).rows[0].path_version_id,
    started.versionId,
  );
  await assert.rejects(
    s.publishPath(actors[0], org, await populated(), 2, randomUUID(), true),
    denied("PERSONAL_ONLY"),
  );
});
test("imports retain private source/provenance, need warning acknowledgment, confirm exactly once and reject cancelled/revoked requests", async () => {
  const input = Buffer.from("# Roadmap\n\n## Basics\n\n- [x] Explain DNS\n");
  const key = randomUUID();
  const created = await s.createImport(
    actors[1],
    org,
    "loose",
    input,
    "README.md",
    key,
  );
  assert.deepEqual(
    await s.createImport(actors[1], org, "loose", input, "README.md", key),
    created,
  );
  const preview = await s.readImport(actors[1], org, created.id);
  assert.ok(preview.canonical);
  assert.ok(preview.source[0].text?.includes("[x]"));
  assert.ok(preview.provenance.length);
  await assert.rejects(
    s.readImport(actors[3], other, created.id),
    denied("NOT_FOUND"),
  );
  await assert.rejects(
    s.readImport(actors[2], org, created.id),
    denied("FORBIDDEN"),
  );
  const confirm = {
    canonical: preview.canonical,
    expectedRevision: 1,
    acknowledgeWarnings: false,
  };
  await assert.rejects(
    s.confirmImport(actors[1], org, created.id, confirm, randomUUID()),
    denied("ACKNOWLEDGEMENT_REQUIRED"),
  );
  confirm.acknowledgeWarnings = true;
  const confirmKey = randomUUID();
  const results = await Promise.all([
    s.confirmImport(actors[1], org, created.id, confirm, confirmKey),
    s.confirmImport(actors[1], org, created.id, confirm, confirmKey),
  ]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(
    (await s.readImport(actors[1], org, created.id)).confirmedPathId,
    results[0].id,
  );
  await assert.rejects(
    s.confirmImport(
      actors[1],
      org,
      created.id,
      { ...confirm, canonical: { ...confirm.canonical, title: "Changed" } },
      confirmKey,
    ),
    denied("IDEMPOTENCY_CONFLICT"),
  );
  const cancelled = await s.createImport(
    actors[0],
    org,
    "loose",
    input,
    "README.md",
    randomUUID(),
  );
  await s.cancelImport(actors[0], org, cancelled.id, 1, randomUUID());
  await assert.rejects(
    s.confirmImport(actors[0], org, cancelled.id, confirm, randomUUID()),
    denied("IMPORT_CLOSED"),
  );
  const pending = await s.createImport(
    actors[1],
    org,
    "loose",
    input,
    "README.md",
    randomUUID(),
  );
  await env.admin.query(
    "UPDATE membership SET status='removed' WHERE workspace_id=$1 AND user_id=$2",
    [org, actors[1].id],
  );
  await assert.rejects(
    s.confirmImport(actors[1], org, pending.id, confirm, randomUUID()),
    denied("NOT_FOUND"),
  );
  await env.admin.query(
    "UPDATE membership SET status='active' WHERE workspace_id=$1 AND user_id=$2",
    [org, actors[1].id],
  );
});
test("published binary assets use real private storage, authorized bindings and lossless export; raw source never leaks to learners", async () => {
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKf0AAAAASUVORK5CYII=",
    "base64",
  );
  const canonical = doc();
  canonical.nodes[0].body = "![Diagram](assets/diagram.png)";
  const archive = new ZipFile();
  const single = await exportPackage(doc());
  const base = await readArchive(single);
  for (const file of base)
    archive.addBuffer(
      file.name.endsWith(".md") && file.name !== "README.md"
        ? Buffer.from("![Diagram](../assets/diagram.png)")
        : file.bytes,
      file.name,
    );
  archive.addBuffer(image, "assets/diagram.png");
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve) => {
    archive.outputStream.on("data", (b) => chunks.push(b));
    archive.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  archive.end();
  const raw = await done;
  const imported = await s.createImport(
    actors[0],
    org,
    "structured",
    raw,
    "package.zip",
    randomUUID(),
    true,
  );
  const preview = await s.readImport(actors[0], org, imported.id);
  assert.deepEqual(preview.errors, []);
  assert.ok(preview.canonical);
  const confirmed = await s.confirmImport(
    actors[0],
    org,
    imported.id,
    {
      canonical: preview.canonical,
      expectedRevision: 1,
      acknowledgeWarnings: true,
    },
    randomUUID(),
  );
  const version = await s.publishPath(
    actors[0],
    org,
    confirmed.id,
    1,
    randomUUID(),
  );
  const read = await s.readVersion(
    actors[0],
    org,
    confirmed.id,
    version.versionId,
  );
  assert.equal(read.assets.length, 1);
  const actual = await s.readAsset(
    actors[0],
    org,
    confirmed.id,
    version.versionId,
    read.assets[0],
  );
  assert.equal(actual.mediaType, "image/png");
  assert.deepEqual(actual.bytes, image);
  await assert.rejects(
    s.readAsset(
      actors[2],
      org,
      confirmed.id,
      version.versionId,
      read.assets[0],
    ),
    denied("NOT_FOUND"),
  );
  await assert.rejects(
    s.readAsset(
      actors[3],
      other,
      confirmed.id,
      version.versionId,
      read.assets[0],
    ),
    denied("NOT_FOUND"),
  );
  const exported = propose(
    await readArchive(
      await s.exportVersion(actors[0], org, confirmed.id, version.versionId),
    ),
    "structured",
  );
  assert.deepEqual(exported.canonical, preview.canonical);
  assert.deepEqual(exported.assets[0].bytes, image);
});
test("real session content APIs enforce origin, transport limits, preconditions, error pointers and tenant visibility", async () => {
  const origin = process.env.APP_URL ?? "",
    auth = getAuth(),
    email = "content-api@local.test",
    password = "content-api-long-password-123";
  const req = (path: string, body: unknown) =>
    new Request(`${origin}/api/auth/${path}`, {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await auth.handler(req("sign-up/email", { name: "API", email, password })))
      .status,
    200,
  );
  await env.admin.query(
    'UPDATE identity."user" SET email_verified=true WHERE email=$1',
    [email],
  );
  const signed = await auth.handler(req("sign-in/email", { email, password }));
  assert.equal(signed.status, 200);
  const cookie = signed.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const call = (
    path: string,
    method = "GET",
    body?: unknown,
    extra: Record<string, string> = {},
  ) =>
    handleApi(
      new Request(`${origin}/api/v1/${path}`, {
        method,
        headers: {
          cookie,
          origin,
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
          ...extra,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      }),
    );
  const workspaceList = await (await call("workspaces")).json();
  const ws = workspaceList.data.items[0].id;
  const pathBase = `workspaces/${ws}/paths`;
  const created = await call(pathBase, "POST", {
    title: "API path",
    language: "en",
  });
  assert.equal(created.status, 200);
  const id = (await created.json()).data.id;
  assert.equal(
    (await call(`${pathBase}/${id}/draft`, "PUT", { canonical: doc() })).status,
    428,
  );
  assert.equal(
    (
      await call(
        `${pathBase}/${id}/draft`,
        "PUT",
        { canonical: doc(), expectedRevision: 1 },
        { origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  const invalid = doc();
  invalid.nodes[0].parentId = "missing";
  const rejected = await call(`${pathBase}/${id}/draft`, "PUT", {
    canonical: invalid,
    expectedRevision: 1,
  });
  assert.equal(rejected.status, 422);
  assert.ok(
    (await rejected.json()).error.details.some(
      (i: { pointer: string }) => i.pointer === "/nodes/0/parentId",
    ),
  );
  assert.equal(
    (
      await call(`${pathBase}/${id}/draft`, "PUT", {
        canonical: doc(),
        expectedRevision: 1,
      })
    ).status,
    200,
  );
  const published = await call(`${pathBase}/${id}/start`, "POST", {
    expectedRevision: 2,
  });
  assert.equal(published.status, 200);
  const version = (await published.json()).data.versionId;
  const binary = await call(`${pathBase}/${id}/versions/${version}/export`);
  assert.equal(binary.status, 200);
  assert.equal(binary.headers.get("content-type"), "application/zip");
  assert.ok((await binary.arrayBuffer()).byteLength > 0);
  assert.equal((await call(`workspaces/${other}/paths`)).status, 404);
  const over = await handleApi(
    new Request(`${origin}/api/v1/${pathBase}`, {
      method: "POST",
      headers: {
        cookie,
        origin,
        "Content-Type": "application/json",
        "Content-Length": "99999999",
      },
      body: "{}",
    }),
  );
  assert.equal(over.status, 413);
});
