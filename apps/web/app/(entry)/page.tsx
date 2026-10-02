import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionActor } from "../../../../packages/application/src/auth";
import { resolveLocale } from "../../../../packages/contracts/src/locales";
export default async function Entry() {
  const h = await headers();
  const actor = await sessionActor(h);
  const cookie = (await cookies()).get("locale")?.value;
  const locale = resolveLocale(
    undefined,
    actor?.preferredLocale,
    cookie,
    h.get("accept-language") ?? undefined,
  );
  redirect(`/${locale}/${actor ? "workspaces" : "login"}`);
}
