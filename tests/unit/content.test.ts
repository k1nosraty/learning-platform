import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { ZipFile } from "yazl";
import {
  exportPackage,
  type PackageFile,
  propose,
  readArchive,
} from "../../packages/adapters/src/content-package";
import {
  type Canonical,
  canonicalSchema,
  newNode,
} from "../../packages/contracts/src/content";
import {
  contentCatalogs,
  contentIssues,
} from "../../packages/contracts/src/content-locales";
import {
  assertContent,
  ContentError,
  contentHash,
  safePackagePath,
  validateContent,
} from "../../packages/domain/src/content";
import { rewriteMarkdown } from "../../packages/domain/src/markdown";

async function fixture(name: string) {
  const root = join("examples", name),
    files: PackageFile[] = [];
  async function walk(dir: string) {
    for (const entry of await readdir(join(root, dir), {
      withFileTypes: true,
    })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else
        files.push({
          name: path.replaceAll("\\", "/"),
          bytes: await readFile(join(root, path)),
        });
    }
  }
  await walk("");
  return files;
}
const simple = (): Canonical => ({
  schemaVersion: "1.0",
  title: "Test",
  description: "",
  language: "en",
  nodes: [
    {
      ...newNode("lesson", "intro", "Intro", null, 0),
      body: "# Learn\n\nDescribe DNS.",
      completion: { required: true, rule: "self" },
    },
  ],
});
async function zip(files: { name: string; bytes: Buffer; mode?: number }[]) {
  const archive = new ZipFile();
  for (const f of files)
    archive.addBuffer(f.bytes, f.name, { mode: f.mode ?? 0o100644 });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    archive.outputStream.on("data", (b) => chunks.push(b));
    archive.outputStream.on("error", reject);
    archive.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  archive.end();
  return done;
}
const fails = (code: string) => (e: unknown) =>
  e instanceof ContentError && e.issues.some((i) => i.code === code);

