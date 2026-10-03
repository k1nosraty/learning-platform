import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import {
  propose,
  readArchive,
} from "../../packages/adapters/src/content-package";

async function onboarding(page: Page, email: string, locale = "en") {
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
test("visual editor preserves unsaved work across fa/en, publishes a real personal snapshot, and keeps old version/export after further edits", async ({
  page,
}) => {
  const ws = await onboarding(page, "content-visual@local.test");
  await page.goto(`/en/workspaces/${ws}/paths`);
  await page.getByLabel("Path title", { exact: true }).fill("First roadmap");
  await page.getByRole("button", { name: "Create path", exact: true }).click();
  await expect(page).toHaveURL(/\/paths\/[a-f0-9-]+$/);
  const draftUrl = page.url();
  const pathId = draftUrl.split("/").at(-1);
  await page.getByRole("button", { name: "Add node", exact: true }).click();
  await page.getByLabel("Node title", { exact: true }).fill("DNS lesson");
  await page
    .getByLabel("Completion", { exact: true })
    .selectOption("self-required");
  await page
    .getByLabel("Markdown content", { exact: true })
    .fill(
      "Explain DNS.\n\n![External](https://external-image.example/never-fetch.png)\n\n<script>window.contentPwn=true</script>",
    );
  await page.getByLabel("Language", { exact: true }).selectOption("fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByLabel("عنوان بخش", { exact: true })).toHaveValue(
    "DNS lesson",
  );
  await expect(page.getByLabel("زبان محتوا", { exact: true })).toHaveValue(
    "en",
  );
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page
    .getByRole("button", { name: "انتشار و شروع شخصی", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("متصل شد");
  await expect(
    page.getByRole("link", { name: "نمایش نسخه منتشرشده" }),
  ).toHaveCount(1);
  const versionLink = page.getByRole("link", { name: "نمایش نسخه منتشرشده" }),
    versionUrl = await versionLink.getAttribute("href");
  expect(versionUrl).toBeTruthy();
  const remote: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("external-image.example"))
      remote.push(request.url());
  });
  await versionLink.click();
  await expect(
    page.getByRole("heading", { name: "DNS lesson", exact: true }),
  ).toBeVisible();
  expect(remote).toEqual([]);
  expect(await page.evaluate(() => "contentPwn" in window)).toBe(false);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "دانلود ZIP فایل‌های Markdown", exact: true })
    .click();
  const downloaded = await downloadPromise,
    path = await downloaded.path();
  expect(path).toBeTruthy();
  const exported = propose(
    await readArchive(await readFile(path as string)),
    "structured",
  );
  expect(exported.errors).toEqual([]);
  expect(exported.canonical?.title).toBe("First roadmap");
  expect(exported.canonical?.nodes[0].title).toBe("DNS lesson");
  await page.goto(`/fa/workspaces/${ws}/paths/${pathId}`);
  await page.getByLabel("عنوان مسیر", { exact: true }).fill("Second roadmap");
  await page.getByLabel("عنوان بخش", { exact: true }).fill("Changed lesson");
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.getByRole("button", { name: "انتشار نسخه", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "نمایش نسخه منتشرشده" }),
  ).toHaveCount(2);
  await page.goto(versionUrl as string);
  await expect(
    page.getByRole("heading", { name: "First roadmap", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "DNS lesson", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("ordinary Persian source creates an editable reviewed import, source ticks do not claim progress, and explicit conversion gates personal approval", async ({
  page,
}) => {
  const ws = await onboarding(page, "content-import@local.test", "fa");
  await page.goto(`/fa/workspaces/${ws}/paths`);
  await page
    .getByLabel("متن منبع را بچسبانید", { exact: true })
    .fill(
      "# برنامه یادگیری\n\n## شبکه\n\n- [x] توضیح DNS\n- [ ] آزمایش اتصال\n\n### پروژه\n\nیک شبکه کوچک بساز.",
    );
  await page
    .getByRole("button", { name: "پیش‌نمایش واردکردن", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "پیش‌نمایش واردکردن", exact: true }),
  ).toBeVisible();
  await page.getByText(/^هشدارها \(/).click();
  await expect(
    page.getByText("تیک منبع فقط یادداشت است و تکمیل یادگیرنده ایجاد نمی‌کند.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ساخت پیش‌نویس خصوصی", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("هشدارها و ساختار پیشنهادی را بررسی کردم", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "ساخت پیش‌نویس خصوصی", exact: true })
    .click();
  await expect(page).toHaveURL(/\/paths\/[a-f0-9-]+$/);
  await page.locator(".node-button").filter({ hasText: "پروژه" }).click();
  await page
    .getByLabel("روش تکمیل", { exact: true })
    .selectOption("approval-required");
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page.getByRole("button", { name: "انتشار نسخه", exact: true }).click();
  await expect(
    page.getByText(
      "پیش از انتشار شخصی، پروژه نیازمند تأیید را به تأیید شخصی تغییر دهید.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "تغییر پروژه‌های فهرست‌شده به تأیید شخصی",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("روش تکمیل", { exact: true })).toHaveValue(
    "self-required",
  );
  await page
    .getByRole("button", { name: "ذخیره پیش‌نویس", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ذخیره شد");
  await page
    .getByRole("button", { name: "انتشار و شروع شخصی", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("فاز ۳");
});
