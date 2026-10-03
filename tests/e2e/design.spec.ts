import { expect, test } from "@playwright/test";
import {
  accessible,
  capture,
  fitsViewport,
} from "../helpers/browser-accessibility";
import { onboarding } from "../helpers/browser-onboarding";

test("bilingual visual system, keyboard navigation and safe editing work on real desktop/mobile pages", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const fonts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fonts.push(request.url());
  });
  await page.goto("/en/login");
  const license = await page.request.get("/font-licenses.txt");
  expect(license.status()).toBe(200);
  expect(await license.text()).toContain("SIL OPEN FONT LICENSE Version 1.1");
  await page.getByLabel("Email", { exact: true }).fill("design@local.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("visual-browser-long-password-123");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await accessible(page);
  expect(
    await page.evaluate(() => document.fonts.check('16px "Inter Variable"')),
  ).toBe(true);
  await capture(page, info, "english-login-desktop.png");
  await page
    .getByRole("link", { name: "Skip to content", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/fa/register");
  await accessible(page);
  expect(
    await page.evaluate(() =>
      document.fonts.check('16px "Vazirmatn Variable"'),
    ),
  ).toBe(true);
  expect(fonts.length).toBeGreaterThan(0);
  expect(
    fonts.every((url) => new URL(url).origin === "http://127.0.0.1:3100"),
  ).toBe(true);
  await fitsViewport(page);
  await capture(page, info, "persian-register-mobile.png");
  const ws = await onboarding(page, "visual-design@local.test", "fa");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await accessible(page);
  await capture(page, info, "persian-workspaces-desktop.png");
  await page.goto(`/fa/workspaces/${ws}/paths`);
  await expect(
    page.getByRole("heading", {
      name: "اولین مسیرت را از همین‌جا بساز.",
      exact: true,
    }),
  ).toBeVisible();
  await accessible(page);
  await capture(page, info, "persian-library-empty.png");
  await page
    .getByLabel("متن منبع را بچسبانید", { exact: true })
    .fill("# Retained pasted source");
  await page.getByLabel("یا فایل انتخاب کنید", { exact: true }).setInputFiles({
    name: "README.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Imported source"),
  });
  await expect(
    page.getByLabel("متن منبع را بچسبانید", { exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "حذف فایل انتخاب‌شده", exact: true })
    .click();
  await expect(
    page.getByLabel("متن منبع را بچسبانید", { exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByLabel("متن منبع را بچسبانید", { exact: true }),
  ).toHaveValue("# Retained pasted source");
  await page
    .getByLabel("عنوان مسیر", { exact: true })
    .fill("مسیر طراحی آزمایشی");
  await page.getByRole("button", { name: "ساخت مسیر", exact: true }).click();
  await page.getByRole("button", { name: "افزودن بخش", exact: true }).click();
  await page.getByLabel("عنوان بخش", { exact: true }).fill("درس اول");
  await page
    .getByLabel("روش تکمیل", { exact: true })
    .selectOption("self-required");
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await accessible(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await fitsViewport(page);
  await page.getByRole("button", { name: "باز کردن منو", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "ناوبری اصلی", exact: true }),
  ).toBeVisible();
  await accessible(page);
  await capture(page, info, "persian-mobile-navigation.png", false);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "باز کردن منو", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "حذف بخش و زیرمجموعه‌هایش", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "این بخش حذف شود؟",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "ادامهٔ ویرایش", exact: true }),
  ).toBeFocused();
  await accessible(page);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "حذف بخش و زیرمجموعه‌هایش", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("عنوان بخش", { exact: true })).toHaveValue(
    "درس اول",
  );
  await page.getByLabel("عنوان بخش", { exact: true }).fill("ویرایش محلی");
  await page
    .getByRole("button", {
      name: "بارگذاری پیش‌نویس ذخیره‌شده و حذف تغییرات محلی",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "حذف تغییرات", exact: true })
    .click();
  await expect(page.getByLabel("عنوان بخش", { exact: true })).toHaveValue(
    "درس اول",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, info, "persian-editor-desktop.png");
  await page
    .getByRole("button", { name: "انتشار و شروع شخصی", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "نمایش نسخه منتشرشده", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("link", { name: "نمایش نسخه منتشرشده", exact: true })
    .click();
  await accessible(page);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await fitsViewport(page);
  }
  await capture(page, info, "published-tablet.png");
});
