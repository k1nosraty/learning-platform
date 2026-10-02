import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sessionActor } from "../../../../../../packages/application/src/auth";
import { readWorkspace } from "../../../../../../packages/application/src/workspaces";
import { isLocale } from "../../../../../../packages/contracts/src/locales";
import { DomainError } from "../../../../../../packages/domain/src/workspaces/permissions";
import { WorkspaceAdmin } from "../../../../components/workspace-admin";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^[-a-f0-9]{36}$/.test(id)) notFound();
  const actor = await sessionActor(await headers());
  if (!actor || !actor.emailVerified) redirect(`/${locale}/login`);
  try {
    const workspace = await readWorkspace(actor, id);
    return <WorkspaceAdmin locale={locale} initial={workspace} />;
  } catch (e) {
    if (e instanceof DomainError && e.status === 404) notFound();
    throw e;
  }
}
