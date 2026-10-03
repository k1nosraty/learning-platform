"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type Canonical,
  type ContentIssue,
  canonicalSchema,
  type DraftDto,
} from "../../../packages/contracts/src/content";
import { contentCatalogs } from "../../../packages/contracts/src/content-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { ApiError, contentApi } from "../lib/content-client";
import { ContentEditor } from "./content-editor";
import { ContentIssues } from "./content-issues";
import { Shell } from "./shell";

export function PathEditor({
  locale,
  workspace,
  pathId,
  userId,
}: {
  locale: Locale;
  workspace: { id: string; name: string; type: string };
  pathId: string;
  userId: string;
}) {
  const t = contentCatalogs[locale],
    base = `/api/v1/workspaces/${workspace.id}/paths/${pathId}`,
    storageKey = `content-draft:${userId}:${workspace.id}:${pathId}`;
  const [draft, setDraft] = useState<DraftDto | null>(null),
    [doc, setDoc] = useState<Canonical | null>(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [issues, setIssues] = useState<ContentIssue[]>([]),
    [conflict, setConflict] = useState(false);
  const persisted = useRef(true);
  const operationKey = useRef<{ request: string; key: string } | null>(null);
  async function load(discard = false) {
    const saved = await contentApi<DraftDto>(`${base}/draft`);
    let local: { canonical: Canonical; revision: number } | null = null;
    try {
      if (discard) sessionStorage.removeItem(storageKey);
      else {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const candidate = JSON.parse(raw);
          if (
            canonicalSchema.safeParse(candidate.canonical).success &&
            Number.isInteger(candidate.revision)
          )
            local = candidate;
        }
      }
    } catch {
      local = null;
    }
    setDraft(local ? { ...saved, revision: local.revision } : saved);
    setDoc(local?.canonical ?? saved.canonical);
    setDirty(!!local);
    setConflict(!!local && local.revision !== saved.revision);
  }
  useEffect(() => {
    void load().catch((e) => setMessage(e.message));
  }, [base, storageKey]);
  useEffect(() => {
    persisted.current = true;
    if (!doc || !draft) return;
    try {
      if (dirty)
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ canonical: doc, revision: draft.revision }),
        );
      else sessionStorage.removeItem(storageKey);
    } catch {
      persisted.current = false;
    }
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [doc, draft, dirty, storageKey]);
  async function run(action: "save" | "publish" | "start" | "archive") {
    if (!draft || !doc) return;
    setBusy(true);
    setMessage("");
    setIssues([]);
    const body =
      action === "save"
        ? { canonical: doc, expectedRevision: draft.revision }
        : { expectedRevision: draft.revision };
    const intent = JSON.stringify({ action, body });
    if (operationKey.current?.request !== intent)
      operationKey.current = { request: intent, key: crypto.randomUUID() };
    try {
      await contentApi(
        `${base}/${action === "save" ? "draft" : action}`,
        action === "save" ? "PUT" : "POST",
        body,
        action === "save" ? undefined : operationKey.current.key,
      );
      operationKey.current = null;
      await load(true);
      setMessage(
        action === "save"
          ? t.saved
          : action === "publish"
            ? t.publishedMessage
            : action === "start"
              ? t.startedMessage
              : t.archiveMessage,
      );
      setConflict(false);
    } catch (e) {
      setMessage((e as Error).message);
      if (e instanceof ApiError) {
        setIssues(e.details);
        if (e.code === "REVISION_CONFLICT") setConflict(true);
      }
    } finally {
      setBusy(false);
    }
  }
  const approval =
    doc?.nodes.filter((n) => n.completion?.rule === "approval") ?? [];
  return (
    <Shell
      locale={locale}
      signedIn
      canChangeLocale={() => {
        if (!dirty || persisted.current) return true;
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
      <div className="page-heading">
        <div>
          <p className="eyebrow">{workspace.name}</p>
          <h1>
            <bdi>{doc?.title ?? t.draft}</bdi>
          </h1>
        </div>
        <span className="badge">
          {draft?.archived ? t.archived : dirty ? t.unsaved : t.draft}
        </span>
      </div>
      {message && (
        <output className={issues.length ? "error" : "success"}>
          {message}
        </output>
      )}
      {conflict && (
        <p role="alert" className="error">
          {t.conflict}
        </p>
      )}
      {issues.length > 0 && (
        <section className="card error">
          <h2>{t.errors}</h2>
          <ContentIssues locale={locale} issues={issues} />
        </section>
      )}
      {!draft || !doc ? (
        <p>{t.loading}</p>
      ) : (
        <>
          <div className="editor-actions card">
            <p className="hint">
              {t.revision}: <bdi>{draft.revision}</bdi> · {t.requiredUnits}:{" "}
              {doc.nodes.filter((n) => n.completion?.required).length} ·{" "}
              {t.optionalUnits}:{" "}
              {
                doc.nodes.filter((n) => n.completion && !n.completion.required)
                  .length
              }
            </p>
            <div className="actions">
              <button
                type="button"
                disabled={busy || draft.archived || !dirty}
                onClick={() => void run("save")}
              >
                {t.save}
              </button>
              <button
                type="button"
                disabled={busy || draft.archived || dirty || conflict}
                onClick={() => void run("publish")}
              >
                {t.publish}
              </button>
              {workspace.type === "personal" && (
                <button
                  type="button"
                  disabled={busy || draft.archived || dirty || conflict}
                  onClick={() => void run("start")}
                >
                  {t.start}
                </button>
              )}
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() =>
                  void load(true).catch((e) => setMessage(e.message))
                }
              >
                {t.reload}
              </button>
              <button
                type="button"
                className="secondary danger"
                disabled={busy || draft.archived || dirty || conflict}
                onClick={() => void run("archive")}
              >
                {t.archive}
              </button>
            </div>
            {dirty && <p className="hint">{t.saveFirst}</p>}
          </div>
          {workspace.type === "personal" && approval.length > 0 && (
            <section className="card approval-preview">
              <h2>{t.conversion}</h2>
              <ul>
                {approval.map((n) => (
                  <li key={n.id}>
                    <bdi>{n.title}</bdi>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy || draft.archived}
                onClick={() => {
                  setDoc({
                    ...doc,
                    nodes: doc.nodes.map((n) =>
                      n.completion?.rule === "approval"
                        ? {
                            ...n,
                            completion: { ...n.completion, rule: "self" },
                          }
                        : n,
                    ),
                  });
                  setDirty(true);
                  setMessage(t.conversionDone);
                }}
              >
                {t.convert}
              </button>
            </section>
          )}
          <ContentEditor
            locale={locale}
            doc={doc}
            disabled={busy || draft.archived}
            onChange={(changed) => {
              setDoc(changed);
              setDirty(true);
              setMessage("");
            }}
          />
          <section className="card">
            <h2>{t.versions}</h2>
            {!draft.versions.length && <p>{t.noVersion}</p>}
            {draft.versions.map((v) => (
              <div className="row" key={v.id}>
                <div className="row-details">
                  <strong>
                    {t.version} {v.number}
                  </strong>
                  <p className="hash" dir="ltr">
                    {v.hash}
                  </p>
                </div>
                <Link
                  href={`/${locale}/workspaces/${workspace.id}/paths/${pathId}/versions/${v.id}`}
                >
                  {t.viewVersion}
                </Link>
                <a href={`${base}/versions/${v.id}/export`}>{t.export}</a>
              </div>
            ))}
          </section>
        </>
      )}
    </Shell>
  );
}
