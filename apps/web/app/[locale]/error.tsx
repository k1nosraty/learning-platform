"use client";
import { usePathname } from "next/navigation";
import { catalogs } from "../../../../packages/contracts/src/locales";
import { Shell } from "../../components/shell";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const locale = usePathname().split("/")[1] === "fa" ? "fa" : "en";
  const t = catalogs[locale];
  return (
    <Shell locale={locale}>
      <section className="card">
        <h1>{t.authError}</h1>
        <button type="button" onClick={reset}>
          {t.retry}
        </button>
      </section>
    </Shell>
  );
}
