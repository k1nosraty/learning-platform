"use client";
import { useState } from "react";
import {
  type Canonical,
  type ContentNode,
  childrenAllowed,
  type Kind,
  kinds,
  newNode,
} from "../../../packages/contracts/src/content";
import { contentCatalogs } from "../../../packages/contracts/src/content-locales";
import { designCatalogs } from "../../../packages/contracts/src/design-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { ConfirmDialog } from "./confirm-dialog";
import { Icon } from "./icon";
import { SafeMarkdown } from "./safe-markdown";

export function ContentEditor({
  doc,
  onChange,
  locale,
  disabled = false,
}: {
  doc: Canonical;
  onChange: (doc: Canonical) => void;
  locale: Locale;
  disabled?: boolean;
}) {
  const t = contentCatalogs[locale],
    d = designCatalogs[locale];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selected, setSelected] = useState<string | null>(
    doc.nodes[0]?.id ?? null,
  );
  const [addKind, setAddKind] = useState<Kind>("lesson");
  const [notice, setNotice] = useState("");
  const node = doc.nodes.find((n) => n.id === selected);
  const descendants = (id: string) => {
    const result = new Set<string>([id]);
    for (let i = 0; i < doc.nodes.length; i++) {
      let changed = false;
      for (const n of doc.nodes)
        if (n.parentId && result.has(n.parentId) && !result.has(n.id)) {
          result.add(n.id);
          changed = true;
        }
      if (!changed) break;
    }
    return result;
  };
  const blocked = node ? descendants(node.id) : new Set<string>();
  function update(patch: Partial<ContentNode>) {
    if (!node) return;
    onChange({
      ...doc,
      nodes: doc.nodes.map((n) => (n.id === node.id ? { ...n, ...patch } : n)),
    });
  }
  function add() {
    let parent: ContentNode | undefined;
    if (node && childrenAllowed[node.kind].includes(addKind)) parent = node;
    else if (!childrenAllowed.root.includes(addKind))
      parent = doc.nodes.find((n) => childrenAllowed[n.kind].includes(addKind));
    if (!parent && !childrenAllowed.root.includes(addKind)) {
      setNotice(t.missingParent);
      return;
    }
    const created = newNode(
      addKind,
      `n-${crypto.randomUUID()}`,
      t.newNode,
      parent?.id ?? null,
      Math.max(
        -1,
        ...doc.nodes
          .filter((n) => n.parentId === (parent?.id ?? null))
          .map((n) => n.order),
      ) + 1,
    );
    const nodes = doc.nodes.map((n) =>
      n.id === parent?.id && ["task", "exercise"].includes(addKind)
        ? { ...n, completion: null }
        : n,
    );
    onChange({ ...doc, nodes: [...nodes, created] });
    setSelected(created.id);
    setNotice("");
  }
  function move(direction: number) {
    if (!node) return;
    const siblings = doc.nodes
        .filter((n) => n.parentId === node.parentId)
        .sort((a, b) => a.order - b.order),
      index = siblings.findIndex((n) => n.id === node.id),
      other = siblings[index + direction];
    if (!other) return;
    onChange({
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.id === node.id
          ? { ...n, order: other.order }
          : n.id === other.id
            ? { ...n, order: node.order }
            : n,
      ),
    });
  }
  function depth(n: ContentNode) {
    let d = 0;
    const visited = new Set([n.id]);
    let parent = n.parentId;
    while (parent) {
      if (visited.has(parent)) break;
      visited.add(parent);
      d++;
      parent = doc.nodes.find((x) => x.id === parent)?.parentId ?? null;
    }
    return Math.min(d, 4);
  }
  function flatten(
    parent: string | null,
    seen = new Set<string>(),
  ): ContentNode[] {
    return doc.nodes
      .filter((n) => n.parentId === parent && !seen.has(n.id))
      .sort((a, b) => a.order - b.order)
      .flatMap((n) => {
        seen.add(n.id);
        return [n, ...flatten(n.id, seen)];
      });
  }
  const ordered = flatten(null);
  for (const n of doc.nodes) if (!ordered.includes(n)) ordered.push(n);
  const taskChildren =
    node &&
    doc.nodes.some(
      (n) => n.parentId === node.id && ["task", "exercise"].includes(n.kind),
    );
  const completion = node?.completion
    ? `${node.completion.rule}-${node.completion.required ? "required" : "optional"}`
    : "none";
  return (
    <div className="content-editor">
      <fieldset disabled={disabled} className="card path-meta">
        <legend>{t.draft}</legend>
        <div className="columns">
          <label>
            {t.title}
            <input
              value={doc.title}
              maxLength={200}
              onChange={(e) => onChange({ ...doc, title: e.target.value })}
            />
          </label>
          <label>
            {t.contentLanguage}
            <input
              value={doc.language}
              maxLength={35}
              dir="ltr"
              onChange={(e) => onChange({ ...doc, language: e.target.value })}
            />
          </label>
        </div>
        <label>
          {t.description}
          <textarea
            rows={3}
            value={doc.description}
            maxLength={10000}
            onChange={(e) => onChange({ ...doc, description: e.target.value })}
          />
        </label>
      </fieldset>
      <div className="editor-layout">
        <aside className="card structure">
          <h2 className="section-title">
            <Icon name="layers" />
            {t.structure}
          </h2>
          <div className="node-add">
            <label>
              {t.kind}
              <select
                value={addKind}
                disabled={disabled}
                onChange={(e) => setAddKind(e.target.value as Kind)}
              >
                {kinds.map((k) => (
                  <option value={k} key={k}>
                    {t[k]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={disabled || doc.nodes.length >= 1000}
              onClick={add}
            >
              <Icon name="plus" />
              {t.add}
            </button>
          </div>
          <p className="hint">{t.addHelp}</p>
          {notice && <output>{notice}</output>}
          <nav aria-label={t.structure}>
            <ol className="node-tree">
              {ordered.map((n) => (
                <li
                  key={n.id}
                  style={{ paddingInlineStart: `${depth(n) * 12}px` }}
                >
                  <button
                    type="button"
                    className={`node-button ${selected === n.id ? "selected" : ""}`}
                    aria-current={selected === n.id ? "true" : undefined}
                    onClick={() => setSelected(n.id)}
                  >
                    <span className="node-kind">{t[n.kind]}</span>
                    <bdi>{n.title || t.newNode}</bdi>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          {!doc.nodes.length && <p>{t.noNodes}</p>}
        </aside>
        <section className="card node-form">
          {node ? (
            <fieldset disabled={disabled}>
              <legend>{t.edit}</legend>
              <div className="node-toolbar">
                <span className="badge">{t[node.kind]}</span>
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => move(-1)}
                  >
                    <Icon name="moveUp" />
                    {t.up}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => move(1)}
                  >
                    <Icon name="moveDown" />
                    {t.down}
                  </button>
                </div>
              </div>
              <details className="metadata-details">
                <summary>{t.nodeId}</summary>
                <p className="hint">
                  <bdi>{node.id}</bdi>
                </p>
              </details>
              <label>
                {t.nodeTitle}
                <input
                  value={node.title}
                  maxLength={200}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <label>
                {t.parent}
                <select
                  value={node.parentId ?? ""}
                  onChange={(e) => {
                    const parentId = e.target.value || null;
                    update({
                      parentId,
                      order:
                        Math.max(
                          -1,
                          ...doc.nodes
                            .filter(
                              (n) =>
                                n.parentId === parentId && n.id !== node.id,
                            )
                            .map((n) => n.order),
                        ) + 1,
                    });
                  }}
                >
                  {childrenAllowed.root.includes(node.kind) && (
                    <option value="">{t.root}</option>
                  )}
                  {doc.nodes
                    .filter(
                      (n) =>
                        !blocked.has(n.id) &&
                        childrenAllowed[n.kind].includes(node.kind),
                    )
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                </select>
                <span className="hint">{t.parentHelp}</span>
              </label>
              <div className="columns">
                <label>
                  {t.minutes}
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={node.estimatedMinutes ?? ""}
                    onChange={(e) =>
                      update({
                        estimatedMinutes: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </label>
                <label>
                  {t.difficulty}
                  <select
                    value={node.difficulty ?? ""}
                    onChange={(e) =>
                      update({
                        difficulty: (e.target.value ||
                          null) as ContentNode["difficulty"],
                      })
                    }
                  >
                    <option value="">{t.unknown}</option>
                    {["beginner", "intermediate", "advanced"].map((k) => (
                      <option key={k} value={k}>
                        {t[k as "beginner"]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                {t.tags}
                <input
                  key={node.id}
                  defaultValue={node.tags.join(", ")}
                  onBlur={(e) =>
                    update({
                      tags: e.target.value
                        .split(/[,،]/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              {["lesson", "task", "exercise", "project"].includes(
                node.kind,
              ) && (
                <label>
                  {t.completion}
                  <select
                    aria-label={t.completion}
                    disabled={
                      disabled || (node.kind === "lesson" && !!taskChildren)
                    }
                    value={completion}
                    onChange={(e) => {
                      const [rule, required] = e.target.value.split("-");
                      update({
                        completion:
                          rule === "none"
                            ? null
                            : {
                                rule: rule as "self" | "approval",
                                required: required === "required",
                              },
                      });
                    }}
                  >
                    {node.kind === "lesson" && (
                      <option value="none">{t.reference}</option>
                    )}
                    <option value="self-required">{t.selfRequired}</option>
                    <option value="self-optional">{t.selfOptional}</option>
                    {node.kind === "project" && (
                      <>
                        <option value="approval-required">
                          {t.approvalRequired}
                        </option>
                        <option value="approval-optional">
                          {t.approvalOptional}
                        </option>
                      </>
                    )}
                  </select>
                  {node.kind === "lesson" && taskChildren && (
                    <span className="hint">{t.aggregate}</span>
                  )}
                </label>
              )}
              {node.kind === "resource" && (
                <label>
                  {t.resourceUrl}
                  <input
                    dir="ltr"
                    value={node.resourceUrl ?? ""}
                    onChange={(e) => update({ resourceUrl: e.target.value })}
                  />
                </label>
              )}
              <label>
                {t.body}
                <textarea
                  rows={12}
                  dir="auto"
                  value={node.body}
                  maxLength={200000}
                  onChange={(e) => update({ body: e.target.value })}
                />
              </label>
              <details open>
                <summary>{t.bodyPreview}</summary>
                <SafeMarkdown body={node.body} locale={locale} />
              </details>
              <div className="delete-node">
                <p className="hint">{t.deleteHelp}</p>
                <button
                  type="button"
                  className="secondary danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Icon name="trash" />
                  {t.delete}
                </button>
              </div>
            </fieldset>
          ) : (
            <div className="empty-state editor-empty">
              <span className="empty-symbol">
                <Icon name="file" />
              </span>
              <h3>{d.noSelection}</h3>
              <p>{d.noSelectionHint}</p>
            </div>
          )}
        </section>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          locale={locale}
          title={d.confirmDelete}
          hint={d.confirmDeleteHint}
          confirm={d.delete}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            onChange({
              ...doc,
              nodes: doc.nodes.filter((n) => !blocked.has(n.id)),
            });
            setSelected(null);
            setConfirmDelete(false);
          }}
        />
      )}
    </div>
  );
}
