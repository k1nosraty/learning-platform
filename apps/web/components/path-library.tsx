"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { contentCatalogs } from "../../../packages/contracts/src/content-locales";
import { designCatalogs } from "../../../packages/contracts/src/design-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { contentApi } from "../lib/content-client";
import { Icon } from "./icon";
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
  workspace: { id: string; name: string; role?: string };
}) {
  const t = contentCatalogs[locale],
    d = designCatalogs[locale],
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
  const [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setLoading(true);
    let current = true;
    contentApi<PathList>(`${base}/paths${cursor ? `?cursor=${cursor}` : ""}`)
      .then((result) => {
        if (current) {
          setList(result);
          setMessage("");
        }
      })
      .catch((e) => {
        if (current) setMessage(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [base, cursor, retry]);
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
    <Shell locale={locale} signedIn workspace={workspace}>
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
        <span className="badge">
          <Icon name="shield" />
          {t.draftOnly}
        </span>
      </div>
      <p className="page-intro">{d.libraryIntro}</p>
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
      {loading && (
        <output className="loading-panel">
          <span className="spinner" aria-hidden="true" />
          {d.loadingPaths}
        </output>
      )}
      <section className="workspace-grid path-grid" aria-busy={loading}>
        {list.items.map((p) => (
          <article className="card path-card" key={p.id}>
            <div className="card-topline">
              <span className="tile-icon">
                <Icon name="book" />
              </span>
              <span
                className={`badge ${p.archivedAt ? "badge-archived" : p.publishedVersionId ? "badge-published" : "badge-draft"}`}
              >
                {p.archivedAt
                  ? t.archived
                  : p.publishedVersionId
                    ? t.published
                    : t.draft}
              </span>
            </div>
            <h2>
              <bdi>{p.title}</bdi>
            </h2>
            <p>
              <Icon name="globe" />
              <bdi>{p.language}</bdi>
            </p>
            <div className="actions">
              <Link
                className="button secondary"
                href={`/${locale}/workspaces/${workspace.id}/paths/${p.id}`}
              >
                <Icon name="edit" />
                {t.edit}
              </Link>
              {p.publishedVersionId && (
                <Link
                  href={`/${locale}/workspaces/${workspace.id}/paths/${p.id}/versions/${p.publishedVersionId}`}
                >
                  <Icon name="eye" />
                  {t.read}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>
      {!loading && !list.items.length && !message && (
        <section className="empty-state">
          <span className="empty-symbol">
            <Icon name="book" />
          </span>
          <h2>{d.emptyTitle}</h2>
          <p>{d.emptyHint}</p>
          <a href="#create-path" className="button secondary">
            <Icon name="plus" />
            {t.create}
          </a>
        </section>
      )}
      {!loading && message && (
        <button
          className="secondary"
          type="button"
          onClick={() => setRetry(retry + 1)}
        >
          {designCatalogs[locale].retry}
        </button>
      )}
      <div className="pagination">
        {cursor && (
          <button
            type="button"
            className="secondary"
            onClick={() => setCursor(undefined)}
          >
            <Icon name="arrow" className="directional reverse" />
            {d.first}
          </button>
        )}
        {list.nextCursor && (
          <button
            type="button"
            className="secondary"
            onClick={() => setCursor(list.nextCursor ?? undefined)}
          >
            {d.next}
            <Icon name="arrow" className="directional" />
          </button>
        )}
      </div>
      <div className="creation-heading" id="create-path">
        <h2>{d.createSection}</h2>
      </div>
      <div className="columns creation-panels">
        <section className="card">
          <div className="section-heading">
            <span className="tile-icon">
              <Icon name="edit" />
            </span>
            <div>
              <h2>{t.manual}</h2>
              <p className="hint">{d.createHint}</p>
            </div>
          </div>
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
              <Icon name="plus" />
              {t.create}
            </button>
          </form>
        </section>
        <section className="card">
          <div className="section-heading">
            <span className="tile-icon lavender">
              <Icon name="upload" />
            </span>
            <div>
              <h2>{t.import}</h2>
              <p className="hint">{d.importHint}</p>
            </div>
          </div>
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
              <span className="upload-zone">
                <input
                  ref={upload}
                  className="file-picker"
                  aria-label={t.upload}
                  type="file"
                  accept=".md,.markdown,.txt,.zip"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="upload-prompt">
                  <Icon name="upload" />
                  <span>{file ? <bdi>{file.name}</bdi> : d.chooseFile}</span>
                </span>
              </span>
            </label>
            <p className="hint">{d.fileHint}</p>
            {file && (
              <div className="selected-file">
                <Icon name="file" />
                <bdi>{file.name}</bdi>
                <button
                  type="button"
                  className="icon-button secondary"
                  aria-label={d.clearFile}
                  onClick={() => {
                    setFile(null);
                    if (upload.current) upload.current.value = "";
                  }}
                >
                  <Icon name="close" />
                </button>
              </div>
            )}
            <p className="hint">{t.importHint}</p>
            <button disabled={busy || (!file && !text.trim())} type="submit">
              <Icon name="upload" />
              {t.propose}
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
