import assert from "node:assert/strict";
import { test } from "node:test";
import { isProductionRuntime } from "../../packages/adapters/src/runtime";

test("prebuilt Windows runtime allows only the fixed loopback origin and local mail, preserving production defaults", () => {
  assert.equal(isProductionRuntime({ NODE_ENV: "production" }), true);
  assert.equal(isProductionRuntime({ NODE_ENV: "development" }), false);
  const local = {
    NODE_ENV: "production",
    APP_RUNTIME_MODE: "windows-local",
    APP_URL: "http://localhost:3000",
    SMTP_HOST: "mailpit",
    SMTP_PORT: "1025",
  };
  assert.equal(isProductionRuntime(local), false);
  for (const APP_URL of [
    undefined,
    "http://example.com",
    "https://example.com",
    "http://localhost:3000.evil.test",
    "http://localhost:3000/path",
  ])
    assert.throws(() => isProductionRuntime({ ...local, APP_URL }));
  assert.throws(() =>
    isProductionRuntime({ ...local, SMTP_HOST: "smtp.example.com" }),
  );
  assert.throws(() => isProductionRuntime({ ...local, SMTP_PORT: "25" }));
  assert.equal(
    isProductionRuntime({ ...local, APP_RUNTIME_MODE: "unexpected" }),
    true,
  );
});
