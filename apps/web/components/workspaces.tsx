"use client";
import Link from "next/link";
import { useState } from "react";
import { designCatalogs } from "../../../packages/contracts/src/design-locales";
import { catalogs } from "../../../packages/contracts/src/locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { api } from "../lib/api-client";
import { Icon } from "./icon";
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
  const t = catalogs[locale],
    d = designCatalogs[locale];
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
      <section className="workspace-welcome">
        <div>
          <p className="eyebrow">
            <Icon name="spark" />
            {d.welcome}
          </p>
          <h1>{t.workspaces}</h1>
          <p className="page-intro">{d.workspaceIntro}</p>
        </div>
        <div className="welcome-emblem" aria-hidden="true">
          <Icon name="book" />
          <span />
          <i />
        </div>
      </section>
      <div className="workspace-grid">
        {items.map((w) => (
          <article className={`card workspace-card ${w.type}`} key={w.id}>
            <div className="card-topline">
              <span className="tile-icon">
                <Icon name={w.type === "personal" ? "book" : "users"} />
              </span>
              <span className="badge">{t[w.type]}</span>
            </div>
            <h2>
              <bdi>{w.name}</bdi>
            </h2>
            <p className="workspace-description">
              {w.type === "personal" ? d.personalHint : d.organizationHint}
            </p>
            <p>
              {t[w.role]} · <bdi>{w.timezone}</bdi>
            </p>
            <Link className="button" href={`/${locale}/workspaces/${w.id}`}>
              {t.open}
              <Icon name="arrow" className="directional" />
            </Link>
          </article>
        ))}
      </div>
      <section className="card create-organization">
        <div className="section-heading">
          <span className="tile-icon warm">
            <Icon name="users" />
          </span>
          <div>
            <h2>{t.createOrganization}</h2>
            <p className="hint">{d.teamHint}</p>
          </div>
        </div>
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
