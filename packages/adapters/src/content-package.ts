import { createHash } from "node:crypto";
import { posix } from "node:path";
import { TextDecoder } from "node:util";
import type { RootContent } from "mdast";
import {
  isAlias,
  isNode,
  parseAllDocuments,
  stringify,
  visit as visitYaml,
} from "yaml";
import { fromBuffer, type ZipFile } from "yauzl";
import { ZipFile as ZipWriter } from "yazl";
import type {
  Canonical,
  ContentIssue,
  ContentNode,
  SourceSpan,
} from "../../contracts/src/content";
import { canonicalSchema } from "../../contracts/src/content";
import {
  ContentError,
  newNode,
  safePackagePath,
  validateContent,
} from "../../domain/src/content";
import {
  markdownLinks,
  markdownTree,
  rewriteMarkdown,
} from "../../domain/src/markdown";

export interface PackageFile {
  name: string;
  bytes: Buffer;
}
export interface Asset {
  name: string;
  bytes: Buffer;
  mediaType: string;
}
export interface Proposal {
  method: "loose" | "structured";
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
  assets: Asset[];
}
function fail(code: string, file?: string): never {
  throw new ContentError([{ code, pointer: "", file }], "IMPORT_INVALID");
}
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
function decode(file: PackageFile) {
  if (file.bytes.length > 2 * 1024 * 1024) fail("TEXT_TOO_LARGE", file.name);
  try {
    return new TextDecoder("utf-8", { fatal: true })
      .decode(file.bytes)
      .replace(/\r\n?/g, "\n");
  } catch {
    return fail("INVALID_ENCODING", file.name);
  }
}
function strictYaml(text: string, file: string): unknown {
  const docs = parseAllDocuments(text, {
    uniqueKeys: true,
    version: "1.2",
    strict: true,
  });
  if (docs.length !== 1 || docs[0].errors.length || docs[0].warnings.length)
    fail("YAML_INVALID", file);
  visitYaml(docs[0], (_key, node) => {
    if (isAlias(node) || (isNode(node) && (node.anchor || node.tag)))
      fail("YAML_FEATURE_UNSUPPORTED", file);
  });
  return docs[0].toJS({ maxAliasCount: 0 });
}
export async function readArchive(bytes: Buffer): Promise<PackageFile[]> {
  if (bytes.length > 20 * 1024 * 1024) fail("ARCHIVE_TOO_LARGE");
  return new Promise((resolve, reject) => {
    let zip: ZipFile | undefined;
    let total = 0,
      count = 0;
    const names = new Set<string>(),
      files: PackageFile[] = [];
    const error = (e: unknown) => {
      zip?.close();
      reject(
        e instanceof ContentError
          ? e
          : new ContentError(
              [{ code: "ARCHIVE_INVALID", pointer: "" }],
              "IMPORT_INVALID",
            ),
      );
    };
    fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: false },
      (err, opened) => {
        if (err || !opened) return error(err);
        zip = opened;
        zip.on("error", error);
        zip.on("end", () => resolve(files));
        zip.on("entry", (entry) => {
          try {
            if (++count > 500) fail("TOO_MANY_FILES");
            const directory = entry.fileName.endsWith("/");
            const name = safePackagePath(
              directory ? entry.fileName.slice(0, -1) : entry.fileName,
            );
            if (!name || names.has(name.toLowerCase()))
              fail("UNSAFE_PATH", entry.fileName);
            names.add(name.toLowerCase());
            const mode = (entry.externalFileAttributes >>> 16) & 0xf000;
            if (mode && mode !== 0x8000 && mode !== 0x4000)
              fail("ARCHIVE_LINK", name);
            if (entry.generalPurposeBitFlag & 1)
              fail("ARCHIVE_ENCRYPTED", name);
            if (directory) {
              zip?.readEntry();
              return;
            }
            if (/\.(?:zip|gz|tar|7z|rar)$/i.test(name))
              fail("NESTED_ARCHIVE", name);
            if (
              entry.uncompressedSize > 10 * 1024 * 1024 ||
              entry.uncompressedSize / Math.max(entry.compressedSize, 1) > 200
            )
              fail("DECOMPRESSION_LIMIT", name);
            zip?.openReadStream(entry, (streamError, stream) => {
              if (streamError || !stream) return error(streamError);
              const chunks: Buffer[] = [];
              let size = 0;
              stream.on("error", error);
              stream.on("data", (chunk: Buffer) => {
                size += chunk.length;
                total += chunk.length;
                if (size > 10 * 1024 * 1024 || total > 50 * 1024 * 1024) {
                  stream.destroy();
                  error(
                    new ContentError(
                      [
                        {
                          code: "DECOMPRESSION_LIMIT",
                          pointer: "",
                          file: name,
                        },
                      ],
                      "IMPORT_INVALID",
                    ),
                  );
                  return;
                }
                chunks.push(chunk);
              });
              stream.on("end", () => {
                const data = Buffer.concat(chunks);
                if (data.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4])))
                  return error(
                    new ContentError(
                      [{ code: "NESTED_ARCHIVE", pointer: "", file: name }],
                      "IMPORT_INVALID",
                    ),
                  );
                files.push({ name, bytes: data });
                zip?.readEntry();
              });
            });
          } catch (e) {
            error(e);
          }
        });
        zip.readEntry();
      },
    );
  });
}
function assetType(file: PackageFile): string | null {
  const b = file.bytes;
  if (
    /\.png$/i.test(file.name) &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    /\.jpe?g$/i.test(file.name) &&
    b[0] === 255 &&
    b[1] === 216 &&
    b[2] === 255
  )
    return "image/jpeg";
  if (
    /\.webp$/i.test(file.name) &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (/\.pdf$/i.test(file.name) && b.toString("ascii", 0, 5) === "%PDF-")
    return "application/pdf";
  return null;
}
export function propose(
  files: PackageFile[],
  method: "loose" | "structured",
): Proposal {
  const proposal: Proposal = {
    method,
    canonical: null,
    warnings: [],
    errors: [],
    provenance: [],
    source: [],
    assets: [],
  };
  const normalized: PackageFile[] = [];
  const names = new Set<string>();
  for (const f of files) {
    const name = safePackagePath(f.name);
    if (!name || names.has(name.toLowerCase())) fail("UNSAFE_PATH", f.name);
    names.add(name.toLowerCase());
    normalized.push({ ...f, name });
    const isText = /\.(?:md|markdown|txt|ya?ml|json)$/i.test(name);
    proposal.source.push({
      filename: name,
      text: isText ? decode({ ...f, name }) : null,
      bytes: f.bytes.length,
      sha256: sha(f.bytes),
    });
  }
  if (!normalized.length || normalized.length > 500) fail("TOO_MANY_FILES");
  const assetMap = new Map<string, string>();
  for (const f of normalized) {
    const type = assetType(f);
    if (type) {
      if (f.bytes.length > (type === "application/pdf" ? 10 : 5) * 1024 * 1024)
        fail("ASSET_TOO_LARGE", f.name);
      const name = `assets/${sha(f.bytes)}${posix.extname(f.name).toLowerCase()}`;
      assetMap.set(f.name, name);
      if (!proposal.assets.some((a) => a.name === name))
        proposal.assets.push({ name, bytes: f.bytes, mediaType: type });
    } else if (!/\.(?:md|markdown|txt|ya?ml|json)$/i.test(f.name))
      proposal.warnings.push({
        code: "UNSUPPORTED_FILE",
        pointer: "",
        file: f.name,
      });
  }
  if (method === "structured") structured(normalized, proposal, assetMap);
  else loose(normalized, proposal);
  if (proposal.canonical) {
    proposal.errors.push(
      ...validateContent(proposal.canonical, {
        assets: proposal.assets.map((a) => a.name),
      }),
    );
    for (const n of proposal.canonical.nodes) {
      if (n.estimatedMinutes === null)
        proposal.warnings.push({
          code: "UNKNOWN_ESTIMATE",
          pointer: `/nodes/${proposal.canonical.nodes.indexOf(n)}/estimatedMinutes`,
        });
      for (const l of markdownLinks(n.body))
        if (l.url.startsWith("https:"))
          proposal.warnings.push({
            code: "UNVERIFIED_LINK",
            pointer: `/nodes/${proposal.canonical.nodes.indexOf(n)}/body`,
            line: l.line,
          });
    }
  }
  return proposal;
}
function structured(
  files: PackageFile[],
  p: Proposal,
  assetMap: Map<string, string>,
) {
  const candidates = files.filter((f) =>
    /^(?:[^/]+\/)?roadmap\.yml$/.test(f.name),
  );
  let value: unknown;
  const bodies = new Map<string, string>();
  const fileById = new Map<string, string>();
  const used = new Set<string>();
  let root = "";
  if (candidates.length > 1) fail("MULTIPLE_MANIFESTS");
  if (candidates.length === 1) {
    const manifest = candidates[0];
    root =
      posix.dirname(manifest.name) === "."
        ? ""
        : `${posix.dirname(manifest.name)}/`;
    value = strictYaml(decode(manifest), manifest.name);
    if (
      !value ||
      typeof value !== "object" ||
      !Array.isArray((value as { nodes?: unknown }).nodes)
    )
      fail("SCHEMA_INVALID", manifest.name);
    const doc = value as Record<string, unknown> & { nodes: unknown[] };
    const mapped = doc.nodes.map((raw, i) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        fail("SCHEMA_INVALID", manifest.name);
      const record = raw as Record<string, unknown>;
      const { file, ...node } = record;
      if (typeof file !== "string" || !safePackagePath(file) || "body" in node)
        fail("SCHEMA_INVALID", manifest.name);
      const full = root + safePackagePath(file);
      if (used.has(full)) fail("SHARED_BODY_FILE", full);
      const bodyFile = files.find(
        (f) => f.name === full && /\.md$/i.test(f.name),
      );
      if (!bodyFile) fail("MISSING_BODY_FILE", full);
      used.add(full);
      const body = decode(bodyFile);
      if (typeof node.id === "string") {
        bodies.set(node.id, body);
        fileById.set(node.id, full);
      }
      p.provenance.push({
        pointer: `/nodes/${i}`,
        file: full,
        startLine: 1,
        endLine: body.split("\n").length,
        classification: "extracted",
      });
      return { ...node, body };
    });
    value = { ...doc, nodes: mapped };
    used.add(manifest.name);
  } else {
    const md = files.filter((f) => /\.md$/i.test(f.name));
    if (md.length !== 1) fail("MANIFEST_REQUIRED");
    const text = decode(md[0]);
    const front = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!front) fail("MANIFEST_REQUIRED", md[0].name);
    value = strictYaml(front[1], md[0].name);
    used.add(md[0].name);
    if (
      value &&
      typeof value === "object" &&
      Array.isArray((value as Canonical).nodes)
    )
      (value as Canonical).nodes.forEach((n, i) => {
        fileById.set(n.id, md[0].name);
        p.provenance.push({
          pointer: `/nodes/${i}`,
          file: md[0].name,
          startLine: 2,
          endLine: front[1].split("\n").length + 1,
          classification: "extracted",
        });
      });
  }
  const shape = canonicalSchema.safeParse(value);
  if (!shape.success) {
    p.errors.push({ code: "SCHEMA_INVALID", pointer: "" });
    return;
  }
  p.canonical = shape.data;
  const idByFile = new Map([...fileById].map(([id, file]) => [file, id]));
  function resolve(url: string, file: string) {
    if (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) ||
      url.startsWith("#") ||
      url.startsWith("//")
    )
      return url;
    const pathPart = url.split("#")[0];
    let path: string;
    try {
      path = decodeURIComponent(pathPart)
        .replaceAll("\\", "/")
        .normalize("NFC");
    } catch {
      path = "";
    }
    if (!path || /^[/]|[\p{Cc}:*?"<>|]/u.test(path)) {
      p.errors.push({ code: "UNSAFE_PATH", pointer: "", file });
      return url;
    }
    const resolved = posix.normalize(posix.join(posix.dirname(file), path));
    if (resolved.startsWith("../") || resolved === "..") {
      p.errors.push({ code: "UNSAFE_PATH", pointer: "", file });
      return url;
    }
    if (root && !resolved.startsWith(root)) {
      p.errors.push({ code: "UNSAFE_PATH", pointer: "", file });
      return url;
    }
    if (idByFile.has(resolved)) return `#node-${idByFile.get(resolved)}`;
    if (assetMap.has(resolved)) return assetMap.get(resolved) ?? url;
    if (url.startsWith("assets/") && p.assets.some((a) => a.name === url))
      return url;
    p.errors.push({ code: "UNRESOLVED_LINK", pointer: "", file });
    return url;
  }
  for (const n of p.canonical.nodes) {
    const file = fileById.get(n.id) ?? "README.md";
    n.body = rewriteMarkdown(n.body, (url) => resolve(url, file));
    if (n.resourceUrl) n.resourceUrl = resolve(n.resourceUrl, file);
  }
  p.canonical.description = rewriteMarkdown(p.canonical.description, (url) =>
    resolve(url, `${root}README.md`),
  );
  for (const f of files)
    if (
      /\.md$/i.test(f.name) &&
      !used.has(f.name) &&
      f.name !== `${root}README.md`
    )
      p.warnings.push({ code: "UNLISTED_MARKDOWN", pointer: "", file: f.name });
}
function textOf(node: RootContent): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node)
    return node.children.map((c) => textOf(c as RootContent)).join("");
  return "";
}
function loose(files: PackageFile[], p: Proposal) {
  const nodes: ContentNode[] = [];
  const doc: Canonical = {
    schemaVersion: "1.0",
    title: "Learning path",
    description: "",
    language: "en",
    nodes,
  };
  const contentFiles = files.filter((f) =>
    /\.(?:md|markdown|txt)$/i.test(f.name),
  );
  if (!contentFiles.length) fail("NO_TEXT_SOURCE");
  for (const file of contentFiles) {
    const source = decode(file),
      tree = markdownTree(source);
    if (/[\u0600-\u06ff]/.test(source)) doc.language = "fa";
    if (source.startsWith("---\n"))
      p.warnings.push({ code: "LOOSE_METADATA", pointer: "", file: file.name });
    let stage: ContentNode | undefined,
      module: ContentNode | undefined,
      current: ContentNode | undefined;
    let containerId: string | null = null;
    const add = (
      kind: ContentNode["kind"],
      title: string,
      parentId: string | null,
      start: number,
      end: number,
    ) => {
      const n = newNode(
        kind,
        `import-${nodes.length + 1}`,
        title.slice(0, 200) || file.name,
        parentId,
        nodes.filter((x) => x.parentId === parentId).length,
      );
      nodes.push(n);
      p.provenance.push({
        pointer: `/nodes/${nodes.length - 1}`,
        file: file.name,
        startLine: start,
        endLine: end,
        classification: kind === "task" ? "extracted" : "inferred",
      });
      return n;
    };
    for (const item of tree.children) {
      const start = item.position?.start.line ?? 1,
        end = item.position?.end.line ?? start;
      if (item.type === "heading") {
        const title = textOf(item);
        if (item.depth === 1 && doc.title === "Learning path") {
          doc.title = title.slice(0, 200);
          current = add("lesson", title, null, start, end);
          continue;
        }
        const project = /^(?:projects?\b|پروژه)/i.test(title);
        const exercise = /^(?:exercises?|practice)\b|^تمرین/i.test(title);
        if (project) {
          current = add(
            "project",
            title,
            module?.id ?? stage?.id ?? null,
            start,
            end,
          );
          containerId = current.parentId;
        } else if (item.depth === 2) {
          stage = add("stage", title, null, start, end);
          module = undefined;
          current = undefined;
          containerId = stage.id;
        } else if (item.depth === 3 && !exercise) {
          module = add("module", title, stage?.id ?? null, start, end);
          current = undefined;
          containerId = module.id;
        } else {
          current = add(
            "lesson",
            title,
            module?.id ?? stage?.id ?? null,
            start,
            end,
          );
          containerId = current.parentId;
        }
        p.warnings.push({
          code: "INFERRED_STRUCTURE",
          pointer: `/nodes/${nodes.length - 1}`,
          file: file.name,
          line: start,
        });
        continue;
      }
      if (!current)
        current = add(
          "lesson",
          file.name.replace(/\.[^.]+$/, ""),
          containerId,
          start,
          end,
        );
      const raw = source.slice(
        item.position?.start.offset ?? 0,
        item.position?.end.offset ?? source.length,
      );
      if (item.type === "html")
        p.warnings.push({
          code: "RAW_HTML",
          pointer: `/nodes/${nodes.indexOf(current)}/body`,
          file: file.name,
          line: start,
        });
      current.body += (current.body ? "\n\n" : "") + raw;
      if (item.type === "list")
        for (const listItem of item.children)
          if (typeof listItem.checked === "boolean") {
            if (current.kind !== "lesson") {
              p.warnings.push({
                code: "DESCRIPTIVE_CHECKLIST",
                pointer: `/nodes/${nodes.indexOf(current)}/body`,
                file: file.name,
                line: start,
              });
              continue;
            }
            const task = add(
              "task",
              textOf(listItem as RootContent).trim(),
              current.id,
              listItem.position?.start.line ?? start,
              listItem.position?.end.line ?? end,
            );
            task.body = source.slice(
              listItem.position?.start.offset ?? 0,
              listItem.position?.end.offset ?? 0,
            );
            if (listItem.checked)
              p.warnings.push({
                code: "CHECKED_SOURCE_ONLY",
                pointer: `/nodes/${nodes.indexOf(task)}`,
                file: file.name,
                line: listItem.position?.start.line,
              });
          }
    }
  }
  const shape = canonicalSchema.safeParse(doc);
  if (shape.success) p.canonical = shape.data;
  else p.errors.push({ code: "SCHEMA_INVALID", pointer: "" });
}
function exportPath(n: ContentNode) {
  const slug =
    n.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || n.kind;
  return `${n.kind}s/${slug}--${n.id}.md`;
}
export async function exportPackage(doc: Canonical, assets: Asset[] = []) {
  const paths = new Map(doc.nodes.map((n) => [n.id, exportPath(n)]));
  const rewrite = (url: string, file: string) => {
    if (url.startsWith("#node-")) {
      const target = paths.get(url.slice(6));
      if (target) return posix.relative(posix.dirname(file), target);
    }
    if (url.startsWith("assets/"))
      return posix.relative(posix.dirname(file), url);
    return url;
  };
  const manifest = {
    ...doc,
    description: rewriteMarkdown(doc.description, (url) =>
      rewrite(url, "README.md"),
    ),
    nodes: doc.nodes.map((n) => {
      const { body, ...meta } = n;
      const file = exportPath(n);
      return {
        ...meta,
        resourceUrl: n.resourceUrl ? rewrite(n.resourceUrl, file) : null,
        file,
      };
    }),
  };
  const zip = new ZipWriter();
  zip.addBuffer(
    Buffer.from(
      `# ${doc.title}\n\n${rewriteMarkdown(doc.description, (url) => rewrite(url, "README.md"))}\n\n${doc.nodes
        .filter((n) => n.parentId === null)
        .sort((a, b) => a.order - b.order)
        .map(
          (n) =>
            `- [${n.title.replaceAll("[", "\\[").replaceAll("]", "\\]")}](${exportPath(n)})`,
        )
        .join("\n")}\n`,
    ),
    "README.md",
  );
  zip.addBuffer(
    Buffer.from(stringify(manifest, { aliasDuplicateObjects: false })),
    "roadmap.yml",
  );
  for (const n of doc.nodes)
    zip.addBuffer(
      Buffer.from(
        rewriteMarkdown(n.body, (url) => rewrite(url, exportPath(n))),
      ),
      exportPath(n),
    );
  for (const a of assets) zip.addBuffer(a.bytes, a.name);
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    zip.outputStream.on("data", (b) => chunks.push(b));
    zip.outputStream.on("error", reject);
    zip.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  zip.end();
  return complete;
}
