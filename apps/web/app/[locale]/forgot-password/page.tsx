import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  catalogs,
  isLocale,
} from "../../../../../packages/contracts/src/locales";
import { AuthForm } from "../../../components/auth-form";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <Suspense fallback={catalogs[locale].loading}>
      <AuthForm locale={locale} mode="forgot" />
    </Suspense>
  );
}
