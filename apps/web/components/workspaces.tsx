"use client";
import Link from "next/link";
import { useState } from "react";
import { catalogs } from "../../../packages/contracts/src/locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { api } from "../lib/api-client";
import { Shell } from "./shell";
export interface WorkspaceDTO {
  id: string;
  name: string;
  type: "personal" | "organization";
  timezone: string;
  default_locale: Locale;
  revision: number;
  role: "owner" | "manager" | "mentor" | "learner";
}
export function Workspaces({
  locale,
  initial,
}: {
  locale: Locale;
  initial: WorkspaceDTO[];
}) {
  const t = catalogs[locale];
  const [items, setItems] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await api("workspaces", "POST", {
        type: "organization",
        name: data.get("name"),
        timezone: data.get("timezone"),
        defaultLocale: locale,
      });
      const result = await api<{ items: WorkspaceDTO[] }>("workspaces");
      setItems(result.items);
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell locale={locale} signedIn>
      <p className="eyebrow">{t.foundation}</p>
      <h1>{t.workspaces}</h1>
      <div className="workspace-grid">
        {items.map((w) => (
          <article className="card" key={w.id}>
            <span className="badge">{t[w.type]}</span>
            <h2>{w.name}</h2>
            <p>
              {t[w.role]} · <bdi>{w.timezone}</bdi>
            </p>
            <Link className="button" href={`/${locale}/workspaces/${w.id}`}>
              {t.open}
            </Link>
          </article>
        ))}
      </div>
      <section className="card">
        <h2>{t.createOrganization}</h2>
        <form className="inline-form" onSubmit={create}>
          <label>
            {t.name}
            <input name="name" required maxLength={120} />
          </label>
          <label>
            {t.timezone}
            <input
              name="timezone"
              dir="ltr"
              defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? t.loading : t.createOrganization}
          </button>
        </form>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
    </Shell>
  );
}
