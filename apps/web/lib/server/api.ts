import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { sessionActor } from "../../../../packages/application/src/auth";
import * as service from "../../../../packages/application/src/workspaces";
import * as contract from "../../../../packages/contracts/src/foundation";
import { translateError } from "../../../../packages/contracts/src/locales";
import { DomainError } from "../../../../packages/domain/src/workspaces/permissions";

const parse = async (request: Request) => {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16384) throw new DomainError("BODY_TOO_LARGE", 413);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 16384)
    throw new DomainError("BODY_TOO_LARGE", 413);
  try {
    const input: unknown = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new DomainError("VALIDATION_ERROR", 422);
    return input as Record<string, unknown>;
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError("INVALID_JSON", 400);
  }
};
function key(request: Request) {
  return contract.idempotencyKey.parse(request.headers.get("idempotency-key"));
}
export async function handleApi(request: Request) {
  const requestId = randomUUID();
  const locale =
    request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)locale=(fa|en)(?:;|$)/)?.[1] === "fa"
      ? "fa"
      : "en";
  const json = (body: unknown, status = 200) =>
    Response.json(
      { ...(body as object), requestId },
      {
        status,
        headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
      },
    );
  try {
    const url = new URL(request.url);
    const path = url.pathname.slice("/api/v1/".length).split("/");
    const method = request.method;
    if (method !== "GET") {
      const expected = new URL(process.env.APP_URL ?? "").origin;
      if (request.headers.get("origin") !== expected)
        throw new DomainError("UNTRUSTED_ORIGIN", 403);
      if (
        method !== "DELETE" &&
        !request.headers.get("content-type")?.startsWith("application/json")
      )
        throw new DomainError("INVALID_JSON", 400);
    }
    const actor = await sessionActor(request.headers);
    if (!actor) throw new DomainError("UNAUTHENTICATED", 401);
    if (!actor.emailVerified) throw new DomainError("EMAIL_NOT_VERIFIED", 403);
    let data: unknown;
    if (path.join("/") === "me/preferences" && method === "PATCH") {
      const input = contract.preferences.parse(await parse(request));
      data = await service.updatePreference(actor, input.preferredLocale);
    } else if (path.join("/") === "invitations/accept" && method === "POST") {
      data = await service.acceptInvitation(
        actor,
        contract.acceptInvite.parse(await parse(request)).token,
      );
    } else if (path[0] === "workspaces") {
      if (path.length === 1 && method === "GET")
        data = { items: await service.listWorkspaces(actor), nextCursor: null };
      else if (path.length === 1 && method === "POST") {
        const input = contract.organization.parse(await parse(request));
        data = await service.createOrganization(actor, input, key(request));
      } else {
        const ws = contract.uuid.parse(path[1]);
        const sub = path[2];
        const id = path[3] ? contract.uuid.parse(path[3]) : undefined;
        if (path.length === 2 && method === "GET")
          data = await service.readWorkspace(actor, ws);
        else if (
          path.length === 3 &&
          sub === "settings" &&
          method === "PATCH"
        ) {
          const input = await parse(request);
          if (!("expectedRevision" in input))
            throw new DomainError("PRECONDITION_REQUIRED", 428);
          data = await service.updateSettings(
            actor,
            ws,
            contract.settings.parse(input),
          );
        } else if (path.length === 3 && sub === "members" && method === "GET") {
          const q = contract.listQuery.parse(
            Object.fromEntries(url.searchParams),
          );
          data = await service.listMembers(actor, ws, q.cursor, q.limit);
        } else if (
          path.length === 4 &&
          sub === "members" &&
          id &&
          method === "PATCH"
        ) {
          const input = await parse(request);
          if (!("expectedRevision" in input))
            throw new DomainError("PRECONDITION_REQUIRED", 428);
          data = await service.updateMember(
            actor,
            ws,
            id,
            contract.memberUpdate.parse(input),
          );
        } else if (
          path.length === 3 &&
          sub === "invitations" &&
          method === "GET"
        ) {
          const q = contract.listQuery.parse(
            Object.fromEntries(url.searchParams),
          );
          data = await service.listInvitations(actor, ws, q.cursor, q.limit);
        } else if (
          path.length === 3 &&
          sub === "invitations" &&
          method === "POST"
        )
          data = await service.createInvitation(
            actor,
            ws,
            contract.invite.parse(await parse(request)),
            key(request),
          );
        else if (
          path.length === 5 &&
          sub === "invitations" &&
          id &&
          path[4] === "revoke" &&
          method === "POST"
        ) {
          const input = await parse(request);
          if (!("expectedRevision" in input))
            throw new DomainError("PRECONDITION_REQUIRED", 428);
          data = await service.revokeInvitation(
            actor,
            ws,
            id,
            contract.revoke.parse(input).expectedRevision,
            key(request),
          );
        } else if (
          path.length === 3 &&
          sub === "manager-learners" &&
          method === "GET"
        ) {
          const q = contract.listQuery.parse(
            Object.fromEntries(url.searchParams),
          );
          data = await service.listRelationships(actor, ws, q.cursor, q.limit);
        } else if (
          path.length === 3 &&
          sub === "manager-learners" &&
          method === "POST"
        )
          data = await service.addRelationship(
            actor,
            ws,
            contract.relation.parse(await parse(request)),
            key(request),
          );
        else if (
          path.length === 4 &&
          sub === "manager-learners" &&
          id &&
          method === "DELETE"
        )
          data = await service.removeRelationship(actor, ws, id);
        else throw new DomainError("NOT_FOUND", 404);
      }
    } else throw new DomainError("NOT_FOUND", 404);
    return json({ data });
  } catch (error) {
    let code = "INTERNAL_ERROR",
      status = 500;
    if (error instanceof DomainError) {
      code = error.code;
      status = error.status;
    } else if (error instanceof ZodError) {
      code = "VALIDATION_ERROR";
      status = 422;
    } else if (typeof error === "object" && error && "code" in error) {
      const dbCode = String(error.code);
      if (dbCode === "23505") {
        code = "CONFLICT";
        status = 409;
      }
      if (dbCode === "P0002") {
        code = "IDEMPOTENCY_CONFLICT";
        status = 409;
      }
    }
    if (status === 500)
      console.error(JSON.stringify({ event: "api_failure", requestId }));
    return json(
      { error: { code, message: translateError(locale, code) } },
      status,
    );
  }
}
