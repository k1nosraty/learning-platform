"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  type Canonical,
  type ContentIssue,
  canonicalSchema,
  type ImportDto,
} from "../../../packages/contracts/src/content";
import { contentCatalogs } from "../../../packages/contracts/src/content-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { ApiError, contentApi } from "../lib/content-client";
import { ContentEditor } from "./content-editor";
import { ContentIssues } from "./content-issues";
import { Shell } from "./shell";

export function ImportPreview({
  locale,
  workspace,
  importId,
  userId,
}: {
  locale: Locale;
  workspace: { id: string; name: string };
  importId: string;
  userId: string;
}) {
  const t = contentCatalogs[locale],
    router = useRouter(),
    base = `/api/v1/workspaces/${workspace.id}/imports/${importId}`,
    storageKey = `content-import:${userId}:${workspace.id}:${importId}`;
  const [preview, setPreview] = useState<ImportDto | null>(null),
    [doc, setDoc] = useState<Canonical | null>(null),
    [ack, setAck] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [issues, setIssues] = useState<ContentIssue[]>([]);
  const confirmIntent = useRef<{ request: string; key: string } | null>(null),
    persisted = useRef(true);
  useEffect(() => {
    let active = true;
    contentApi<ImportDto>(base)
      .then((p) => {
        if (!active) return;
        setPreview(p);
        let local: Canonical | null = null;
        try {
          const raw = sessionStorage.getItem(storageKey);
          if (raw) {
            const value = JSON.parse(raw);
            if (canonicalSchema.safeParse(value.canonical).success) {
              local = value.canonical;
              setAck(!!value.ack);
            }
          }
        } catch {}
        setDoc(local ?? p.canonical);
        setIssues(p.errors);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [base, storageKey]);
  useEffect(() => {
    persisted.current = true;
    if (doc)
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ canonical: doc, ack }),
        );
      } catch {
        persisted.current = false;
      }
  }, [doc, ack, storageKey]);
  async function confirm() {
    if (!doc || !preview) return;
    setBusy(true);
    setMessage("");
    setIssues([]);
    const input = {
      canonical: doc,
      expectedRevision: preview.revision,
      acknowledgeWarnings: ack,
    };
    const request = JSON.stringify(input);
    if (confirmIntent.current?.request !== request)
      confirmIntent.current = { request, key: crypto.randomUUID() };
    try {
      const result = await contentApi<{ id: string }>(
        `${base}/confirm`,
        "POST",
        input,
        confirmIntent.current.key,
      );
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      router.push(`/${locale}/workspaces/${workspace.id}/paths/${result.id}`);
    } catch (e) {
      setMessage((e as Error).message);
      if (e instanceof ApiError) {
        setIssues(e.details);
        if (e.code === "IMPORT_CLOSED") {
          const fresh = await contentApi<ImportDto>(base);
          setPreview(fresh);
        }
      }
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    if (!preview) return;
    setBusy(true);
    try {
      await contentApi(
        `${base}/cancel`,
        "POST",
        { expectedRevision: preview.revision },
        crypto.randomUUID(),
      );
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      router.push(`/${locale}/workspaces/${workspace.id}/paths`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      locale={locale}
      signedIn
      canChangeLocale={() => {
        if (persisted.current) return true;
        setMessage(t.localeSave);
        return false;
      }}
    >
      <Link
        className="section-link"
        href={`/${locale}/workspaces/${workspace.id}/paths`}
      >
        {t.back}
      </Link>
      <p className="eyebrow">{workspace.name}</p>
      <h1>{t.preview}</h1>
      <p>{t.reviewHint}</p>
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
      {!preview ? (
        <p>{t.loading}</p>
      ) : (
        <>
          <section className="card">
            <p>
              <strong>{t.method}:</strong>{" "}
              {preview.method === "structured" ? t.structured : t.loose}
            </p>
            <div className="summary-strip">
              <span>
                {t.nodeCount.replace("{count}", String(doc?.nodes.length ?? 0))}
              </span>
              <span>
                {t.requiredUnits}:{" "}
                {doc?.nodes.filter((n) => n.completion?.required).length ?? 0}
              </span>
              <span>
                {t.warningCount.replace(
                  "{count}",
                  String(preview.warnings.length),
                )}
              </span>
            </div>
            <p className="hint">{t.importHint}</p>
          </section>
          {issues.length > 0 && (
            <section className="card error">
              <h2>{t.errors}</h2>
              <ContentIssues locale={locale} issues={issues} />
            </section>
          )}
          {preview.warnings.length > 0 && (
            <details className="card">
              <summary>
                {t.warnings} ({preview.warnings.length})
              </summary>
              <ContentIssues locale={locale} issues={preview.warnings} />
            </details>
          )}
          <details className="card">
            <summary>{t.source}</summary>
            <p className="hint">{t.retained}</p>
            {preview.source.map((s) => (
              <details key={s.filename}>
                <summary>
                  <bdi>{s.filename}</bdi> · {s.bytes}
                </summary>
                <p className="hash" dir="ltr">
                  {s.sha256}
                </p>
                {s.text !== null && (
                  <pre className="source-panel" dir="auto">
                    {s.text}
                  </pre>
                )}
              </details>
            ))}
          </details>
          <details className="card">
            <summary>{t.provenance}</summary>
            <ul>
              {preview.provenance.map((span, index) => (
                <li key={`${span.pointer}:${index}`}>
                  <code dir="ltr">{span.pointer}</code> <bdi>{span.file}</bdi> ·{" "}
                  {t.sourceLine} {span.startLine}–{span.endLine} ·{" "}
                  {span.classification === "extracted"
                    ? t.extracted
                    : t.inferred}
                </li>
              ))}
            </ul>
          </details>
          {doc && (
            <ContentEditor
              locale={locale}
              doc={doc}
              disabled={busy || preview.state !== "preview"}
              onChange={setDoc}
            />
          )}
          <section className="card">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              {t.acknowledge}
            </label>
            <div className="actions">
              <button
                type="button"
                disabled={
                  busy ||
                  !doc ||
                  preview.state !== "preview" ||
                  (preview.warnings.length > 0 && !ack)
                }
                onClick={() => void confirm()}
              >
                {t.confirm}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busy || preview.state !== "preview"}
                onClick={() => void cancel()}
              >
                {t.cancel}
              </button>
            </div>
            {preview.confirmedPathId && (
              <Link
                href={`/${locale}/workspaces/${workspace.id}/paths/${preview.confirmedPathId}`}
              >
                {t.edit}
              </Link>
            )}
            {!doc && (
              <Link href={`/${locale}/workspaces/${workspace.id}/paths`}>
                {t.modeChange}
              </Link>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}
