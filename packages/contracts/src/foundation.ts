import { z } from "zod";
export const locale = z.enum(["en", "fa"]);
export const role = z.enum(["owner", "manager", "mentor", "learner"]);
export const uuid = z.uuid();
const timezone = z
  .string()
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  });
const revision = z.number().int().positive();
export const organization = z.strictObject({
  type: z.literal("organization"),
  name: z.string().trim().min(1).max(120),
  timezone,
  defaultLocale: locale,
});
export const settings = z.strictObject({
  name: z.string().trim().min(1).max(120),
  timezone,
  defaultLocale: locale,
  expectedRevision: revision,
});
export const invite = z.strictObject({
  email: z
    .email()
    .max(254)
    .transform((x) => x.trim().toLowerCase()),
  role,
  managerMembershipId: uuid.optional(),
});
export const memberUpdate = z.strictObject({
  role,
  status: z.enum(["active", "removed"]),
  expectedRevision: revision,
});
export const relation = z.strictObject({
  managerMembershipId: uuid,
  learnerMembershipId: uuid,
});
export const acceptInvite = z.strictObject({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
export const preferences = z.strictObject({ preferredLocale: locale });
export const revoke = z.strictObject({ expectedRevision: revision });
export const idempotencyKey = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const listQuery = z.strictObject({
  cursor: uuid.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type InviteInput = z.infer<typeof invite>;
