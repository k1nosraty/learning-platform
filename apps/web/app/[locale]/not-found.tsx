"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { catalogs } from "../../../../packages/contracts/src/locales";
import { Shell } from "../../components/shell";
export default function NotFound() {
  const locale = usePathname().split("/")[1] === "fa" ? "fa" : "en";
  const t = catalogs[locale];
  return (
    <Shell locale={locale}>
      <section className="card">
        <h1>{t.notFound}</h1>
        <Link href={`/${locale}/workspaces`}>{t.back}</Link>
      </section>
    </Shell>
  );
}
