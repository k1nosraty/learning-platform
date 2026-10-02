"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { catalogs } from "../../../packages/contracts/src/locales";
import type {
  Locale,
  Role,
} from "../../../packages/domain/src/workspaces/permissions";
import { api } from "../lib/api-client";
import { Shell } from "./shell";
import type { WorkspaceDTO } from "./workspaces";

interface Member {
  id: string;
  display_name: string;
  email: string;
  role: Role;
  status: "active" | "removed";
  revision: number;
}
interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "revoked";
  revision: number;
  expires_at: string;
}
interface Relationship {
  id: string;
  manager_membership_id: string;
  learner_membership_id: string;
}
interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
export function WorkspaceAdmin({
  locale,
  initial,
}: {
  locale: Locale;
  initial: WorkspaceDTO;
}) {
  const t = catalogs[locale];
  const [workspace, setWorkspace] = useState(initial);
  const [members, setMembers] = useState<Page<Member>>({
    items: [],
    nextCursor: null,
  });
  const [invitations, setInvitations] = useState<Page<Invitation>>({
    items: [],
    nextCursor: null,
  });
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [memberCursor, setMemberCursor] = useState<string>();
  const [inviteCursor, setInviteCursor] = useState<string>();
  const base = `workspaces/${workspace.id}`;
  const admin = workspace.role === "owner" || workspace.role === "manager";
  const owner = workspace.role === "owner";
  const organization = workspace.type === "organization";
  const load = useCallback(async () => {
    if (admin && organization) {
      const [m, i, r] = await Promise.all([
        api<Page<Member>>(
          `${base}/members${memberCursor ? `?cursor=${memberCursor}` : ""}`,
        ),
        api<Page<Invitation>>(
          `${base}/invitations${inviteCursor ? `?cursor=${inviteCursor}` : ""}`,
        ),
        api<Page<Relationship>>(`${base}/manager-learners`),
      ]);
      setMembers(m);
      setInvitations(i);
      setRelationships(r.items);
    }
  }, [base, admin, organization, memberCursor, inviteCursor]);
  useEffect(() => {
    let current = true;
    load().catch((e) => {
      if (current) setError(e.message);
    });
    return () => {
      current = false;
    };
  }, [load]);
  async function run(fn: () => Promise<unknown>) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
      await load();
      setNotice(t.saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const options = (allowed: Role[]) =>
    allowed.map((role) => (
      <option key={role} value={role}>
        {t[role]}
      </option>
    ));
  return (
    <Shell locale={locale} signedIn>
      <Link className="section-link" href={`/${locale}/workspaces`}>
        {t.back}
      </Link>
      <span className="badge">
        {t[workspace.type]} · {t[workspace.role]}
      </span>
      <h1>{workspace.name}</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <output className="success">{notice}</output>}
      {owner && (
        <section className="card">
          <h2>{t.settings}</h2>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              void run(async () => {
                const updated = await api<WorkspaceDTO>(
                  `${base}/settings`,
                  "PATCH",
                  {
                    name: d.get("name"),
                    timezone: d.get("timezone"),
                    defaultLocale: d.get("defaultLocale"),
                    expectedRevision: workspace.revision,
                  },
                );
                setWorkspace({ ...workspace, ...updated });
              });
            }}
          >
            <label>
              {t.name}
              <input
                name="name"
                required
                defaultValue={workspace.name}
                maxLength={120}
              />
            </label>
            <label>
              {t.timezone}
              <input
                name="timezone"
                dir="ltr"
                required
                defaultValue={workspace.timezone}
              />
            </label>
            <label>
              {t.defaultLocale}
              <select
                name="defaultLocale"
                defaultValue={workspace.default_locale}
              >
                <option value="en">English</option>
                <option value="fa">فارسی</option>
              </select>
            </label>
            <button type="submit" disabled={busy}>
              {t.save}
            </button>
          </form>
        </section>
      )}
      {admin && organization && (
        <>
          <section className="card">
            <h2>{t.members}</h2>
            {members.items.length === 0 && <p>{t.empty}</p>}
            {members.items.map((m) => (
              <div className="row" key={`${m.id}:${m.revision}`}>
                <div className="row-details">
                  <strong>{m.display_name}</strong>
                  <p>
                    <bdi>{m.email}</bdi> · {t[m.role]} · {t[m.status]}
                  </p>
                </div>
                {owner && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const d = new FormData(e.currentTarget);
                      void run(() =>
                        api(`${base}/members/${m.id}`, "PATCH", {
                          role: d.get("role"),
                          status: d.get("status"),
                          expectedRevision: m.revision,
                        }),
                      );
                    }}
                  >
                    <label>
                      {t.role}
                      <select name="role" defaultValue={m.role}>
                        {options(["owner", "manager", "mentor", "learner"])}
                      </select>
                    </label>
                    <label>
                      {t.status}
                      <select name="status" defaultValue={m.status}>
                        <option value="active">{t.active}</option>
                        <option value="removed">{t.removed}</option>
                      </select>
                    </label>
                    <button type="submit" className="secondary" disabled={busy}>
                      {t.updateMember}
                    </button>
                  </form>
                )}
              </div>
            ))}
            <div className="pagination">
              {memberCursor && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setMemberCursor(undefined)}
                >
                  {t.firstPage}
                </button>
              )}
              {members.nextCursor && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setMemberCursor(members.nextCursor ?? undefined)
                  }
                >
                  {t.nextPage}
                </button>
              )}
            </div>
          </section>
          <section className="card">
            <h2>{t.invitations}</h2>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const d = new FormData(form);
                void run(async () => {
                  await api(`${base}/invitations`, "POST", {
                    email: d.get("email"),
                    role: d.get("role"),
                    ...(d.get("managerMembershipId")
                      ? { managerMembershipId: d.get("managerMembershipId") }
                      : {}),
                  });
                  form.reset();
                });
              }}
            >
              <label>
                {t.email}
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  maxLength={254}
                />
              </label>
              <label>
                {t.role}
                <select name="role" defaultValue="learner">
                  {options(
                    owner
                      ? ["owner", "manager", "mentor", "learner"]
                      : ["mentor", "learner"],
                  )}
                </select>
              </label>
              {owner && (
                <label>
                  {t.optionalManager}
                  <input
                    name="managerMembershipId"
                    dir="ltr"
                    placeholder="UUID"
                  />
                </label>
              )}
              <button type="submit" disabled={busy}>
                {t.invite}
              </button>
            </form>
            {invitations.items.map((i) => (
              <div className="row" key={i.id}>
                <div className="row-details">
                  <bdi>{i.email}</bdi>
                  <p>
                    {t[i.role]} · {t[i.status]} · {t.expiry}:{" "}
                    <bdi>
                      {new Intl.DateTimeFormat(
                        locale === "fa" ? "fa-IR" : "en-GB",
                        {
                          dateStyle: "medium",
                          calendar: "gregory",
                          timeZone: workspace.timezone,
                        },
                      ).format(new Date(i.expires_at))}
                    </bdi>
                  </p>
                </div>
                {i.status === "pending" && (
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        api(`${base}/invitations/${i.id}/revoke`, "POST", {
                          expectedRevision: i.revision,
                        }),
                      )
                    }
                  >
                    {t.revoke}
                  </button>
                )}
              </div>
            ))}
            <div className="pagination">
              {inviteCursor && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setInviteCursor(undefined)}
                >
                  {t.firstPage}
                </button>
              )}
              {invitations.nextCursor && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setInviteCursor(invitations.nextCursor ?? undefined)
                  }
                >
                  {t.nextPage}
                </button>
              )}
            </div>
          </section>
          <section className="card">
            <h2>{t.relationships}</h2>
            {owner && (
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  void run(() =>
                    api(`${base}/manager-learners`, "POST", {
                      managerMembershipId: d.get("managerMembershipId"),
                      learnerMembershipId: d.get("learnerMembershipId"),
                    }),
                  );
                }}
              >
                <label>
                  {t.managerMember}
                  <input
                    name="managerMembershipId"
                    dir="ltr"
                    placeholder="UUID"
                    required
                  />
                </label>
                <label>
                  {t.learnerMember}
                  <input
                    name="learnerMembershipId"
                    dir="ltr"
                    placeholder="UUID"
                    required
                  />
                </label>
                <button type="submit" disabled={busy}>
                  {t.assignRelationship}
                </button>
              </form>
            )}
            {relationships.length === 0 && <p>{t.empty}</p>}
            {relationships.map((r) => (
              <div className="row" key={r.id}>
                <div className="row-details">
                  <p>
                    {t.manager}:{" "}
                    <bdi>
                      {members.items.find(
                        (m) => m.id === r.manager_membership_id,
                      )?.display_name ?? r.manager_membership_id}
                    </bdi>
                  </p>
                  <p>
                    {t.learner}:{" "}
                    <bdi>
                      {members.items.find(
                        (m) => m.id === r.learner_membership_id,
                      )?.display_name ?? r.learner_membership_id}
                    </bdi>
                  </p>
                </div>
                {owner && (
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        api(`${base}/manager-learners/${r.id}`, "DELETE"),
                      )
                    }
                  >
                    {t.remove}
                  </button>
                )}
              </div>
            ))}
          </section>
        </>
      )}
      <p className="hint">{t.securityHint}</p>
    </Shell>
  );
}
