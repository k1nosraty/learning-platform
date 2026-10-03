"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { contentCatalogs } from "../../../packages/contracts/src/content-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { contentApi } from "../lib/content-client";
import { Shell } from "./shell";

interface PathList {
  items: {
    id: string;
    title: string;
    archivedAt: string | null;
    publishedVersionId: string | null;
    language: string;
  }[];
  nextCursor: string | null;
}
export function PathLibrary({
  locale,
  workspace,
}: {
  locale: Locale;
  workspace: { id: string; name: string };
}) {
  const t = contentCatalogs[locale],
    router = useRouter(),
    base = `/api/v1/workspaces/${workspace.id}`;
  const [list, setList] = useState<PathList>({ items: [], nextCursor: null }),
    [cursor, setCursor] = useState<string>(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [title, setTitle] = useState(""),
    [text, setText] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [mode, setMode] = useState<"loose" | "structured">("loose");
  useEffect(() => {
    let current = true;
    contentApi<PathList>(`${base}/paths${cursor ? `?cursor=${cursor}` : ""}`)
      .then((result) => {
        if (current) setList(result);
      })
      .catch((e) => {
        if (current) setMessage(e.message);
      });
    return () => {
      current = false;
    };
  }, [base, cursor]);
  async function create() {
    setBusy(true);
    setMessage("");
    try {
      const result = await contentApi<{ id: string }>(
        `${base}/paths`,
        "POST",
        { title, language: locale },
        crypto.randomUUID(),
      );
      router.push(`/${locale}/workspaces/${workspace.id}/paths/${result.id}`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importSource() {
    setBusy(true);
    setMessage("");
    try {
      let body: unknown = { method: mode, text, filename: "README.md" };
      if (file) {
        const form = new FormData();
        form.set("method", mode);
        form.set("file", file);
        body = form;
      }
      const result = await contentApi<{ id: string }>(
        `${base}/imports`,
        "POST",
        body,
        crypto.randomUUID(),
      );
      router.push(`/${locale}/workspaces/${workspace.id}/imports/${result.id}`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell locale={locale} signedIn>
      <Link
        className="section-link"
        href={`/${locale}/workspaces/${workspace.id}`}
      >
        {workspace.name}
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{workspace.name}</p>
          <h1>{t.paths}</h1>
        </div>
        <span className="badge">{t.draftOnly}</span>
      </div>
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
      <section className="workspace-grid">
        {list.items.map((p) => (
          <article className="card" key={p.id}>
            <span className="badge">
              {p.archivedAt
                ? t.archived
                : p.publishedVersionId
                  ? t.published
                  : t.draft}
            </span>
            <h2>
              <bdi>{p.title}</bdi>
            </h2>
            <p>
              <bdi>{p.language}</bdi>
            </p>
            <div className="actions">
              <Link
                href={`/${locale}/workspaces/${workspace.id}/paths/${p.id}`}
              >
                {t.edit}
              </Link>
              {p.publishedVersionId && (
                <Link
                  href={`/${locale}/workspaces/${workspace.id}/paths/${p.id}/versions/${p.publishedVersionId}`}
                >
                  {t.read}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>
      {!list.items.length && <p>{t.empty}</p>}
      <div className="pagination">
        {cursor && (
          <button
            type="button"
            className="secondary"
            onClick={() => setCursor(undefined)}
          >
            ←
          </button>
        )}
        {list.nextCursor && (
          <button
            type="button"
            className="secondary"
            onClick={() => setCursor(list.nextCursor ?? undefined)}
          >
            →
          </button>
        )}
      </div>
      <div className="columns">
        <section className="card">
          <h2>{t.manual}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <label>
              {t.title}
              <input
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <button disabled={busy} type="submit">
              {t.create}
            </button>
          </form>
        </section>
        <section className="card">
          <h2>{t.import}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void importSource();
            }}
          >
            <label>
              {t.method}
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "loose" | "structured")
                }
              >
                <option value="loose">{t.loose}</option>
                <option value="structured">{t.structured}</option>
              </select>
            </label>
            <label>
              {t.paste}
              <textarea
                rows={6}
                dir="auto"
                value={text}
                disabled={!!file}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <label>
              {t.upload}
              <input
                type="file"
                accept=".md,.markdown,.txt,.zip"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="hint">{t.importHint}</p>
            <button disabled={busy || (!file && !text.trim())} type="submit">
              {t.propose}
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
