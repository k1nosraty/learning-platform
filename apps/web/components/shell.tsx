"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { designCatalogs } from "../../../packages/contracts/src/design-locales";
import { catalogs } from "../../../packages/contracts/src/locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { authClient } from "../lib/auth-client";
import { BrandMark, Icon } from "./icon";
export function Shell({
  locale,
  children,
  signedIn = false,
  canChangeLocale,
  workspace,
}: {
  locale: Locale;
  children: ReactNode;
  signedIn?: boolean;
  canChangeLocale?: () => boolean;
  workspace?: { id: string; name: string; role?: string };
}) {
  const t = catalogs[locale],
    d = designCatalogs[locale],
    path = usePathname(),
    router = useRouter();
  const drawer = useRef<HTMLDialogElement>(null),
    menuButton = useRef<HTMLButtonElement>(null);
  const [changing, setChanging] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    document.cookie = `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, [locale]);
  useEffect(() => {
    if (path) drawer.current?.close();
  }, [path]);
  async function change(next: Locale) {
    if (canChangeLocale && !canChangeLocale()) return;
    setChanging(true);
    setError("");
    try {
      if (signedIn) {
        const response = await fetch("/api/v1/me/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLocale: next }),
        });
        if (!response.ok) throw new Error(t.authError);
      }
      document.cookie = `locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      router.push(
        path.replace(/^\/(en|fa)(?=\/|$)/, `/${next}`) + location.search,
      );
      router.refresh();
    } catch {
      setError(t.authError);
    } finally {
      setChanging(false);
    }
  }
  const base = workspace ? `/${locale}/workspaces/${workspace.id}` : "";
  const canEdit =
    workspace && ["owner", "manager"].includes(workspace.role ?? "");
  function navigation() {
    return (
      <>
        <Link href={`/${locale}/workspaces`} className="brand sidebar-brand">
          <BrandMark />
          <span>
            {t.brand}
            <small>{d.tagline}</small>
          </span>
        </Link>
        <p className="nav-caption">{t.workspaces}</p>
        <nav aria-label={d.navigation} className="side-nav">
          <Link
            href={`/${locale}/workspaces`}
            aria-current={path === `/${locale}/workspaces` ? "page" : undefined}
          >
            <Icon name="grid" />
            <span>{t.workspaces}</span>
          </Link>
          {workspace && (
            <>
              <div className="workspace-context">
                <span className="workspace-avatar">
                  {Array.from(workspace.name)[0]}
                </span>
                <span>
                  <small>{d.workspace}</small>
                  <bdi>{workspace.name}</bdi>
                </span>
              </div>
              <Link
                href={base}
                aria-current={path === base ? "page" : undefined}
              >
                <Icon name="folder" />
                <span>{d.home}</span>
              </Link>
              {canEdit && (
                <Link
                  href={`${base}/paths`}
                  aria-current={
                    path.includes("/paths") || path.includes("/imports")
                      ? "page"
                      : undefined
                  }
                >
                  <Icon name="book" />
                  <span>{d.library}</span>
                </Link>
              )}
              {workspace.role === "owner" && (
                <Link href={`${base}#workspace-settings`}>
                  <Icon name="settings" />
                  <span>{d.settings}</span>
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <Icon name="spark" />
          </span>
          <p>{d.sidebarTitle}</p>
          <small>{d.sidebarHint}</small>
          <div className="growth-line" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="sidebar-foot">
          <Icon name="shield" />
          <span>{d.tagline}</span>
        </div>
      </>
    );
  }
  return (
    <div className={signedIn ? "app-frame" : "public-shell"}>
      <a className="skip-link" href="#main-content">
        {d.skip}
      </a>
      {signedIn && (
        <>
          <aside className="sidebar">{navigation()}</aside>
          <dialog
            ref={drawer}
            className="mobile-drawer"
            aria-label={d.navigation}
            onClose={() => menuButton.current?.focus()}
          >
            <button
              type="button"
              className="drawer-close icon-button"
              aria-label={d.close}
              onClick={() => drawer.current?.close()}
            >
              <Icon name="close" />
            </button>
            {navigation()}
          </dialog>
        </>
      )}
      <div className="app-body">
        <header className="topbar">
          {signedIn ? (
            <div className="header-context">
              <button
                ref={menuButton}
                type="button"
                className="mobile-menu icon-button"
                aria-label={d.menu}
                onClick={() => drawer.current?.showModal()}
              >
                <Icon name="menu" />
              </button>
              <Icon name={workspace ? "folder" : "grid"} />
              <span>
                {workspace ? <bdi>{workspace.name}</bdi> : t.workspaces}
              </span>
            </div>
          ) : (
            <Link href={`/${locale}/workspaces`} className="brand">
              <BrandMark />
              <span>{t.brand}</span>
            </Link>
          )}
          <div className="actions header-actions">
            <label className="locale-control">
              <Icon name="globe" />
              <span className="sr-only">{t.language}</span>
              <select
                aria-label={t.language}
                value={locale}
                disabled={changing}
                onChange={(e) => void change(e.target.value as Locale)}
              >
                <option value="en">English</option>
                <option value="fa">فارسی</option>
              </select>
            </label>
            {signedIn ? (
              <button
                type="button"
                className="secondary signout"
                onClick={async () => {
                  try {
                    await authClient.signOut();
                    router.replace(`/${locale}/login`);
                    router.refresh();
                  } catch {
                    setError(t.authError);
                  }
                }}
              >
                <Icon name="logout" />
                <span>{t.logout}</span>
              </button>
            ) : (
              <nav className="auth-header-links" aria-label={d.navigation}>
                <Link
                  href={`/${locale}/login`}
                  aria-current={path.endsWith("/login") ? "page" : undefined}
                >
                  {t.login}
                </Link>
                <Link className="button secondary" href={`/${locale}/register`}>
                  {t.register}
                  <Icon name="arrow" className="directional" />
                </Link>
              </nav>
            )}
          </div>
        </header>
        {error && (
          <p className="error shell-error" role="alert">
            {error}
          </p>
        )}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer>
          <span>{t.brand}</span>
          <span>{t.help}</span>
        </footer>
      </div>
    </div>
  );
}
