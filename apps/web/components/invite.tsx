"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { catalogs } from "../../../packages/contracts/src/locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { api } from "../lib/api-client";
import { Shell } from "./shell";
export function Invite({
  locale,
  signedIn,
}: {
  locale: Locale;
  signedIn: boolean;
}) {
  const t = catalogs[locale];
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell locale={locale} signedIn={signedIn}>
      <section className="card auth">
        <h1>{t.invitations}</h1>
        <p>{t.inviteIntro}</p>
        {signedIn ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const data = await api<{ workspaceId: string }>(
                  "invitations/accept",
                  "POST",
                  { token },
                );
                router.replace(`/${locale}/workspaces/${data.workspaceId}`);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? t.loading : t.accept}
          </button>
        ) : (
          <Link
            className="button"
            href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/invite?token=${token}`)}`}
          >
            {t.login}
          </Link>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
    </Shell>
  );
}
