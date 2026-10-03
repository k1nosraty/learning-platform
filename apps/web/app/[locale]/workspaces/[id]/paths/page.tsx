import { PathLibrary } from "../../../../../components/path-library";
import { contentPage } from "../../../../../lib/server/content-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, workspace } = await contentPage(await params);
  return <PathLibrary locale={locale} workspace={workspace} />;
}
