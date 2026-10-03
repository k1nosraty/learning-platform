// The prebuilt Windows server uses production assets with an explicit local
// deployment policy. Never permit this policy for a public application origin.
export function isProductionRuntime(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.APP_RUNTIME_MODE === "windows-local") {
    if (env.APP_URL !== "http://localhost:3000")
      throw new Error(
        "Windows local runtime requires APP_URL=http://localhost:3000",
      );
    if (env.SMTP_HOST !== "mailpit" || env.SMTP_PORT !== "1025")
      throw new Error(
        "Windows local runtime requires the local Mailpit service",
      );
    return false;
  }
  return env.NODE_ENV === "production";
}
