import { notFound } from "next/navigation";
import { uuid } from "../../../../../../../../packages/contracts/src/foundation";
import { ImportPreview } from "../../../../../../components/import-preview";
import { contentPage } from "../../../../../../lib/server/content-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string; importId: string }>;
}) {
  const p = await params;
  if (!uuid.safeParse(p.importId).success) notFound();
  const { locale, workspace, actor } = await contentPage(p);
  return (
    <ImportPreview
      locale={locale}
      workspace={workspace}
      importId={p.importId}
      userId={actor.id}
    />
  );
}
