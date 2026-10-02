import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import type { PoolClient } from "pg";
import type { Locale } from "../../domain/src/workspaces/permissions";
export interface MailEnvelope {
  to: string;
  subject: string;
  text: string;
}
function key() {
  const raw = process.env.MAIL_ENCRYPTION_KEY;
  if (!raw || !/^[a-f0-9]{64}$/i.test(raw))
    throw new Error("MAIL_ENCRYPTION_KEY must be 32 bytes encoded as hex");
  return Buffer.from(raw, "hex");
}
export function encryptMail(mail: MailEnvelope) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(mail), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}
export function decryptMail(encoded: string): MailEnvelope {
  const data = Buffer.from(encoded, "base64");
  const cipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  cipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString(
      "utf8",
    ),
  );
}
export function emailMessage(
  kind: "verify" | "reset" | "invite",
  locale: Locale,
  url: string,
): Omit<MailEnvelope, "to"> {
  const messages = {
    en: {
      verify: [
        "Verify your email",
        "Verify your email using this link. It expires in one hour.",
      ],
      reset: [
        "Reset your password",
        "Reset your password using this link. It expires in one hour.",
      ],
      invite: [
        "Workspace invitation",
        "Join your workspace using this link. This invitation expires in seven days.",
      ],
    },
    fa: {
      verify: [
        "تأیید ایمیل",
        "برای تأیید ایمیل از این لینک استفاده کنید. اعتبار لینک یک ساعت است.",
      ],
      reset: [
        "بازیابی رمز عبور",
        "برای انتخاب رمز جدید از این لینک استفاده کنید. اعتبار لینک یک ساعت است.",
      ],
      invite: [
        "دعوت به فضای کاری",
        "با این لینک به فضای کاری بپیوندید. اعتبار دعوت هفت روز است.",
      ],
    },
  };
  const [subject, text] = messages[locale][kind];
  return { subject, text: `${text}\n\n${url}` };
}
export async function enqueueMail(
  c: PoolClient,
  mail: MailEnvelope,
  workspaceId: string | null = null,
  invitationId: string | null = null,
  seconds = 3600,
) {
  await c.query(
    "INSERT INTO mail_delivery(workspace_id,invitation_id,ciphertext,expires_at) VALUES($1,$2,$3,now()+$4*interval '1 second')",
    [workspaceId, invitationId, encryptMail(mail), seconds],
  );
}
export function smtpTransport() {
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const secure = process.env.SMTP_SECURE === "true";
  if (process.env.NODE_ENV === "production" && !secure && port !== 587)
    throw new Error("Production SMTP requires TLS or STARTTLS on port 587");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port,
    secure,
    requireTLS: process.env.NODE_ENV === "production" && !secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}
