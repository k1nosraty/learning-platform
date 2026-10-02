import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale } from "../../../../packages/contracts/src/locales";
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
export const metadata = {
  title: "Learning Platform",
  description: "Learning workspaces for individuals and teams",
};
