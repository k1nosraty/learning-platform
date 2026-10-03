import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { catalogs, isLocale } from "../../../../packages/contracts/src/locales";
import "@fontsource-variable/inter";
import "@fontsource-variable/vazirmatn";
import "../styles.css";
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = catalogs[isLocale(locale) ? locale : "en"];
  return { title: t.brand, description: t.intro };
}
