export const roles = ["owner", "manager", "mentor", "learner"] as const;
export type Role = (typeof roles)[number];
export type Locale = "en" | "fa";
export interface Actor {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  preferredLocale: string;
}
export class DomainError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export function requireGrant(actor: Role, target: Role, type: string) {
  if (
    type !== "organization" ||
    !(
      actor === "owner" ||
      (actor === "manager" && (target === "learner" || target === "mentor"))
    )
  )
    throw new DomainError("FORBIDDEN", 403);
}
export function requireOwner(role: Role) {
  if (role !== "owner") throw new DomainError("FORBIDDEN", 403);
}
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
