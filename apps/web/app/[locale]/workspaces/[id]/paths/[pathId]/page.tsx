import { notFound } from "next/navigation";
import { uuid } from "../../../../../../../../packages/contracts/src/foundation";
import { PathEditor } from "../../../../../../components/path-editor";
import { contentPage } from "../../../../../../lib/server/content-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string; pathId: string }>;
}) {
  const p = await params;
  if (!uuid.safeParse(p.pathId).success) notFound();
  const { locale, workspace, actor } = await contentPage(p);
  return (
    <PathEditor
      locale={locale}
      workspace={workspace}
      pathId={p.pathId}
      userId={actor.id}
    />
  );
}
