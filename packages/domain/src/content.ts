import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import portableSchema from "../../../schemas/learning-path-draft.schema.json";
import {
  type Canonical,
  type ContentIssue,
  type ContentNode,
  childrenAllowed,
} from "../../contracts/src/content";
import { markdownLinks } from "./markdown";
import { DomainError } from "./workspaces/permissions";

const validateShape = new Ajv2020({ allErrors: true, strict: true }).compile(
  portableSchema,
);

export { childrenAllowed, newNode } from "../../contracts/src/content";
export class ContentError extends DomainError {
  constructor(
    public issues: ContentIssue[],
    code = "CONTENT_INVALID",
  ) {
    super(code, 422);
  }
}
export function safePackagePath(value: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  decoded = decoded.replaceAll("\\", "/").normalize("NFC");
  if (
    /^[/]|[\p{Cc}:*?"<>|#]/u.test(decoded) ||
    decoded.split("/").some((p) => !p || p === "." || p === "..") ||
    /[. ]$/.test(decoded)
  )
    return null;
  return decoded;
}
export function safeUrl(value: string): boolean {
  if (/^#[A-Za-z0-9_-]+$/.test(value)) return true;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !/[\p{Cc}\s\\]/u.test(value)
    );
  } catch {
    return value.startsWith("assets/") && safePackagePath(value) !== null;
  }
}
export function validateContent(
  input: unknown,
  options: {
    publish?: boolean;
    personal?: boolean;
    assets?: readonly string[];
  } = {},
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const json = JSON.stringify(input);
  if (!json || Buffer.byteLength(json) > 5 * 1024 * 1024)
    return [{ code: "CANDIDATE_TOO_LARGE", pointer: "" }];
  if (!validateShape(input))
    return (validateShape.errors ?? []).map((e) => ({
      code: "SCHEMA_INVALID",
      pointer:
        e.instancePath +
        (e.keyword === "required" ? `/${e.params.missingProperty}` : ""),
    }));
  const doc = input as Canonical;
  const byId = new Map<string, ContentNode>();
  const orders = new Set<string>();
  const add = (code: string, pointer: string) => issues.push({ code, pointer });
  doc.nodes.forEach((n, i) => {
    const p = `/nodes/${i}`;
    if (byId.has(n.id)) add("DUPLICATE_ID", `${p}/id`);
    byId.set(n.id, n);
    const key = `${n.parentId ?? ""}:${n.order}`;
    if (orders.has(key)) add("DUPLICATE_ORDER", `${p}/order`);
    orders.add(key);
    if (!n.title.trim()) add("EMPTY_TITLE", `${p}/title`);
    if (new Set(n.tags).size !== n.tags.length)
      add("DUPLICATE_TAG", `${p}/tags`);
  });
  if (!doc.title.trim()) add("EMPTY_TITLE", "/title");
  if (!/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(doc.language))
    add("INVALID_LANGUAGE", "/language");
  doc.nodes.forEach((n, i) => {
    const p = `/nodes/${i}`;
    const parent = n.parentId === null ? undefined : byId.get(n.parentId);
    if (n.parentId !== null && !parent) add("MISSING_PARENT", `${p}/parentId`);
    if (!childrenAllowed[parent?.kind ?? "root"].includes(n.kind))
      add("ILLEGAL_PARENT", `${p}/parentId`);
    const ancestors = new Set([n.id]);
    let current = parent;
    while (current) {
      if (ancestors.has(current.id)) {
        add("CYCLE", `${p}/parentId`);
        break;
      }
      ancestors.add(current.id);
      current =
        current.parentId === null ? undefined : byId.get(current.parentId);
    }
    const hasTasks = doc.nodes.some(
      (c) => c.parentId === n.id && ["task", "exercise"].includes(c.kind),
    );
    if (
      ["stage", "module", "resource"].includes(n.kind) &&
      n.completion !== null
    )
      add("INVALID_COMPLETION", `${p}/completion`);
    if (
      ["task", "exercise"].includes(n.kind) &&
      (!n.completion || n.completion.rule !== "self")
    )
      add("INVALID_COMPLETION", `${p}/completion`);
    if (n.kind === "project" && !n.completion)
      add("INVALID_COMPLETION", `${p}/completion`);
    if (
      n.kind === "lesson" &&
      (hasTasks ? n.completion !== null : n.completion?.rule === "approval")
    )
      add("INVALID_COMPLETION", `${p}/completion`);
    if (n.kind === "resource" ? !n.resourceUrl : n.resourceUrl !== null)
      add("INVALID_RESOURCE", `${p}/resourceUrl`);
    if (n.kind === "resource" && n.resourceUrl?.startsWith("#"))
      add("INVALID_RESOURCE", `${p}/resourceUrl`);
    const links = markdownLinks(n.body);
    if (n.resourceUrl)
      links.push({
        url: n.resourceUrl,
        line: 1,
        type: "link",
        start: 0,
        end: 0,
      });
    for (const link of links) {
      if (!safeUrl(link.url)) add("UNSAFE_URL", `${p}/body`);
      if (link.url.startsWith("#node-") && !byId.has(link.url.slice(6)))
        add("MISSING_NODE_LINK", `${p}/body`);
      if (
        link.url.startsWith("assets/") &&
        options.assets &&
        !options.assets.includes(link.url)
      )
        add("MISSING_ASSET", `${p}/body`);
    }
    if (
      options.personal &&
      options.publish &&
      n.completion?.rule === "approval"
    )
      add("PERSONAL_APPROVAL", `${p}/completion`);
  });
  for (const link of markdownLinks(doc.description))
    if (!safeUrl(link.url)) add("UNSAFE_URL", "/description");
  if (options.publish && !doc.nodes.some((n) => n.completion?.required))
    add("NO_REQUIRED_UNIT", "/nodes");
  return issues;
}
export function assertContent(
  input: unknown,
  options: Parameters<typeof validateContent>[1] = {},
): asserts input is Canonical {
  const issues = validateContent(input, options);
  if (issues.length) throw new ContentError(issues);
}
function sorted(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\r\n?/g, "\n");
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, sorted(v)]),
    );
  return value;
}
export function contentHash(doc: Canonical) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        sorted({
          ...doc,
          nodes: [...doc.nodes].sort((a, b) =>
            a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
          ),
        }),
      ),
    )
    .digest("hex");
}
