import { z } from "zod";
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
      title: "Learning Platform Foundation API",
      version: "0.1.0",
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
