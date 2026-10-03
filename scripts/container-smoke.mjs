// CI-only: run against an isolated local compose stack, never a live workspace.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const origin = "http://localhost:3000";
const email = "windows-smoke@example.test";
const password = "Isolated-CI-password-2026!";
const license = await fetch(`${origin}/font-licenses.txt`);
assert.equal(license.status, 200);
assert.match(await license.text(), /SIL OPEN FONT LICENSE Version 1.1/);
const post = (path, body) =>
  fetch(`${origin}/api/auth/${path}`, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

for (const locale of ["en", "fa"]) {
  const page = await fetch(`${origin}/${locale}/register`);
  assert.equal(page.status, 200);
  assert.match(
    await page.text(),
    new RegExp(`dir="${locale === "fa" ? "rtl" : "ltr"}"`),
  );
}
if (!process.argv.includes("--existing")) {
  const registered = await post("sign-up/email", {
    name: "Container smoke",
    email,
    password,
    callbackURL: "/en/workspaces",
  });
  assert.equal(registered.status, 200, await registered.text());
  let link;
  for (let attempt = 0; attempt < 30; attempt++) {
    const mail = await fetch("http://localhost:8025/view/latest.txt");
    if (mail.ok) {
      link = (await mail.text())
        .split(/\r?\n/)
        .find((line) => line.includes("/verify-email"));
      if (link) break;
    }
    await setTimeout(1000);
  }
  assert.ok(link, "Actual worker SMTP verification email reached Mailpit");
  assert.equal(new URL(link).origin, origin);
  const verified = await fetch(link, { redirect: "manual" });
  assert.ok([200, 302, 303].includes(verified.status));
}
const signedIn = await post("sign-in/email", { email, password });
assert.equal(signedIn.status, 200, await signedIn.text());
const cookie = signedIn.headers
  .getSetCookie()
  .map((x) => x.split(";")[0])
  .join("; ");
assert.match(cookie, /session_token/);
const workspaces = await fetch(`${origin}/api/v1/workspaces`, {
  headers: { cookie },
});
assert.equal(workspaces.status, 200, await workspaces.clone().text());
const body = await workspaces.json();
assert.match(JSON.stringify(body), /personal/);
const workspace = body.data.items.find((w) => w.type === "personal");
assert.ok(workspace, "Authenticated personal workspace exists");
const base = `/api/v1/workspaces/${workspace.id}`;
async function api(path, method = "GET", value) {
  const response = await fetch(`${origin}${base}${path}`, {
    method,
    headers: {
      cookie,
      origin,
      "Content-Type": "application/json",
      "Idempotency-Key": randomUUID(),
    },
    ...(value ? { body: JSON.stringify(value) } : {}),
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(response.status, 200, await response.clone().text());
  return (await response.json()).data;
}
if (!process.argv.includes("--existing")) {
  const encoded = await readFile(
    new URL("../tests/fixtures/container-content.zip.base64", import.meta.url),
    "utf8",
  );
  const form = new FormData();
  form.set("method", "structured");
  form.set(
    "file",
    new File([Buffer.from(encoded.trim(), "base64")], "content.zip", {
      type: "application/zip",
    }),
  );
  const imported = await fetch(`${origin}${base}/imports`, {
    method: "POST",
    headers: { cookie, origin, "Idempotency-Key": randomUUID() },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(imported.status, 200, await imported.clone().text());
  const created = (await imported.json()).data;
  const preview = await api(`/imports/${created.id}`);
  assert.deepEqual(preview.errors, []);
  const confirmed = await api(`/imports/${preview.id}/confirm`, "POST", {
    canonical: preview.canonical,
    expectedRevision: preview.revision,
    acknowledgeWarnings: true,
  });
  const draft = await api(`/paths/${confirmed.id}/draft`);
  const started = await api(`/paths/${confirmed.id}/start`, "POST", {
    expectedRevision: draft.revision,
  });
  assert.ok(
    started.enrollmentId,
    "Publication and personal enrollment committed together",
  );
}
const paths = await api("/paths");
const path = paths.items.find((p) => p.title === "Container content");
assert.ok(
  path?.publishedVersionId,
  "Published content survives container restart",
);
const version = await api(
  `/paths/${path.id}/versions/${path.publishedVersionId}`,
);
const assetName = version.canonical.nodes[0].body.match(
  /\]\((assets\/[^)]+)\)/,
)?.[1];
assert.ok(assetName);
const asset = await fetch(
  `${origin}${base}/paths/${path.id}/versions/${path.publishedVersionId}/assets?name=${encodeURIComponent(assetName)}`,
  { headers: { cookie } },
);
assert.equal(asset.status, 200);
assert.equal(asset.headers.get("content-type"), "image/png");
assert.deepEqual(
  Buffer.from(await asset.arrayBuffer()),
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+S8AAAAASUVORK5CYII=",
    "base64",
  ),
);
const exported = await fetch(
  `${origin}${base}/paths/${path.id}/versions/${path.publishedVersionId}/export`,
  { headers: { cookie } },
);
assert.equal(exported.status, 200);
assert.equal(exported.headers.get("content-type"), "application/zip");
assert.equal(
  Buffer.from(await exported.arrayBuffer()).readUInt32LE(0),
  0x04034b50,
);
console.log(
  "Container auth/mail, fa/en pages, content import/publication/export and private attachment persistence passed.",
);
