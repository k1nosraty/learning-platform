import type { z } from "zod";
import * as service from "../../../../packages/application/src/content";
import * as contract from "../../../../packages/contracts/src/content";
import {
  idempotencyKey,
  listQuery,
  uuid,
} from "../../../../packages/contracts/src/foundation";
import {
  type Actor,
  DomainError,
} from "../../../../packages/domain/src/workspaces/permissions";

export async function boundedBody(request: Request, limit: number) {
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw new DomainError("BODY_TOO_LARGE", 413);
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new DomainError("BODY_TOO_LARGE", 413);
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts);
}
export async function contentRequest(
  request: Request,
  actor: Actor,
  ws: string,
  path: string[],
  requestId: string,
): Promise<{ data: unknown } | Response> {
  const method = request.method,
    sub = path[2],
    id = path[3] ? uuid.parse(path[3]) : undefined;
  const key = () =>
    idempotencyKey.parse(request.headers.get("idempotency-key"));
  async function input<T>(schema: z.ZodType<T>, revision = false): Promise<T> {
    let value: unknown;
    try {
      value = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await boundedBody(request, 6 * 1024 * 1024),
        ),
      );
    } catch (e) {
      if (e instanceof DomainError) throw e;
      throw new DomainError("INVALID_JSON", 400);
    }
    if (
      revision &&
      (!value || typeof value !== "object" || !("expectedRevision" in value))
    )
      throw new DomainError("PRECONDITION_REQUIRED", 428);
    return schema.parse(value);
  }
  if (sub === "paths") {
    if (path.length === 3 && method === "GET") {
      const q = listQuery.parse(
        Object.fromEntries(new URL(request.url).searchParams),
      );
      return { data: await service.listPaths(actor, ws, q.cursor, q.limit) };
    }
    if (path.length === 3 && method === "POST")
      return {
        data: await service.createPath(
          actor,
          ws,
          await input(contract.createPathInput),
          key(),
        ),
      };
    if (id && path.length === 5 && path[4] === "draft") {
      if (method === "GET")
        return { data: await service.readDraft(actor, ws, id) };
      if (method === "PUT")
        return {
          data: await service.saveDraft(
            actor,
            ws,
            id,
            await input(contract.saveDraftInput, true),
          ),
        };
    }
    if (
      id &&
      path.length === 5 &&
      ["publish", "start", "archive"].includes(path[4]) &&
      method === "POST"
    ) {
      const value = await input(contract.transitionInput, true);
      return {
        data:
          path[4] === "archive"
            ? await service.archivePath(
                actor,
                ws,
                id,
                value.expectedRevision,
                key(),
              )
            : await service.publishPath(
                actor,
                ws,
                id,
                value.expectedRevision,
                key(),
                path[4] === "start",
              ),
      };
    }
    if (id && path[4] === "versions" && path[5]) {
      const version = uuid.parse(path[5]);
      if (path.length === 6 && method === "GET")
        return { data: await service.readVersion(actor, ws, id, version) };
      if (path.length === 7 && path[6] === "export" && method === "GET") {
        const bytes = await service.exportVersion(actor, ws, id, version);
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="learning-path-${id}.zip"`,
            "Cache-Control": "no-store",
            "X-Request-ID": requestId,
          },
        });
      }
      if (path.length === 7 && path[6] === "assets" && method === "GET") {
        const name = new URL(request.url).searchParams.get("name") ?? "";
        const file = await service.readAsset(actor, ws, id, version, name);
        return new Response(new Uint8Array(file.bytes), {
          headers: {
            "Content-Type": file.mediaType,
            "Cache-Control": "no-store",
            "X-Request-ID": requestId,
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition":
              file.mediaType === "application/pdf"
                ? 'attachment; filename="reference.pdf"'
                : "inline",
            "Content-Security-Policy": "default-src 'none'; sandbox",
          },
        });
      }
    }
  }
  if (sub === "imports") {
    if (path.length === 3 && method === "POST") {
      if (
        request.headers.get("content-type")?.startsWith("multipart/form-data")
      ) {
        const bytes = await boundedBody(request, 20 * 1024 * 1024 + 65536);
        let form: FormData;
        try {
          form = await new Request(request.url, {
            method: "POST",
            headers: {
              "content-type": request.headers.get("content-type") ?? "",
            },
            body: new Uint8Array(bytes),
          }).formData();
        } catch {
          throw new DomainError("INVALID_JSON", 400);
        }
        if (
          [...form.keys()].some((k) => !["method", "file"].includes(k)) ||
          form.getAll("file").length !== 1 ||
          form.getAll("method").length !== 1
        )
          throw new DomainError("VALIDATION_ERROR", 422);
        const file = form.get("file"),
          mode = form.get("method");
        if (
          !(file instanceof File) ||
          !["loose", "structured"].includes(String(mode)) ||
          !/^.+\.(?:zip|md|markdown|txt)$/i.test(file.name)
        )
          throw new DomainError("VALIDATION_ERROR", 422);
        return {
          data: await service.createImport(
            actor,
            ws,
            mode as "loose" | "structured",
            Buffer.from(await file.arrayBuffer()),
            file.name,
            key(),
            /\.zip$/i.test(file.name),
          ),
        };
      }
      const value = await input(contract.importTextInput);
      return {
        data: await service.createImport(
          actor,
          ws,
          value.method,
          Buffer.from(value.text),
          value.filename,
          key(),
        ),
      };
    }
    if (id && path.length === 4 && method === "GET")
      return { data: await service.readImport(actor, ws, id) };
    if (id && path.length === 5 && path[4] === "confirm" && method === "POST")
      return {
        data: await service.confirmImport(
          actor,
          ws,
          id,
          await input(contract.confirmImportInput, true),
          key(),
        ),
      };
    if (id && path.length === 5 && path[4] === "cancel" && method === "POST")
      return {
        data: await service.cancelImport(
          actor,
          ws,
          id,
          (await input(contract.transitionInput, true)).expectedRevision,
          key(),
        ),
      };
  }
  throw new DomainError("NOT_FOUND", 404);
}
