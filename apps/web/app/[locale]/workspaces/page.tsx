import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sessionActor } from "../../../../../packages/application/src/auth";
import { listWorkspaces } from "../../../../../packages/application/src/workspaces";
import { isLocale } from "../../../../../packages/contracts/src/locales";
import { Workspaces } from "../../../components/workspaces";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await sessionActor(await headers());
  if (!actor || !actor.emailVerified) redirect(`/${locale}/login`);
  return <Workspaces locale={locale} initial={await listWorkspaces(actor)} />;
}
