import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { sessionActor } from "../../../../packages/application/src/auth";
import { readWorkspace } from "../../../../packages/application/src/workspaces";
import { uuid } from "../../../../packages/contracts/src/foundation";
import { isLocale } from "../../../../packages/contracts/src/locales";
import { DomainError } from "../../../../packages/domain/src/workspaces/permissions";

export async function contentPage(
  params: { locale: string; id: string },
  edit = true,
) {
  if (!isLocale(params.locale) || !uuid.safeParse(params.id).success)
    notFound();
  const actor = await sessionActor(await headers());
  if (!actor || !actor.emailVerified) redirect(`/${params.locale}/login`);
  try {
    const workspace = await readWorkspace(actor, params.id);
    if (edit && !["owner", "manager"].includes(workspace.role)) notFound();
    return { locale: params.locale, actor, workspace };
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
}
