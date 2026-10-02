import type { Pool } from "pg";
import {
  decryptMail,
  smtpTransport,
} from "../../../packages/adapters/src/mail";
export async function deliverOnce(pool: Pool) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "UPDATE mail_delivery SET status='failed',ciphertext=NULL WHERE status='pending' AND expires_at<=now()",
    );
    const result = await c.query(
      "SELECT * FROM mail_delivery WHERE status='pending' AND next_attempt_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    if (!result.rowCount) {
      await c.query("COMMIT");
      return false;
    }
    const item = result.rows[0];
    let valid = new Date(item.expires_at) > new Date();
    if (item.invitation_id) {
      await c.query("SELECT set_config('app.workspace_id',$1,true)", [
        item.workspace_id,
      ]);
      const i = await c.query(
        "SELECT i.role,i.status,i.expires_at,m.role AS inviter_role,m.status AS inviter_status FROM invitation i JOIN membership m ON m.id=i.inviter_membership_id AND m.workspace_id=i.workspace_id WHERE i.id=$1",
        [item.invitation_id],
      );
      const v = i.rows[0];
      valid =
        valid &&
        !!v &&
        v.status === "pending" &&
        new Date(v.expires_at) > new Date() &&
        v.inviter_status === "active" &&
        (v.inviter_role === "owner" ||
          (v.inviter_role === "manager" &&
            ["learner", "mentor"].includes(v.role)));
    }
    if (!valid) {
      await c.query(
        "UPDATE mail_delivery SET status='failed',ciphertext=NULL WHERE id=$1",
        [item.id],
      );
    } else {
      const transport = smtpTransport();
      try {
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          ...decryptMail(item.ciphertext),
        });
        await c.query(
          "UPDATE mail_delivery SET status='sent',ciphertext=NULL,attempts=attempts+1 WHERE id=$1",
          [item.id],
        );
      } catch {
        await c.query(
          "UPDATE mail_delivery SET attempts=attempts+1,status=CASE WHEN attempts>=7 THEN 'failed' ELSE 'pending' END,ciphertext=CASE WHEN attempts>=7 THEN NULL ELSE ciphertext END,next_attempt_at=now()+least(3600,power(2,attempts+1)::int*30)*interval '1 second' WHERE id=$1",
          [item.id],
        );
        console.error(
          JSON.stringify({ event: "mail_delivery_retry", id: item.id }),
        );
      } finally {
        transport.close();
      }
    }
    await c.query("COMMIT");
    return true;
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
}
