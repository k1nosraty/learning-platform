import { expect, test } from "@playwright/test";

test("Persian verified onboarding, personal workspace, organization settings and English preference", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fa/register");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await page.getByLabel("نام", { exact: true }).fill("کاربر آزمایشی");
  await page.getByLabel("ایمیل", { exact: true }).fill("browser@local.test");
  await page
    .getByLabel("رمز عبور", { exact: true })
    .fill("browser-long-password-123");
  await page.getByRole("button", { name: "ساخت حساب", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("تأیید");
  let verification = "";
  await expect
    .poll(async () => {
      const mails = await (await request.get("http://127.0.0.1:3101")).json();
      verification =
        mails
          .flatMap((m: { links: string[] }) => m.links)
          .find((x: string) => x.includes("/verify-email")) ?? "";
      return !!verification;
    })
    .toBe(true);
  await page.goto(verification);
  await expect(page).toHaveURL(/\/fa\/workspaces/);
  await expect(page.getByText("شخصی", { exact: true })).toBeVisible();
  await page.getByLabel("نام", { exact: true }).fill("تیم آزمایشی");
  await page.getByLabel("منطقه زمانی", { exact: true }).fill("Asia/Tehran");
  await page
    .getByRole("button", { name: "ساخت فضای سازمانی", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "تیم آزمایشی" }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "تیم آزمایشی" }) })
    .getByRole("link", { name: "باز کردن فضای کاری" })
    .click();
  await expect(
    page.getByRole("heading", { name: "تنظیمات فضای کاری" }),
  ).toBeVisible();
  await page.getByLabel("نام", { exact: true }).fill("تیم جدید");
  await page
    .getByRole("button", { name: "ذخیره تغییرات", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "تیم جدید", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("زبان", { exact: true }).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: "Workspace settings" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en\/login/);
  await page.getByLabel("Email", { exact: true }).fill("browser@local.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-long-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/workspaces/);
});
test("English forms support keyboard focus and switch to Persian before sign-in", async ({
  page,
}) => {
  await page.goto("/en/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByLabel("Email", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await page.getByLabel("Language", { exact: true }).selectOption("fa");
  await expect(page).toHaveURL(/\/fa\/login/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/fa/workspaces/invalid-id");
  await expect(
    page.getByRole("heading", { name: "صفحه پیدا نشد" }),
  ).toBeVisible();
});
