import { z } from "zod";
import * as content from "./content";
import * as c from "./foundation";

const models = {
  Organization: c.organization,
  Settings: c.settings,
  Invitation: c.invite,
  Membership: c.memberUpdate,
  Relationship: c.relation,
  AcceptInvitation: c.acceptInvite,
  Preferences: c.preferences,
  RevokeInvitation: c.revoke,
  CanonicalContent: content.canonicalSchema,
  CreatePath: content.createPathInput,
  SaveDraft: content.saveDraftInput,
  ContentTransition: content.transitionInput,
  ImportText: content.importTextInput,
  ConfirmImport: content.confirmImportInput,
};
const schema = (name: keyof typeof models) => ({
  $ref: `#/components/schemas/${name}`,
});
const ws = {
  name: "workspaceId",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const id = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const key = {
  name: "Idempotency-Key",
  in: "header",
  required: true,
  schema: {
    type: "string",
    minLength: 16,
    maxLength: 128,
    pattern: "^[a-zA-Z0-9_-]+$",
  },
};
function operation(
  summary: string,
  model?: keyof typeof models,
  params: unknown[] = [],
  paged = false,
) {
  return {
    summary,
    security: [{ cookieSession: [] }],
    parameters: [
      ...params,
      ...(paged
        ? [
            {
              name: "cursor",
              in: "query",
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 25,
              },
            },
          ]
        : []),
    ],
    ...(model
      ? {
          requestBody: {
            required: true,
            content: { "application/json": { schema: schema(model) } },
          },
        }
      : {}),
    responses: {
      "200": {
        description:
          "Authorized DTO in {data,requestId}; lists contain {items,nextCursor}.",
      },
      "401": { description: "Invalid or expired database session" },
      "403": { description: "Forbidden capability or untrusted Origin" },
      "404": { description: "Missing or invisible object" },
      "409": {
        description: "State, revision, uniqueness or idempotency conflict",
      },
      "422": { description: "Strict input/domain validation" },
      "428": { description: "Missing expectedRevision" },
      "429": { description: "Rate limit" },
      "500": { description: "Safe internal error; requestId for correlation" },
    },
  };
}
export function foundationOpenApi() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Learning Platform Foundation and Content API",
      version: "0.2.0",
      description:
        "All actors/roles are resolved from the current database session and membership. Mutations require exact trusted Origin and application/json. expectedRevision is required on state edits. Auth endpoints are managed by Better Auth separately.",
    },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        cookieSession: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description:
            "Better Auth cookie; production uses the __Secure- prefix. Database-backed and revocable.",
        },
      },
      schemas: Object.fromEntries(
        Object.entries(models).map(([name, value]) => [
          name,
          z.toJSONSchema(value, { io: "input" }),
        ]),
      ),
    },
    paths: {
      "/workspaces/{workspaceId}/paths": {
        get: operation(
          "Owner/manager private library, archived paths included",
          undefined,
          [ws],
          true,
        ),
        post: operation(
          "Create a schema-valid empty private draft",
          "CreatePath",
          [ws, key],
        ),
      },
      "/workspaces/{workspaceId}/paths/{id}/draft": {
        get: operation(
          "Read authorized private draft and immutable version metadata",
          undefined,
          [ws, id],
        ),
        put: operation(
          "Validate whole canonical candidate and CAS-replace the draft",
          "SaveDraft",
          [ws, id],
        ),
      },
      ...Object.fromEntries(
        ["publish", "start", "archive"].map((action) => [
          `/workspaces/{workspaceId}/paths/{id}/${action}`,
          {
            post: operation(
              action === "publish"
                ? "Validate, derive nodes/units and seal an immutable version"
                : action === "start"
                  ? "Personal-only atomic publication and unique version-pinned participation"
                  : "Archive path without changing any previous version",
              "ContentTransition",
              [ws, id, key],
            ),
          },
        ]),
      ),
      "/workspaces/{workspaceId}/paths/{id}/versions/{versionId}": {
        get: operation(
          "Read sealed snapshot; current membership and version enrollment scope required",
          undefined,
          [ws, id, { ...id, name: "versionId" }],
        ),
      },
      "/workspaces/{workspaceId}/paths/{id}/versions/{versionId}/export": {
        get: {
          ...operation(
            "Synchronous authorized immutable Markdown ZIP export (no progress/private learning data)",
            undefined,
            [ws, id, { ...id, name: "versionId" }],
          ),
          responses: {
            "200": {
              description: "ZIP download",
              content: {
                "application/zip": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            "404": { description: "Missing or invisible version" },
          },
        },
      },
      "/workspaces/{workspaceId}/paths/{id}/versions/{versionId}/assets": {
        get: {
          ...operation(
            "Current-authorized private asset proxy; no public/signed URL",
            undefined,
            [
              ws,
              id,
              { ...id, name: "versionId" },
              {
                name: "name",
                in: "query",
                required: true,
                schema: { type: "string" },
              },
            ],
          ),
          responses: {
            "200": {
              description:
                "Bound PNG/JPEG/WebP image or PDF download; no-store",
            },
            "404": { description: "Invisible or unbound asset" },
          },
        },
      },
      "/workspaces/{workspaceId}/imports": {
        post: {
          ...operation(
            "Synchronous bounded import proposal; no canonical draft/path until confirmation",
            "ImportText",
            [ws, key],
          ),
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: schema("ImportText") },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["method", "file"],
                  properties: {
                    method: { type: "string", enum: ["loose", "structured"] },
                    file: {
                      type: "string",
                      format: "binary",
                      description:
                        "One UTF-8 Markdown/text file up to 2 MiB or ZIP up to 20 MiB",
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/workspaces/{workspaceId}/imports/{id}": {
        get: operation(
          "Own import preview; workspace owner can also read it; source expires after 30 days",
          undefined,
          [ws, id],
        ),
      },
      "/workspaces/{workspaceId}/imports/{id}/confirm": {
        post: operation(
          "Revalidate reviewed canonical input, acknowledge warnings and create one private draft",
          "ConfirmImport",
          [ws, id, key],
        ),
      },
      "/workspaces/{workspaceId}/imports/{id}/cancel": {
        post: operation(
          "Cancel preview with revision; cannot confirm afterwards",
          "ContentTransition",
          [ws, id, key],
        ),
      },
      "/workspaces": {
        get: operation(
          "List current active workspaces (also ensures verified personal onboarding)",
        ),
        post: operation("Create organization and owner", "Organization", [key]),
      },
      "/me/preferences": {
        patch: operation("Update only own allowlisted language", "Preferences"),
      },
      "/invitations/accept": {
        post: operation(
          "Atomically accept matching verified recipient invitation; repeat by same active recipient returns membership",
          "AcceptInvitation",
        ),
      },
      "/workspaces/{workspaceId}": {
        get: operation("Read current active workspace", undefined, [ws]),
      },
      "/workspaces/{workspaceId}/settings": {
        patch: operation("Owner settings with current revision", "Settings", [
          ws,
        ]),
      },
      "/workspaces/{workspaceId}/members": {
        get: operation(
          "Owner members or manager self/managed learners",
          undefined,
          [ws],
          true,
        ),
      },
      "/workspaces/{workspaceId}/members/{id}": {
        patch: operation(
          "Owner role/status update; protect last owner",
          "Membership",
          [ws, id],
        ),
      },
      "/workspaces/{workspaceId}/invitations": {
        get: operation(
          "Owner invitations or manager own invitations",
          undefined,
          [ws],
          true,
        ),
        post: operation(
          "Create grant-authorized invitation and encrypted email delivery",
          "Invitation",
          [ws, key],
        ),
      },
      "/workspaces/{workspaceId}/invitations/{id}/revoke": {
        post: operation(
          "Owner or authorized issuer revokes a pending invitation",
          "RevokeInvitation",
          [ws, id, key],
        ),
      },
      "/workspaces/{workspaceId}/manager-learners": {
        get: operation(
          "Owner pairs or current manager own pairs",
          undefined,
          [ws],
          true,
        ),
        post: operation(
          "Owner creates explicit active manager/learner pair",
          "Relationship",
          [ws, key],
        ),
      },
      "/workspaces/{workspaceId}/manager-learners/{id}": {
        delete: operation("Owner removes explicit pair", undefined, [ws, id]),
      },
    },
  };
}
