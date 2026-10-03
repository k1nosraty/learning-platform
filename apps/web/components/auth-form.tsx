"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { designCatalogs } from "../../../packages/contracts/src/design-locales";
import { catalogs } from "../../../packages/contracts/src/locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { authClient } from "../lib/auth-client";
import { Icon, PathArtwork } from "./icon";
import { Shell } from "./shell";
export function AuthForm({
  locale,
  mode,
}: {
  locale: Locale;
  mode: "login" | "register" | "forgot" | "reset";
}) {
  const t = catalogs[locale],
    d = designCatalogs[locale];
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const title =
    mode === "forgot"
      ? t.sendReset
      : mode === "reset"
        ? t.reset
        : mode === "register"
          ? t.register
          : t.login;
  const safeNext = search.get("next");
  const next = safeNext?.startsWith(`/${locale}/`)
    ? safeNext
    : `/${locale}/workspaces`;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setFailed(false);
    document.cookie = `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(values.get("password") ?? "");
    try {
      const result =
        mode === "register"
          ? await authClient.signUp.email({
              name: String(values.get("name")),
              email,
              password,
              callbackURL: next,
            })
          : mode === "login"
            ? await authClient.signIn.email({ email, password })
            : mode === "forgot"
              ? await authClient.requestPasswordReset({
                  email,
                  redirectTo: `${location.origin}/${locale}/reset-password`,
                })
              : await authClient.resetPassword({
                  newPassword: password,
                  token: search.get("token") ?? "",
                });
      if (result.error) {
        setFailed(true);
        setMessage(
          result.error.code === "EMAIL_NOT_VERIFIED"
            ? t.verifyRequired
            : mode === "reset"
              ? t.invalidReset
              : t.authError,
        );
      } else if (mode === "login") {
        await fetch("/api/v1/me/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLocale: locale }),
        });
        router.replace(next);
        router.refresh();
      } else
        setMessage(
          mode === "register"
            ? t.verifySent
            : mode === "forgot"
              ? t.resetSent
              : t.passwordChanged,
        );
    } catch {
      setFailed(true);
      setMessage(t.authError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell locale={locale}>
      <div className="auth-layout">
        <aside className="auth-story">
          <span className="story-pill">
            <Icon name="spark" />
            {d.authPill}
          </span>
          <h2>{d.authTitle}</h2>
          <p>{d.authIntro}</p>
          <PathArtwork />
          <ol className="story-steps">
            <li>
              <span>01</span>
              {d.authStep1}
            </li>
            <li>
              <span>02</span>
              {d.authStep2}
            </li>
            <li>
              <span>03</span>
              {d.authStep3}
            </li>
          </ol>
        </aside>
        <section className="auth card">
          <span className="auth-symbol">
            <Icon
              name={
                mode === "forgot" ? "mail" : mode === "reset" ? "lock" : "book"
              }
            />
          </span>
          <p className="eyebrow">{t.foundation}</p>
          <h1>{title}</h1>
          <p>{t.intro}</p>
          <form onSubmit={submit}>
            {mode === "register" && (
              <label>
                {t.name}
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </label>
            )}
            {mode !== "reset" && (
              <label>
                {t.email}
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label>
                {t.password}
                <span className="password-field">
                  <input
                    aria-label={t.password}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={128}
                  />
                  <button
                    className="password-toggle icon-button"
                    type="button"
                    aria-label={showPassword ? d.hidePassword : d.showPassword}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} />
                  </button>
                </span>
              </label>
            )}
            {mode === "register" && <p className="hint">{t.authHint}</p>}
            <button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {t.loading}
                </>
              ) : (
                <>
                  {title}
                  <Icon name="arrow" className="directional" />
                </>
              )}
            </button>
          </form>
          {message && (
            <p
              role={failed ? "alert" : "status"}
              className={failed ? "error" : "success"}
            >
              {message}
            </p>
          )}
          <nav className="auth-links">
            <Link
              href={`/${locale}/login${safeNext ? `?next=${encodeURIComponent(next)}` : ""}`}
            >
              {t.login}
            </Link>
            <Link
              href={`/${locale}/register${safeNext ? `?next=${encodeURIComponent(next)}` : ""}`}
            >
              {t.register}
            </Link>
            <Link href={`/${locale}/forgot-password`}>{t.forgot}</Link>
          </nav>
        </section>
      </div>
    </Shell>
  );
}
