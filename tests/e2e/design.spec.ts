import { expect, test } from "@playwright/test";
import { accessible, fitsViewport } from "../helpers/browser-accessibility";
import { onboarding } from "../helpers/browser-onboarding";

test("bilingual visual system, keyboard navigation and safe editing work on real desktop/mobile pages", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  await page.goto("/en/login");
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
  await page.screenshot({
    path: info.outputPath("english-login-desktop.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Skip to content", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/fa/register");
  await accessible(page);
  await fitsViewport(page);
  await page.screenshot({
    path: info.outputPath("persian-register-mobile.png"),
    fullPage: true,
  });
  const ws = await onboarding(page, "visual-design@local.test", "fa");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await accessible(page);
  await page.screenshot({
    path: info.outputPath("persian-workspaces-desktop.png"),
    fullPage: true,
  });
  await page.goto(`/fa/workspaces/${ws}/paths`);
  await expect(
    page.getByRole("heading", {
      name: "اولین مسیرت را از همین‌جا بساز.",
      exact: true,
    }),
  ).toBeVisible();
  await accessible(page);
  await page.screenshot({
    path: info.outputPath("persian-library-empty.png"),
    fullPage: true,
  });
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
  await page.screenshot({
    path: info.outputPath("persian-mobile-navigation.png"),
    fullPage: true,
  });
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
  await page.screenshot({
    path: info.outputPath("persian-editor-desktop.png"),
    fullPage: true,
  });
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
  await page.screenshot({
    path: info.outputPath("published-tablet.png"),
    fullPage: true,
  });
});
