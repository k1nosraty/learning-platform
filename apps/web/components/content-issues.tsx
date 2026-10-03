import type { ContentIssue } from "../../../packages/contracts/src/content";
import {
  contentCatalogs,
  contentIssues,
} from "../../../packages/contracts/src/content-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";

export function ContentIssues({
  issues,
  locale,
}: {
  issues: ContentIssue[];
  locale: Locale;
}) {
  const t = contentCatalogs[locale];
  return (
    <ul className="issue-list">
      {issues.map((i, index) => (
        <li key={`${i.code}:${i.pointer}:${index}`}>
          <span>
            {contentIssues[locale][i.code as keyof typeof contentIssues.en] ??
              t.issueFallback}
          </span>
          {i.pointer && <code dir="ltr">{i.pointer}</code>}
          {i.file && (
            <bdi>
              {i.file}
              {i.line ? ` · ${t.sourceLine} ${i.line}` : ""}
            </bdi>
          )}
        </li>
      ))}
    </ul>
  );
}
