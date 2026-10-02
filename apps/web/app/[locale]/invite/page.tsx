import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { sessionActor } from "../../../../../packages/application/src/auth";
import {
  catalogs,
  isLocale,
} from "../../../../../packages/contracts/src/locales";
import { Invite } from "../../../components/invite";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await sessionActor(await headers());
  return (
    <Suspense fallback={catalogs[locale].loading}>
      <Invite locale={locale} signedIn={!!actor && actor.emailVerified} />
    </Suspense>
  );
}
