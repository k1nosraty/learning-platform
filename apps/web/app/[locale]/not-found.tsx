"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { designCatalogs } from "../../../../packages/contracts/src/design-locales";
import { catalogs } from "../../../../packages/contracts/src/locales";
import { Icon } from "../../components/icon";
import { Shell } from "../../components/shell";
export default function NotFound() {
  const locale = usePathname().split("/")[1] === "fa" ? "fa" : "en";
  const t = catalogs[locale];
  return (
    <Shell locale={locale}>
      <section className="card empty-state not-found-card">
        <span className="empty-symbol">
          <Icon name="folder" />
        </span>
        <h1>{t.notFound}</h1>
        <p>{designCatalogs[locale].notFoundHint}</p>
        <Link className="button secondary" href={`/${locale}/workspaces`}>
          {t.back}
        </Link>
      </section>
    </Shell>
  );
}
