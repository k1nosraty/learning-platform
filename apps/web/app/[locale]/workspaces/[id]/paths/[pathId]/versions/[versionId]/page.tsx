import Link from "next/link";
import { notFound } from "next/navigation";
import { readVersion } from "../../../../../../../../../../packages/application/src/content";
import type { Canonical } from "../../../../../../../../../../packages/contracts/src/content";
import { contentCatalogs } from "../../../../../../../../../../packages/contracts/src/content-locales";
import { uuid } from "../../../../../../../../../../packages/contracts/src/foundation";
import { DomainError } from "../../../../../../../../../../packages/domain/src/workspaces/permissions";
import { Icon } from "../../../../../../../../components/icon";
import {
  contentHref,
  SafeMarkdown,
} from "../../../../../../../../components/safe-markdown";
import { Shell } from "../../../../../../../../components/shell";
import { contentPage } from "../../../../../../../../lib/server/content-pages";
export default async function Page({
  params,
}: {
  params: Promise<{
    locale: string;
    id: string;
    pathId: string;
    versionId: string;
  }>;
}) {
  const p = await params;
  if (!uuid.safeParse(p.pathId).success || !uuid.safeParse(p.versionId).success)
    notFound();
  const { locale, workspace, actor } = await contentPage(p, false),
    t = contentCatalogs[locale];
  let version: Awaited<ReturnType<typeof readVersion>>;
  try {
    version = await readVersion(actor, p.id, p.pathId, p.versionId);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const doc = version.canonical as Canonical,
    base = `/api/v1/workspaces/${p.id}/paths/${p.pathId}/versions/${p.versionId}`;
  const editable = ["owner", "manager"].includes(workspace.role);
  function nodes(parent: string | null): typeof doc.nodes {
    return doc.nodes
      .filter((n) => n.parentId === parent)
      .sort((a, b) => a.order - b.order)
      .flatMap((n) => [n, ...nodes(n.id)]);
  }
  return (
    <Shell locale={locale} signedIn workspace={workspace}>
      {editable && (
        <Link
          className="section-link"
          href={`/${locale}/workspaces/${p.id}/paths/${p.pathId}`}
        >
          {t.edit}
        </Link>
      )}
      <p className="eyebrow">
        {workspace.name} · {t.version} {version.number}
      </p>
      <h1 dir="auto">{doc.title}</h1>
      <p>{t.publishedReadonly}</p>
      <SafeMarkdown
        locale={locale}
        body={doc.description}
        assetBase={`${base}/assets`}
      />
      {editable && (
        <a className="button" href={`${base}/export`}>
          <Icon name="download" />
          {t.export}
        </a>
      )}
      <div className="published-layout">
        <nav className="card" aria-label={t.structure}>
          <h2>{t.structure}</h2>
          <ol>
            {nodes(null).map((n) => (
              <li key={n.id}>
                <a href={`#node-${n.id}`}>
                  <bdi>{n.title}</bdi>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div>
          {nodes(null).map((n) => (
            <article
              className="card published-node"
              id={`node-${n.id}`}
              key={n.id}
            >
              <span className="badge">{t[n.kind]}</span>
              <h2 dir="auto">{n.title}</h2>
              {n.completion && (
                <p className="hint">
                  {n.completion.required ? t.requiredUnits : t.optionalUnits} ·{" "}
                  {n.completion.rule === "approval"
                    ? t.approvalRequired
                    : t.selfRequired}
                </p>
              )}
              <SafeMarkdown
                locale={locale}
                body={n.body}
                assetBase={`${base}/assets`}
              />
              {n.resourceUrl &&
                contentHref(n.resourceUrl, `${base}/assets`) && (
                  <a
                    href={contentHref(n.resourceUrl, `${base}/assets`)}
                    rel="noreferrer"
                    target={
                      n.resourceUrl.startsWith("https:") ? "_blank" : undefined
                    }
                  >
                    {n.title}
                  </a>
                )}
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
