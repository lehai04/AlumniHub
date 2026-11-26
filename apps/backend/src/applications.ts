import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Pool } from "pg";
import { ApiError } from "./events.ts";

const deriveKey = promisify(scrypt);
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

function text(value: unknown, limit: number, optional = false) {
  if (optional && (value === undefined || value === null)) return "";
  if (
    typeof value !== "string" ||
    value.trim().length > limit ||
    (!optional && !value.trim())
  )
    throw new ApiError(400, "invalid_application");
  return value.trim();
}

function emailAddress(value: unknown) {
  const email = text(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ApiError(400, "invalid_application");
  return email;
}

export function applicationStore(pool: Pool) {
  return {
    async register(input: Record<string, unknown>) {
      const email = emailAddress(input.email);
      const name = text(input.fullName, 120);
      const faculty = text(input.faculty, 120);
      const cohort = text(input.cohort, 30, true);
      const phone = text(input.phone, 15);
      const occupation = text(input.occupation, 120, true);
      const workplace = text(input.workplace, 120, true);
      const type = input.identifierType;
      const identifier = text(input.identifier, 24).toUpperCase();
      const password = input.password;
      if (
        !/^\d{9,15}$/.test(phone) ||
        (type !== "mssv" && type !== "cccd") ||
        (type === "cccd"
          ? !/^\d{12}$/.test(identifier)
          : !/^[A-Z0-9]{4,24}$/.test(identifier)) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      )
        throw new ApiError(400, "invalid_application");
      const salt = randomBytes(16).toString("hex");
      const key = (await deriveKey(password, salt, 64)) as Buffer;
      const { rows } = await pool.query(
        `INSERT INTO public.alumni_accounts
          (email,password_hash,full_name,identifier_type,identifier,faculty,phone,occupation,workplace,cohort)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT DO NOTHING RETURNING id`,
        [
          email,
          `${salt}:${key.toString("hex")}`,
          name,
          type,
          identifier,
          faculty,
          phone,
          occupation,
          workplace,
          cohort,
        ],
      );
      if (!rows[0]) throw new ApiError(409, "application_exists");
      return { status: "pending" as const };
    },
    async authenticate(emailValue: unknown, password: unknown) {
      if (typeof password !== "string" || password.length > 128) return null;
      let email: string;
      try {
        email = emailAddress(emailValue);
      } catch {
        return null;
      }
      const { rows } = await pool.query<{ id: string; password_hash: string }>(
        "SELECT id, password_hash FROM public.alumni_accounts WHERE email = $1",
        [email],
      );
      const [salt, encoded] = rows[0]?.password_hash.split(":") ?? [
        "0".repeat(32),
        "0".repeat(128),
      ];
      const key = (await deriveKey(password, salt, 64)) as Buffer;
      return timingSafeEqual(key, Buffer.from(encoded, "hex"))
        ? (rows[0]?.id ?? null)
        : null;
    },
    async own(id: string) {
      if (!uuid.test(id)) return null;
      const { rows } = await pool.query(
        `SELECT a.full_name, a.faculty, a.cohort, a.created_at, c.code, c.issued_at,
          ARRAY(SELECT r.role FROM public.alumni_role_requests r
                WHERE r.target_id=a.id AND r.status='approved' AND r.ended_at IS NULL ORDER BY r.role) AS roles
         FROM public.alumni_accounts a LEFT JOIN public.alumni_cards c ON c.account_id = a.id
         WHERE a.id = $1`,
        [id],
      );
      return rows[0] ?? null;
    },
    async list() {
      const { rows } = await pool.query(
        `SELECT a.id, a.full_name, a.email, a.faculty, a.cohort, a.phone, a.occupation, a.workplace,
            a.identifier_type, a.identifier,
            a.created_at, c.code, c.reviewed_by, c.issued_at
         FROM public.alumni_accounts a LEFT JOIN public.alumni_cards c ON c.account_id = a.id
         ORDER BY (c.code IS NOT NULL), a.created_at, a.id`,
      );
      return { applications: rows };
    },
    async approve(id: string, reviewer: string, verified: unknown) {
      if (!uuid.test(id)) throw new ApiError(404, "application_not_found");
      if (verified !== true)
        throw new ApiError(400, "graduation_verification_required");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const {
          rows: [account],
        } = await client.query<{ issue_date: string }>(
          `SELECT to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DDMMYY') AS issue_date
           FROM public.alumni_accounts WHERE id = $1 FOR UPDATE`,
          [id],
        );
        if (!account) throw new ApiError(404, "application_not_found");
        const {
          rows: [existing],
        } = await client.query(
          "SELECT code, issued_at FROM public.alumni_cards WHERE account_id = $1",
          [id],
        );
        if (existing) {
          await client.query("COMMIT");
          return existing;
        }
        // Khóa hồ sơ trước khi lấy số mới để hai lượt duyệt cùng hồ sơ luôn nhận cùng mã.
        const {
          rows: [counter],
        } = await client.query<{ number: number }>(
          "SELECT nextval('public.alumni_card_number')::int AS number",
        );
        const code = `ALN ${account.issue_date} ${String(counter.number).padStart(6, "0")}`;
        const {
          rows: [card],
        } = await client.query(
          "INSERT INTO public.alumni_cards (account_id, code, reviewed_by) VALUES ($1,$2,$3) RETURNING code, issued_at",
          [id, code, reviewer],
        );
        await client.query("COMMIT");
        return card;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
