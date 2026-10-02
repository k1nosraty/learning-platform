// CI-only: run against an isolated local compose stack, never a live workspace.
import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

const origin = "http://localhost:3000";
const email = "windows-smoke@example.test";
const password = "Isolated-CI-password-2026!";
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
console.log(
  "Container registration, SMTP verification, authenticated personal workspace and fa/en pages passed.",
);
