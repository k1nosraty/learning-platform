import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import {
  type Asset,
  exportPackage,
  propose,
  readArchive,
} from "../../adapters/src/content-package";
import { contentStorage } from "../../adapters/src/content-storage";
import type {
  Canonical,
  DraftDto,
  ImportDto,
} from "../../contracts/src/content";
import { tenantTransaction, type Workspace } from "../../database/src/context";
import { assertContent, contentHash } from "../../domain/src/content";
import {
  type Actor,
  DomainError,
  type Role,
} from "../../domain/src/workspaces/permissions";

function editor(role: Role) {
  if (role !== "owner" && role !== "manager")
    throw new DomainError("FORBIDDEN", 403);
}
const digest = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
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
  if (
    [
      "path.published",
      "path.started",
      "path.archived",
      "import.confirmed",
    ].includes(action)
  )
    await c.query(
      "INSERT INTO outbox_event(workspace_id,event_type,aggregate_id) VALUES($1,$2,$3)",
      [ws, action, id],
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
async function draft(c: PoolClient, ws: string, id: string) {
  const r = await c.query(
    "SELECT p.id,p.archived_at,p.published_version_id,d.canonical_json,d.revision,d.provenance_json FROM learning_path p JOIN path_draft d ON d.path_id=p.id AND d.workspace_id=p.workspace_id WHERE p.workspace_id=$1 AND p.id=$2 FOR UPDATE OF p,d",
    [ws, id],
  );
  if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
  return r.rows[0] as {
    id: string;
    archived_at: Date | null;
    published_version_id: string | null;
    canonical_json: Canonical;
    revision: number;
    provenance_json: unknown;
  };
}
function editable(d: Awaited<ReturnType<typeof draft>>, revision: number) {
  if (d.archived_at) throw new DomainError("PATH_ARCHIVED", 409);
  if (d.revision !== revision) throw new DomainError("REVISION_CONFLICT", 409);
}
async function assetsForDraft(c: PoolClient, ws: string, id: string) {
  return (
    await c.query<{ name: string }>(
      "SELECT name FROM draft_asset WHERE workspace_id=$1 AND path_id=$2 ORDER BY name",
      [ws, id],
    )
  ).rows.map((a) => a.name);
}
async function newPath(
  c: PoolClient,
  actor: Actor,
  ws: string,
  canonical: Canonical,
  provenance: unknown = {},
) {
  const id = randomUUID();
  await c.query(
    "INSERT INTO learning_path(id,workspace_id,title) VALUES($1,$2,$3)",
    [id, ws, canonical.title],
  );
  await c.query(
    "INSERT INTO path_draft(workspace_id,path_id,canonical_json,updated_by,provenance_json) VALUES($1,$2,$3,$4,$5)",
    [ws, id, JSON.stringify(canonical), actor.id, JSON.stringify(provenance)],
  );
  await audit(c, actor, ws, "path.created", id);
  return { id, revision: 1 };
}
export async function createPath(
  actor: Actor,
  ws: string,
  input: { title: string; language: string },
  key: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    return command(c, actor, ws, "path.create", key, input, async () => {
      const canonical: Canonical = {
        schemaVersion: "1.0",
        ...input,
        description: "",
        nodes: [],
      };
      assertContent(canonical);
      return newPath(c, actor, ws, canonical);
    });
  });
}
export async function listPaths(
  actor: Actor,
  ws: string,
  cursor?: string,
  limit = 25,
) {
  return tenantTransaction(actor, ws, false, async (c, m) => {
    editor(m.role);
    const r = await c.query(
      'SELECT p.id,p.title,p.archived_at AS "archivedAt",p.published_version_id AS "publishedVersionId",d.revision,d.canonical_json->>\'language\' AS language FROM learning_path p JOIN path_draft d ON d.workspace_id=p.workspace_id AND d.path_id=p.id WHERE p.workspace_id=$1 AND ($2::uuid IS NULL OR p.id>$2) ORDER BY p.id LIMIT $3',
      [ws, cursor ?? null, limit + 1],
    );
    return {
      items: r.rows.slice(0, limit),
      nextCursor: r.rows.length > limit ? r.rows[limit - 1].id : null,
    };
  });
}
export async function readDraft(
  actor: Actor,
  ws: string,
  id: string,
): Promise<DraftDto> {
  return tenantTransaction(actor, ws, false, async (c, m) => {
    editor(m.role);
    const d = await draft(c, ws, id);
    const versions = (
      await c.query(
        'SELECT id,version_number AS number,published_at AS "publishedAt",content_hash AS hash FROM path_version WHERE workspace_id=$1 AND path_id=$2 AND sealed ORDER BY version_number DESC',
        [ws, id],
      )
    ).rows;
    return {
      id,
      canonical: d.canonical_json,
      revision: d.revision,
      archived: !!d.archived_at,
      publishedVersionId: d.published_version_id,
      versions,
      assets: await assetsForDraft(c, ws, id),
    };
  });
}
export async function saveDraft(
  actor: Actor,
  ws: string,
  id: string,
  input: { canonical: Canonical; expectedRevision: number },
) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    const d = await draft(c, ws, id);
    editable(d, input.expectedRevision);
    assertContent(input.canonical, { assets: await assetsForDraft(c, ws, id) });
    const r = await c.query(
      "UPDATE path_draft SET canonical_json=$3,revision=revision+1,updated_by=$4,updated_at=now(),provenance_json=provenance_json||jsonb_build_object('edited',true) WHERE workspace_id=$1 AND path_id=$2 RETURNING revision",
      [ws, id, JSON.stringify(input.canonical), actor.id],
    );
    await c.query(
      "UPDATE learning_path SET title=$3 WHERE workspace_id=$1 AND id=$2",
      [ws, id, input.canonical.title],
    );
    await audit(c, actor, ws, "draft.saved", id);
    return { id, revision: r.rows[0].revision };
  });
}
async function publishLocked(
  c: PoolClient,
  actor: Actor,
  ws: string,
  id: string,
  workspace: Workspace,
  d: Awaited<ReturnType<typeof draft>>,
) {
  const assetNames = await assetsForDraft(c, ws, id);
  assertContent(d.canonical_json, {
    publish: true,
    personal: workspace.type === "personal",
    assets: assetNames,
  });
  const hash = contentHash(d.canonical_json);
  if (d.published_version_id) {
    const existing = await c.query(
      "SELECT id,version_number,content_hash FROM path_version WHERE workspace_id=$1 AND id=$2 AND sealed",
      [ws, d.published_version_id],
    );
    if (existing.rows[0]?.content_hash === hash)
      return {
        versionId: existing.rows[0].id as string,
        number: existing.rows[0].version_number as number,
        hash,
      };
  }
  const versionId = randomUUID();
  const number = Number(
    (
      await c.query(
        "SELECT coalesce(max(version_number),0)+1 AS n FROM path_version WHERE workspace_id=$1 AND path_id=$2",
        [ws, id],
      )
    ).rows[0].n,
  );
  await c.query(
    "INSERT INTO path_version(id,workspace_id,path_id,version_number,canonical_json,content_hash,provenance_json,published_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      versionId,
      ws,
      id,
      number,
      JSON.stringify(d.canonical_json),
      hash,
      JSON.stringify(d.provenance_json),
      actor.id,
    ],
  );
  const rowIds = new Map(
    d.canonical_json.nodes.map((n) => [n.id, randomUUID()]),
  );
  for (const n of d.canonical_json.nodes) {
    const nodeId = rowIds.get(n.id);
    await c.query(
      "INSERT INTO content_node(id,workspace_id,path_version_id,logical_id,parent_node_id,kind,sort_order,title,body_markdown,resource_url,metadata_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        nodeId,
        ws,
        versionId,
        n.id,
        n.parentId ? rowIds.get(n.parentId) : null,
        n.kind,
        n.order,
        n.title,
        n.body,
        n.resourceUrl,
        JSON.stringify({
          estimatedMinutes: n.estimatedMinutes,
          difficulty: n.difficulty,
          tags: n.tags,
        }),
      ],
    );
    if (n.completion)
      await c.query(
        "INSERT INTO completion_unit(workspace_id,path_version_id,node_id,logical_id,required,rule) VALUES($1,$2,$3,$4,$5,$6)",
        [ws, versionId, nodeId, n.id, n.completion.required, n.completion.rule],
      );
  }
  await c.query(
    "INSERT INTO version_asset(workspace_id,path_version_id,name,blob_id) SELECT workspace_id,$3,name,blob_id FROM draft_asset WHERE workspace_id=$1 AND path_id=$2",
    [ws, id, versionId],
  );
  await c.query(
    "UPDATE path_version SET sealed=true WHERE workspace_id=$1 AND id=$2",
    [ws, versionId],
  );
  await c.query(
    "UPDATE learning_path SET published_version_id=$3 WHERE workspace_id=$1 AND id=$2",
    [ws, id, versionId],
  );
  await audit(c, actor, ws, "path.published", versionId);
  return { versionId, number, hash };
}
export async function publishPath(
  actor: Actor,
  ws: string,
  id: string,
  expectedRevision: number,
  key: string,
  start = false,
) {
  return tenantTransaction(actor, ws, true, async (c, m, w) => {
    editor(m.role);
    if (start && w.type !== "personal")
      throw new DomainError("PERSONAL_ONLY", 403);
    return command(
      c,
      actor,
      ws,
      `path.${start ? "start" : "publish"}:${id}`,
      key,
      { expectedRevision },
      async () => {
        const d = await draft(c, ws, id);
        editable(d, expectedRevision);
        const version = await publishLocked(c, actor, ws, id, w, d);
        let enrollmentId: string | undefined;
        if (start) {
          const created = await c.query(
            "INSERT INTO enrollment(workspace_id,learner_membership_id,path_version_id,origin,assigned_by) VALUES($1,$2,$3,'personal',$2) ON CONFLICT(learner_membership_id,path_version_id) DO NOTHING RETURNING id",
            [ws, m.id, version.versionId],
          );
          enrollmentId =
            created.rows[0]?.id ??
            (
              await c.query(
                "SELECT id FROM enrollment WHERE workspace_id=$1 AND learner_membership_id=$2 AND path_version_id=$3",
                [ws, m.id, version.versionId],
              )
            ).rows[0].id;
          await audit(c, actor, ws, "path.started", enrollmentId as string);
        }
        const rev = await c.query(
          "UPDATE path_draft SET revision=revision+1,updated_by=$3,updated_at=now() WHERE workspace_id=$1 AND path_id=$2 RETURNING revision",
          [ws, id, actor.id],
        );
        return {
          id,
          ...version,
          revision: rev.rows[0].revision as number,
          ...(enrollmentId ? { enrollmentId } : {}),
        };
      },
    );
  });
}
export async function archivePath(
  actor: Actor,
  ws: string,
  id: string,
  expectedRevision: number,
  key: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    return command(
      c,
      actor,
      ws,
      `path.archive:${id}`,
      key,
      { expectedRevision },
      async () => {
        const d = await draft(c, ws, id);
        editable(d, expectedRevision);
        await c.query(
          "UPDATE learning_path SET archived_at=now() WHERE workspace_id=$1 AND id=$2",
          [ws, id],
        );
        await c.query(
          "UPDATE path_draft SET revision=revision+1,updated_by=$3 WHERE workspace_id=$1 AND path_id=$2",
          [ws, id, actor.id],
        );
        await audit(c, actor, ws, "path.archived", id);
        return { id, revision: d.revision + 1 };
      },
    );
  });
}
export async function readVersion(
  actor: Actor,
  ws: string,
  pathId: string,
  versionId: string,
) {
  return tenantTransaction(actor, ws, false, async (c) => {
    const r = await c.query(
      'SELECT id,path_id AS "pathId",version_number AS number,canonical_json AS canonical,content_hash AS hash,published_at AS "publishedAt" FROM path_version WHERE workspace_id=$1 AND path_id=$2 AND id=$3 AND sealed',
      [ws, pathId, versionId],
    );
    if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
    const assets = (
      await c.query<{ name: string }>(
        "SELECT name FROM version_asset WHERE workspace_id=$1 AND path_version_id=$2",
        [ws, versionId],
      )
    ).rows.map((a) => a.name);
    return { ...r.rows[0], assets };
  });
}
export async function createImport(
  actor: Actor,
  ws: string,
  method: "loose" | "structured",
  raw: Buffer,
  filename: string,
  key: string,
  isArchive = false,
) {
  if (raw.length > (isArchive ? 20 : 2) * 1024 * 1024)
    throw new DomainError("BODY_TOO_LARGE", 413);
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    return command(
      c,
      actor,
      ws,
      "import.create",
      key,
      { method, filename, sha256: digest(raw) },
      async () => {
        const files = isArchive
          ? await readArchive(raw)
          : [{ name: filename, bytes: raw }];
        const proposal = propose(files, method);
        const id = randomUUID();
        const preview = {
          canonical: proposal.canonical,
          warnings: proposal.warnings,
          errors: proposal.errors,
          provenance: proposal.provenance,
          source: proposal.source,
        };
        await c.query(
          "INSERT INTO import_run(id,workspace_id,requested_by,method,preview_json,source_hash) VALUES($1,$2,$3,$4,$5,$6)",
          [id, ws, actor.id, method, JSON.stringify(preview), digest(raw)],
        );
        const put = async (name: string, bytes: Buffer, type: string) => {
          const objectKey = await contentStorage.put(ws, bytes);
          const r = await c.query(
            "INSERT INTO content_blob(workspace_id,object_key,original_name,media_type,bytes,sha256,import_run_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
            [ws, objectKey, name, type, bytes.length, digest(bytes), id],
          );
          return r.rows[0].id as string;
        };
        await put(
          filename,
          raw,
          isArchive ? "application/zip" : "text/plain; charset=utf-8",
        );
        for (const asset of proposal.assets) {
          const blob = await put(asset.name, asset.bytes, asset.mediaType);
          await c.query(
            "INSERT INTO import_asset(workspace_id,import_run_id,name,blob_id) VALUES($1,$2,$3,$4)",
            [ws, id, asset.name, blob],
          );
        }
        await audit(c, actor, ws, "import.preview", id);
        return { id };
      },
    );
  });
}
export async function readImport(
  actor: Actor,
  ws: string,
  id: string,
): Promise<ImportDto> {
  return tenantTransaction(actor, ws, false, async (c, m) => {
    editor(m.role);
    const r = await c.query(
      'SELECT id,revision,method,state,preview_json,confirmed_path_id AS "confirmedPathId" FROM import_run WHERE workspace_id=$1 AND id=$2 AND expires_at>now()',
      [ws, id],
    );
    if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
    const { preview_json, ...meta } = r.rows[0];
    return { ...meta, ...preview_json };
  });
}
export async function confirmImport(
  actor: Actor,
  ws: string,
  id: string,
  input: {
    canonical: Canonical;
    expectedRevision: number;
    acknowledgeWarnings: boolean;
  },
  key: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    return command(
      c,
      actor,
      ws,
      `import.confirm:${id}`,
      key,
      input,
      async () => {
        const r = await c.query(
          "SELECT * FROM import_run WHERE workspace_id=$1 AND id=$2 AND expires_at>now() FOR UPDATE",
          [ws, id],
        );
        if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
        const run = r.rows[0];
        if (run.state !== "preview")
          throw new DomainError("IMPORT_CLOSED", 409);
        if (run.revision !== input.expectedRevision)
          throw new DomainError("REVISION_CONFLICT", 409);
        if (run.preview_json.warnings.length && !input.acknowledgeWarnings)
          throw new DomainError("ACKNOWLEDGEMENT_REQUIRED", 422);
        const assets = (
          await c.query<{ name: string }>(
            "SELECT name FROM import_asset WHERE workspace_id=$1 AND import_run_id=$2",
            [ws, id],
          )
        ).rows.map((a) => a.name);
        assertContent(input.canonical, { assets });
        const created = await newPath(c, actor, ws, input.canonical, {
          sourceHash: run.source_hash,
          method: run.method,
          source: run.preview_json.source.map(
            (s: { filename: string; sha256: string }) => ({
              filename: s.filename,
              sha256: s.sha256,
            }),
          ),
          spans: run.preview_json.provenance,
          edited:
            contentHash(input.canonical) !==
            (run.preview_json.canonical
              ? contentHash(run.preview_json.canonical)
              : null),
        });
        await c.query(
          "INSERT INTO draft_asset(workspace_id,path_id,name,blob_id) SELECT workspace_id,$3,name,blob_id FROM import_asset WHERE workspace_id=$1 AND import_run_id=$2",
          [ws, id, created.id],
        );
        await c.query(
          "UPDATE import_run SET state='confirmed',revision=revision+1,confirmed_path_id=$3 WHERE workspace_id=$1 AND id=$2",
          [ws, id, created.id],
        );
        await audit(c, actor, ws, "import.confirmed", id);
        return created;
      },
    );
  });
}
export async function cancelImport(
  actor: Actor,
  ws: string,
  id: string,
  expectedRevision: number,
  key: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    return command(
      c,
      actor,
      ws,
      `import.cancel:${id}`,
      key,
      { expectedRevision },
      async () => {
        const r = await c.query(
          "UPDATE import_run SET state='cancelled',revision=revision+1 WHERE workspace_id=$1 AND id=$2 AND state='preview' AND revision=$3 AND expires_at>now() RETURNING id,revision",
          [ws, id, expectedRevision],
        );
        if (!r.rowCount) throw new DomainError("REVISION_CONFLICT", 409);
        return r.rows[0];
      },
    );
  });
}
export async function exportVersion(
  actor: Actor,
  ws: string,
  pathId: string,
  versionId: string,
) {
  return tenantTransaction(actor, ws, true, async (c, m) => {
    editor(m.role);
    const version = await c.query(
      "SELECT canonical_json FROM path_version WHERE workspace_id=$1 AND path_id=$2 AND id=$3 AND sealed",
      [ws, pathId, versionId],
    );
    if (!version.rowCount) throw new DomainError("NOT_FOUND", 404);
    const assets: Asset[] = [];
    const r = await c.query(
      "SELECT a.name,b.object_key,b.media_type,b.sha256 FROM version_asset a JOIN content_blob b ON b.workspace_id=a.workspace_id AND b.id=a.blob_id WHERE a.workspace_id=$1 AND a.path_version_id=$2",
      [ws, versionId],
    );
    for (const a of r.rows) {
      const bytes = await contentStorage.get(a.object_key);
      if (digest(bytes) !== a.sha256)
        throw new DomainError("FILE_UNAVAILABLE", 503);
      assets.push({ name: a.name, bytes, mediaType: a.media_type });
    }
    const bytes = await exportPackage(version.rows[0].canonical_json, assets);
    await audit(c, actor, ws, "path.exported", versionId);
    return bytes;
  });
}
export async function readAsset(
  actor: Actor,
  ws: string,
  pathId: string,
  versionId: string,
  name: string,
) {
  return tenantTransaction(actor, ws, false, async (c) => {
    const r = await c.query(
      "SELECT b.object_key,b.media_type,b.sha256 FROM version_asset a JOIN path_version v ON v.workspace_id=a.workspace_id AND v.id=a.path_version_id JOIN content_blob b ON b.workspace_id=a.workspace_id AND b.id=a.blob_id WHERE a.workspace_id=$1 AND v.path_id=$2 AND v.id=$3 AND v.sealed AND a.name=$4",
      [ws, pathId, versionId, name],
    );
    if (!r.rowCount) throw new DomainError("NOT_FOUND", 404);
    const file = r.rows[0],
      bytes = await contentStorage.get(file.object_key);
    if (digest(bytes) !== file.sha256)
      throw new DomainError("FILE_UNAVAILABLE", 503);
    return { bytes, mediaType: file.media_type as string };
  });
}
