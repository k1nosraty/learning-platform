import { expect, type Page } from "@playwright/test";

export async function onboarding(page: Page, email: string, locale = "en") {
  await page.goto(`/${locale}/register`);
  await page
    .getByLabel(locale === "fa" ? "نام" : "Name", { exact: true })
    .fill("Content learner");
  await page
    .getByLabel(locale === "fa" ? "ایمیل" : "Email", { exact: true })
    .fill(email);
  await page
    .getByLabel(locale === "fa" ? "رمز عبور" : "Password", { exact: true })
    .fill("content-browser-long-password-123");
  await page
    .getByRole("button", {
      name: locale === "fa" ? "ساخت حساب" : "Create account",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toBeVisible();
  let verification = "";
  await expect
    .poll(async () => {
      const inbox = await (
        await page.request.get("http://127.0.0.1:3101")
      ).json();
      verification =
        inbox
          .filter((m: { raw: string }) => m.raw.includes(email))
          .flatMap((m: { links: string[] }) => m.links)
          .find((link: string) => link.includes("/verify-email")) ?? "";
      return !!verification;
    })
    .toBe(true);
  await page.goto(verification);
  await expect(page).toHaveURL(new RegExp(`/${locale}/workspaces`));
  const response = await page.request.get("/api/v1/workspaces");
  const workspaces = (await response.json()).data.items;
  return workspaces.find((w: { type: string }) => w.type === "personal")
    .id as string;
}
