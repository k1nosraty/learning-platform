import assert from "node:assert/strict";
import { test } from "node:test";
import { decryptMail, encryptMail } from "../../packages/adapters/src/mail";
import { invite, organization } from "../../packages/contracts/src/foundation";
import {
  catalogs,
  errors,
  resolveLocale,
} from "../../packages/contracts/src/locales";
import {
  DomainError,
  normalizeEmail,
  requireGrant,
} from "../../packages/domain/src/workspaces/permissions";

test("fixed grants deny escalation and personal invitations", () => {
  for (const role of ["owner", "manager", "mentor", "learner"] as const)
    for (const target of ["owner", "manager", "mentor", "learner"] as const) {
      const allowed =
        role === "owner" ||
        (role === "manager" && ["mentor", "learner"].includes(target));
      if (allowed) requireGrant(role, target, "organization");
      else
        assert.throws(
          () => requireGrant(role, target, "organization"),
          DomainError,
        );
      assert.throws(() => requireGrant(role, target, "personal"), DomainError);
    }
});
test("strict contracts reject spoofed actor, invalid timezone and cross-role inputs", () => {
  assert.equal(normalizeEmail(" Mixed@Example.COM "), "mixed@example.com");
  assert.throws(() =>
    organization.parse({
      type: "organization",
      name: "A",
      timezone: "Mars/Phobos",
      defaultLocale: "en",
    }),
  );
  assert.throws(() =>
    invite.parse({ email: "a@b.test", role: "learner", actorId: "fake" }),
  );
});
test("locale priority, supported browser languages and full catalog parity", () => {
  assert.equal(resolveLocale("fa", "en", "en", "en"), "fa");
  assert.equal(resolveLocale(undefined, "fa", "en", "en"), "fa");
  assert.equal(
    resolveLocale(undefined, undefined, undefined, "de, fa;q=0.8, en;q=0.5"),
    "fa",
  );
  assert.equal(
    resolveLocale(undefined, undefined, undefined, "fa;q=0,en;q=0.2"),
    "en",
  );
  for (const c of [catalogs, errors])
    assert.deepEqual(Object.keys(c.en).sort(), Object.keys(c.fa).sort());
});
test("mail envelopes hide tokens and authenticate ciphertext", () => {
  process.env.MAIL_ENCRYPTION_KEY = "a".repeat(64);
  const mail = { to: "a@b.test", subject: "Test", text: "private-token" };
  const ciphertext = encryptMail(mail);
  assert.ok(!ciphertext.includes(mail.text));
  assert.deepEqual(decryptMail(ciphertext), mail);
  const b = Buffer.from(ciphertext, "base64");
  b[30] ^= 1;
  assert.throws(() => decryptMail(b.toString("base64")));
});
