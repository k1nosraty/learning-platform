"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { catalogs } from "../../../packages/contracts/src/locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { authClient } from "../lib/auth-client";
export function Shell({
  locale,
  children,
  signedIn = false,
  canChangeLocale,
}: {
  locale: Locale;
  children: ReactNode;
  signedIn?: boolean;
  canChangeLocale?: () => boolean;
}) {
  const t = catalogs[locale];
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    document.cookie = `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, [locale]);
  async function change(next: Locale) {
    if (canChangeLocale && !canChangeLocale()) return;
    document.cookie = `locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    if (signedIn) {
      const response = await fetch("/api/v1/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLocale: next }),
      });
      if (!response.ok) return;
    }
    router.push(
      path.replace(/^\/(en|fa)(?=\/|$)/, `/${next}`) + location.search,
    );
    router.refresh();
  }
  return (
    <>
      <header className="topbar">
        <Link href={`/${locale}/workspaces`} className="brand">
          {t.brand}
        </Link>
        <div className="actions">
          <label>
            {t.language}
            <select
              aria-label={t.language}
              value={locale}
              onChange={(e) => void change(e.target.value as Locale)}
            >
              <option value="en">English</option>
              <option value="fa">فارسی</option>
            </select>
          </label>
          {signedIn && (
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                await authClient.signOut();
                router.replace(`/${locale}/login`);
                router.refresh();
              }}
            >
              {t.logout}
            </button>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer>{t.help}</footer>
    </>
  );
}
