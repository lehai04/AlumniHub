import { createHmac, randomBytes, randomInt, scrypt } from "node:crypto";
import { promisify } from "node:util";
import type { Pool } from "pg";
import { ApiError } from "./events.ts";

const deriveKey = promisify(scrypt);

export function passwordResetStore(pool: Pool) {
  const secret = randomBytes(32);
  const mailbox = new Map<string, { code: string; expires: number }>();
  const digest = (email: string, code: string) =>
    createHmac("sha256", secret)
      .update(email)
      .update(":")
      .update(code)
      .digest("hex");

  function emailAddress(value: unknown) {
    const email = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(400, "invalid_email");
    return email;
  }

  return {
    async request(value: unknown) {
      const email = emailAddress(value);
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const { rowCount } = await pool.query(
        `INSERT INTO public.alumni_password_resets (account_id, code_hash, expires_at)
         SELECT id, $2, now() + interval '10 minutes' FROM public.alumni_accounts WHERE email=$1
         ON CONFLICT (account_id) DO UPDATE SET code_hash=EXCLUDED.code_hash,
           expires_at=EXCLUDED.expires_at, requested_at=now(), attempts=0, used_at=NULL
         WHERE alumni_password_resets.requested_at <= now() - interval '60 seconds'`,
        [email, digest(email, code)],
      );
      if (rowCount) {
        for (const [address, message] of mailbox)
          if (message.expires <= Date.now()) mailbox.delete(address);
        const oldest = mailbox.keys().next().value;
        if (mailbox.size >= 128 && oldest) mailbox.delete(oldest);
        mailbox.set(email, { code, expires: Date.now() + 600_000 });
      }
    },
    message(value: unknown) {
      const message = mailbox.get(emailAddress(value));
      return message && message.expires > Date.now()
        ? { code: message.code }
        : null;
    },
    async complete(input: Record<string, unknown>) {
      const email = emailAddress(input.email);
      const { code, password } = input;
      if (
        typeof code !== "string" ||
        !/^\d{6}$/.test(code) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      )
        throw new ApiError(400, "invalid_reset_input");
      const hashedCode = digest(email, code);
      const salt = randomBytes(16).toString("hex");
      const key = (await deriveKey(password, salt, 64)) as Buffer;
      const passwordHash = `${salt}:${key.toString("hex")}`;
      const { rows } = await pool.query<{ id: string }>(
        `WITH verified AS (
           UPDATE public.alumni_password_resets r SET
             attempts=r.attempts+1, used_at=CASE WHEN r.code_hash=$2 THEN now() END
           FROM public.alumni_accounts a
           WHERE a.id=r.account_id AND a.email=$1 AND r.used_at IS NULL
             AND r.expires_at > now() AND r.attempts < 5
           RETURNING r.account_id, r.used_at
         )
         UPDATE public.alumni_accounts a SET password_hash=$3 FROM verified
         WHERE a.id=verified.account_id AND verified.used_at IS NOT NULL RETURNING a.id`,
        [email, hashedCode, passwordHash],
      );
      if (!rows[0]) throw new ApiError(400, "invalid_or_expired_code");
      mailbox.delete(email);
      return rows[0].id;
    },
  };
}
