import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { contentCatalogs } from "../../../packages/contracts/src/content-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";

export function contentHref(url: string, assetBase?: string) {
  if (/^#[A-Za-z0-9_-]+$/.test(url)) return url;
  if (url.startsWith("assets/"))
    return assetBase ? `${assetBase}?name=${encodeURIComponent(url)}` : "";
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !/[\p{Cc}\s\\]/u.test(url)
      ? url
      : "";
  } catch {
    return "";
  }
}
export function SafeMarkdown({
  body,
  locale,
  assetBase,
}: {
  body: string;
  locale: Locale;
  assetBase?: string;
}) {
  return (
    <div className="markdown" dir="auto">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => contentHref(url, assetBase)}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                target={href.startsWith("https:") ? "_blank" : undefined}
                rel="noreferrer"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ src, alt }) =>
            typeof src === "string" && src.startsWith("/api/") ? (
              <img src={src} alt={alt ?? ""} loading="lazy" />
            ) : src ? (
              <a href={String(src)} target="_blank" rel="noreferrer">
                {alt ?? contentCatalogs[locale].safeImages}
              </a>
            ) : (
              <span>{alt}</span>
            ),
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