test("content 1.0 schema and all healthy fixtures share one canonical validator and lossless ZIP round-trip", async () => {
  for (const name of ["sample-learning-path", "nontechnical-onboarding"]) {
    const files = await fixture(name),
      expected = JSON.parse(
        (
          files.find((f) => f.name === "canonical.expected.json")?.bytes ??
          Buffer.from("null")
        ).toString(),
      ) as Canonical;
    assertContent(expected);
    assert.deepEqual(canonicalSchema.parse(expected), expected);
    const preview = propose(files, "structured");
    assert.deepEqual(preview.errors, []);
    assert.deepEqual(preview.canonical, expected);
    if (name === "sample-learning-path")
      assert.deepEqual(
        propose(
          files.filter((f) => f.name === "single-file.md"),
          "structured",
        ).canonical,
        expected,
      );
    const exported = await exportPackage(expected),
      parsed = propose(await readArchive(exported), "structured");
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.canonical, expected);
    assert.equal(
      contentHash(parsed.canonical as Canonical),
      contentHash(expected),
    );
  }
});
test("hierarchy, unique identity/order, schema version, links and completion rules block invalid content", () => {
  const doc = simple();
  assert.deepEqual(validateContent(doc, { publish: true, personal: true }), []);
  const mutate = (change: (d: Canonical) => void, code: string) => {
    const d = structuredClone(doc);
    change(d);
    assert.ok(validateContent(d).some((i) => i.code === code));
  };
  mutate((d) => d.nodes.push({ ...d.nodes[0] }), "DUPLICATE_ID");
  mutate(
    (d) => d.nodes.push({ ...d.nodes[0], id: "second" }),
    "DUPLICATE_ORDER",
  );
  mutate((d) => {
    d.nodes[0].parentId = "missing";
  }, "MISSING_PARENT");
  mutate((d) => {
    d.nodes[0].parentId = "intro";
  }, "CYCLE");
  mutate((d) => {
    d.nodes[0].body = "[unsafe](javascript:alert(1))";
  }, "UNSAFE_URL");
  mutate((d) => {
    d.description = "[unsafe][x]\n\n[x]: data:text/html,bad";
  }, "UNSAFE_URL");
  mutate(
    (d) => d.nodes.push(newNode("task", "child", "Child", "intro", 0)),
    "INVALID_COMPLETION",
  );
  assert.ok(
    validateContent({ ...doc, schemaVersion: "2.0" }).some(
      (i) => i.code === "SCHEMA_INVALID",
    ),
  );
  assert.ok(
    validateContent({ ...doc, nodes: [] }, { publish: true }).some(
      (i) => i.code === "NO_REQUIRED_UNIT",
    ),
  );
  const approval = {
    ...doc,
    nodes: [
      {
        ...newNode("project", "project", "Project", null, 0),
        completion: { required: true, rule: "approval" as const },
      },
    ],
  };
  assert.deepEqual(validateContent(approval, { publish: true }), []);
  assert.ok(
    validateContent(approval, { publish: true, personal: true }).some(
      (i) => i.code === "PERSONAL_APPROVAL",
    ),
  );
  const optional = {
    ...doc,
    nodes: [
      { ...newNode("lesson", "lesson", "Lesson", null, 0) },
      {
        ...newNode("task", "task", "Task", "lesson", 0),
        completion: { required: false, rule: "self" as const },
      },
    ],
  };
  assert.deepEqual(validateContent(optional), []);
  assert.ok(
    validateContent(optional, { publish: true }).some(
      (i) => i.code === "NO_REQUIRED_UNIT",
    ),
  );
});
test("strict YAML rejects duplicate keys, anchors, aliases, tags and multi-documents without executing input", () => {
  for (const content of [
    "title: a\ntitle: b",
    "title: &x Hello\ndescription: *x",
    "title: !execute bad",
    "title: a\n---\ntitle: b",
  ]) {
    assert.throws(
      () =>
        propose(
          [{ name: "roadmap.yml", bytes: Buffer.from(content) }],
          "structured",
        ),
      (e) => e instanceof ContentError,
    );
  }
  assert.throws(
    () =>
      propose(
        [{ name: "README.md", bytes: Buffer.from([0xc3, 0x28]) }],
        "loose",
      ),
    fails("INVALID_ENCODING"),
  );
});
test("loose Persian import retains topic prose and notes, recognizes tasks/projects, and never converts source ticks to progress", async () => {
  const files = await fixture("loose-readme");
  const source = files.find((f) => f.name === "README.md");
  assert.ok(source);
  const preview = propose([source], "loose");
  assert.deepEqual(preview.errors, []);
  assert.equal(preview.canonical?.language, "fa");
  assert.equal(
    preview.canonical?.nodes.filter((n) => n.kind === "task").length,
    3,
  );
  assert.ok(preview.canonical?.nodes.some((n) => n.kind === "project"));
  assert.ok(
    preview.canonical?.nodes.some((n) => n.body.includes("SQL Server")),
  );
  assert.ok(preview.source[0].text?.includes("یادداشت مهم"));
  const checked = propose(
    [
      {
        name: "README.md",
        bytes: Buffer.from(
          "# Roadmap\n\n## Networking\n\n- [x] DNS\n\n```md\n- [x] Not a tracked task\n```\n\n<script>evil()</script>",
        ),
      },
    ],
    "loose",
  );
  assert.equal(
    checked.canonical?.nodes.filter((n) => n.kind === "task").length,
    1,
  );
  assert.ok(checked.warnings.some((w) => w.code === "CHECKED_SOURCE_ONLY"));
  assert.ok(checked.warnings.some((w) => w.code === "RAW_HTML"));
  assert.ok(!JSON.stringify(checked.canonical).includes('"progress"'));
});
test("safe node links and private assets retain canonical text through repository export and re-import", async () => {
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2]);
  const hash = await import("node:crypto").then((m) =>
    m.createHash("sha256").update(bytes).digest("hex"),
  );
  const name = `assets/${hash}.png`;
  const doc = simple();
  doc.description = `Read [more](#node-more) and ![diagram](${name}).`;
  doc.nodes[0].body = `Read [next](#node-more).\n\n![A diagram](${name})\n\n\`[code](#node-more)\`\n`;
  doc.nodes.push({
    ...newNode("lesson", "more", "More", null, 1),
    body: "Exact trailing newline\n",
  });
  const packed = await exportPackage(doc, [
    { name, bytes, mediaType: "image/png" },
  ]);
  const preview = propose(await readArchive(packed), "structured");
  assert.deepEqual(preview.errors, []);
  assert.deepEqual(preview.canonical, doc);
  assert.equal(preview.assets[0].name, name);
  assert.deepEqual(preview.assets[0].bytes, bytes);
  assert.equal(
    rewriteMarkdown("`[code](a)`\n\n[label](a)", (u) => (u === "a" ? "b" : u)),
    "`[code](a)`\n\n[label](b)",
  );
  assert.ok(
    validateContent(doc, { assets: [] }).some(
      (i) => i.code === "MISSING_ASSET",
    ),
  );
  assert.ok(
    validateContent({ ...doc, description: "[bad](#node-missing)" }).some(
      (i) => i.code === "MISSING_NODE_LINK" && i.pointer === "/description",
    ),
  );
  assert.ok(
    validateContent({ ...doc, description: "[bad](https:example.com)" }).some(
      (i) => i.code === "UNSAFE_URL",
    ),
  );
});
test("ZIP traversal, links, duplicates, nested archives, unsupported executable assets and bounded expansion are handled safely", async () => {
  const ordinary = await zip([
    { name: "good.md", bytes: Buffer.from("# Roadmap") },
  ]);
  const traversal = Buffer.from(ordinary);
  for (
    let position = traversal.indexOf("good.md");
    position !== -1;
    position = traversal.indexOf("good.md", position + 7)
  )
    traversal.write("../x.md", position, "utf8");
  await assert.rejects(
    readArchive(traversal),
    (e) => e instanceof ContentError,
  );
  await assert.rejects(
    readArchive(
      await zip([
        { name: "a.md", bytes: Buffer.from("a") },
        { name: "A.md", bytes: Buffer.from("b") },
      ]),
    ),
    fails("UNSAFE_PATH"),
  );
  await assert.rejects(
    readArchive(
      await zip([
        { name: "link.md", bytes: Buffer.from("target"), mode: 0o120777 },
      ]),
    ),
    fails("ARCHIVE_LINK"),
  );
  await assert.rejects(
    readArchive(await zip([{ name: "inner.zip", bytes: ordinary }])),
    fails("NESTED_ARCHIVE"),
  );
  await assert.rejects(
    readArchive(
      await zip([
        { name: "bomb.md", bytes: Buffer.alloc(2 * 1024 * 1024, 65) },
      ]),
    ),
    fails("DECOMPRESSION_LIMIT"),
  );
  const unsafe = propose(
    [
      { name: "README.md", bytes: Buffer.from("# Safe") },
      { name: "evil.svg", bytes: Buffer.from('<svg onload="evil()"/>') },
    ],
    "loose",
  );
  assert.equal(unsafe.assets.length, 0);
  assert.ok(unsafe.warnings.some((w) => w.code === "UNSUPPORTED_FILE"));
  for (const path of ["../a", "/a", "C:\\secret", "a\u0000.md", "a/%2e%2e/b"]) {
    assert.equal(safePackagePath(path), null);
  }
});
test("canonical hashes ignore array/object key order and newline encoding, preserve sibling order and fa/en catalogs", () => {
  const doc = simple();
  doc.nodes.push(newNode("module", "module", "Module", null, 1));
  const shuffled = structuredClone(doc);
  shuffled.nodes.reverse();
  const intro = shuffled.nodes.find((n) => n.id === "intro");
  assert.ok(intro);
  intro.body = doc.nodes[0].body.replaceAll("\n", "\r\n");
  assert.equal(contentHash(shuffled), contentHash(doc));
  shuffled.nodes[0].order = 50;
  assert.notEqual(contentHash(shuffled), contentHash(doc));
  for (const catalog of [contentCatalogs, contentIssues])
    assert.deepEqual(
      Object.keys(catalog.en).sort(),
      Object.keys(catalog.fa).sort(),
    );
});
