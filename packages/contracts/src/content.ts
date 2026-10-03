import { z } from "zod";

export const kinds = [
  "stage",
  "module",
  "lesson",
  "task",
  "exercise",
  "project",
  "resource",
] as const;
export const logicalId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/);
export const completionSchema = z.strictObject({
  required: z.boolean(),
  rule: z.enum(["self", "approval"]),
});
export const nodeSchema = z.strictObject({
  id: logicalId,
  kind: z.enum(kinds),
  parentId: logicalId.nullable(),
  order: z.number().int().min(0).max(1000000),
  title: z.string().min(1).max(200),
  body: z.string().max(200000),
  estimatedMinutes: z.number().int().min(1).max(100000).nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
  tags: z.array(z.string().min(1).max(50)).max(20),
  completion: completionSchema.nullable(),
  resourceUrl: z.string().min(1).max(2048).nullable(),
});
export const canonicalSchema = z.strictObject({
  schemaVersion: z.literal("1.0"),
  title: z.string().min(1).max(200),
  description: z.string().max(10000),
  language: z.string().min(2).max(35),
  nodes: z.array(nodeSchema).max(1000),
});
export type ContentNode = z.infer<typeof nodeSchema>;
export type Canonical = z.infer<typeof canonicalSchema>;
export type Kind = ContentNode["kind"];
export const childrenAllowed: Record<Kind | "root", readonly Kind[]> = {
  root: ["stage", "module", "lesson", "project", "resource"],
  stage: ["module", "lesson", "project", "resource"],
  module: ["lesson", "project", "resource"],
  lesson: ["task", "exercise", "resource"],
  task: [],
  exercise: [],
  project: [],
  resource: [],
};
export function newNode(
  kind: Kind,
  id: string,
  title: string,
  parentId: string | null,
  order: number,
): ContentNode {
  return {
    id,
    kind,
    title,
    parentId,
    order,
    body: "",
    estimatedMinutes: null,
    difficulty: null,
    tags: [],
    completion: ["task", "exercise", "project"].includes(kind)
      ? { required: true, rule: "self" }
      : null,
    resourceUrl: null,
  };
}
export interface ContentIssue {
  code: string;
  pointer: string;
  file?: string;
  line?: number;
}
export interface SourceSpan {
  pointer: string;
  file: string;
  startLine: number;
  endLine: number;
  classification: "extracted" | "inferred";
}
export const createPathInput = z.strictObject({
  title: z.string().trim().min(1).max(200),
  language: z.string().min(2).max(35),
});
export const saveDraftInput = z.strictObject({
  canonical: canonicalSchema,
  expectedRevision: z.number().int().positive(),
});
export const transitionInput = z.strictObject({
  expectedRevision: z.number().int().positive(),
});
export const importTextInput = z.strictObject({
  method: z.enum(["loose", "structured"]),
  text: z.string().max(2097152),
  filename: z.string().max(200).default("README.md"),
});
export const confirmImportInput = z.strictObject({
  canonical: canonicalSchema,
  expectedRevision: z.number().int().positive(),
  acknowledgeWarnings: z.boolean(),
});
export const exportInput = z.strictObject({ versionId: z.uuid() });
export interface DraftDto {
  id: string;
  canonical: Canonical;
  revision: number;
  archived: boolean;
  publishedVersionId: string | null;
  versions: { id: string; number: number; publishedAt: string; hash: string }[];
  assets: string[];
}
export interface ImportDto {
  id: string;
  revision: number;
  method: string;
  state: "preview" | "confirmed" | "cancelled";
  canonical: Canonical | null;
  warnings: ContentIssue[];
  errors: ContentIssue[];
  provenance: SourceSpan[];
  source: {
    filename: string;
    text: string | null;
    bytes: number;
    sha256: string;
  }[];
  confirmedPathId: string | null;
}
