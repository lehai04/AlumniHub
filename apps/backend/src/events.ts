import type { Pool, PoolClient } from "pg";

export class ApiError extends Error {
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
  }
  readonly status: number;
}

const fields =
  "slug, title, description, location, starts_at, capacity, guest_limit, published_at, registration_closed_at";
const publicTotals = `COALESCE((
  SELECT SUM(guests + 1) FROM public.event_registrations WHERE event_slug = events.slug
), 0)::int AS registered_people,
  starts_at < now() + interval '12 hours' AS registration_deadline_passed,
  starts_at < now() + interval '24 hours' AS cancellation_deadline_passed`;
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const editorialFields = `published ? 'hero' AS uploaded_cover, revision AS content_revision,
  published->'content'->>'imageAlt' AS image_alt,
  published->'content'->>'linkLabel' AS link_label,
  published->'content'->>'linkUrl' AS link_url`;

export function eventDeadlinePassed(
  startsAt: Date,
  cutoffHours: 12 | 24,
  now = Date.now(),
) {
  return startsAt.getTime() - now < cutoffHours * 3_600_000;
}

function guestLimit(value: unknown, capacity: number) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value >= capacity
  )
    throw new ApiError(400, "invalid_guest_limit");
  return value;
}

function eventInput(input: Record<string, unknown>) {
  const { title, description, location, startsAt, capacity } = input;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 160 ||
    typeof description !== "string" ||
    description.length > 4000 ||
    typeof location !== "string" ||
    !location.trim() ||
    location.trim().length > 160 ||
    typeof startsAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      startsAt,
    ) ||
    !Number.isFinite(Date.parse(startsAt)) ||
    typeof capacity !== "number" ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 100000
  )
    throw new ApiError(400, "invalid_event");
  return [
    title.trim(),
    description.trim(),
    location.trim(),
    new Date(startsAt),
    capacity,
  ] as const;
}

export function eventStore(pool: Pool) {
  return {
    async list(admin = false, accountId?: string) {
      // Lấy danh tính từ phiên; EXISTS tránh lặp sự kiện khi lọc lượt đăng ký.
      const result = await pool.query(
        `SELECT ${fields}, ${publicTotals}, ${editorialFields} FROM public.events
         ${admin ? "" : "WHERE published_at IS NOT NULL"}
         ${accountId ? `${admin ? "WHERE" : "AND"} EXISTS (SELECT 1 FROM public.event_registrations r WHERE r.event_slug = events.slug AND r.account_id = $1)` : ""}
         ORDER BY starts_at, slug`,
        accountId ? [accountId] : [],
      );
      return result.rows;
    },
    async get(slug: string) {
      const result = await pool.query(
        `SELECT ${fields}, ${publicTotals}, ${editorialFields} FROM public.events WHERE slug = $1 AND published_at IS NOT NULL`,
        [slug],
      );
      if (!result.rows[0]) throw new ApiError(404, "event_not_found");
      return result.rows[0];
    },
    async create(input: Record<string, unknown>) {
      const { slug } = input;
      if (
        typeof slug !== "string" ||
        slug.length > 80 ||
        !slugPattern.test(slug)
      )
        throw new ApiError(400, "invalid_slug");
      const values = eventInput(input);
      const limit = guestLimit(
        input.guestLimit === undefined ? 0 : input.guestLimit,
        values[4],
      );
      const result = await pool.query(
        `INSERT INTO public.events (slug, title, description, location, starts_at, capacity, guest_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING RETURNING ${fields}`,
        [slug, ...values, limit],
      );
      if (!result.rows[0]) throw new ApiError(409, "slug_taken");
      return result.rows[0];
    },
    async update(slug: string, input: Record<string, unknown>) {
      return withEventLock(pool, slug, async (client, event) => {
        const values = eventInput({
          ...input,
          title: input.title === undefined ? event.title : input.title,
          description:
            input.description === undefined
              ? event.description
              : input.description,
        });
        const { rows } = await client.query<{ used: number }>(
          "SELECT COALESCE(SUM(guests + 1), 0)::int AS used FROM public.event_registrations WHERE event_slug = $1",
          [slug],
        );
        if (rows[0].used > values[4])
          throw new ApiError(409, "capacity_below_registrations");
        const limit = guestLimit(
          input.guestLimit === undefined ? event.guest_limit : input.guestLimit,
          values[4],
        );
        const result = await client.query(
          `UPDATE public.events SET title = $2, description = $3, location = $4, starts_at = $5, capacity = $6, guest_limit = $7
           WHERE slug = $1 RETURNING ${fields}`,
          [slug, ...values, limit],
        );
        return result.rows[0];
      });
    },
    async publish(slug: string) {
      const result = await pool.query(
        `UPDATE public.events SET published_at = COALESCE(published_at, now()) WHERE slug = $1 RETURNING ${fields}`,
        [slug],
      );
      if (!result.rows[0]) throw new ApiError(404, "event_not_found");
      return result.rows[0];
    },
    async closeRegistration(slug: string) {
      const result = await pool.query(
        `UPDATE public.events SET registration_closed_at = COALESCE(registration_closed_at, now())
         WHERE slug = $1 AND published_at IS NOT NULL RETURNING ${fields}`,
        [slug],
      );
      if (!result.rows[0]) throw new ApiError(404, "event_not_found");
      return result.rows[0];
    },
    async registrationReport(slug: string) {
      const { rows } = await pool.query(
        `SELECT e.slug, e.title, e.starts_at, count(r.account_id)::int AS registration_count,
          COALESCE(sum(r.guests + 1), 0)::int AS expected_attendees,
          COALESCE(jsonb_agg(jsonb_build_object(
            'account_id', r.account_id,
            'full_name', a.full_name,
            'email', a.email,
            'alumni_code', c.code,
            'registered_at', r.registered_at,
            'guests', r.guests,
            'total', r.guests + 1
          ) ORDER BY r.registered_at, r.account_id)
            FILTER (WHERE r.account_id IS NOT NULL), '[]'::jsonb) AS registrations
         FROM public.events e
         LEFT JOIN public.event_registrations r ON r.event_slug = e.slug
         LEFT JOIN public.alumni_accounts a ON a.id = CASE
           WHEN r.account_id ~ '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$' THEN r.account_id::uuid END
         LEFT JOIN public.alumni_cards c ON c.account_id = a.id
         WHERE e.slug = $1 GROUP BY e.slug`,
        [slug],
      );
      if (!rows[0]) throw new ApiError(404, "event_not_found");
      return rows[0];
    },
    async register(slug: string, account: string, guests: unknown) {
      if (
        typeof guests !== "number" ||
        !Number.isInteger(guests) ||
        guests < 0 ||
        guests > 99999
      )
        throw new ApiError(400, "invalid_guests");
      return withEventLock(pool, slug, async (client, event) => {
        if (!event.published_at) throw new ApiError(404, "event_not_found");
        if (event.registration_closed_at)
          throw new ApiError(409, "registration_closed");
        if (eventDeadlinePassed(event.starts_at, 12))
          throw new ApiError(409, "registration_deadline_passed");
        if (guests > 0) {
          const history = await client.query(
            "SELECT 1 FROM public.event_registration_cancellations WHERE event_slug=$1 AND account_id=$2",
            [slug, account],
          );
          if (history.rowCount)
            throw new ApiError(400, "reregistration_self_only");
        }
        if (guests > event.guest_limit)
          throw new ApiError(400, "guest_limit_exceeded");
        const result = await client.query(
          `INSERT INTO public.event_registrations (event_slug, account_id, guests)
           VALUES ($1, $2, $3) ON CONFLICT (event_slug, account_id) DO NOTHING RETURNING guests`,
          [slug, account, guests],
        );
        if (!result.rows[0]) throw new ApiError(409, "already_registered");
        const { rows } = await client.query<{ used: number }>(
          "SELECT COALESCE(SUM(guests + 1), 0)::int AS used FROM public.event_registrations WHERE event_slug = $1",
          [slug],
        );
        if (rows[0].used > event.capacity)
          throw new ApiError(409, "event_full");
        return { guests, total: guests + 1 };
      });
    },
    async ownRegistration(slug: string, account: string) {
      const { rows } = await pool.query(
        `SELECT r.registration_id, r.guests, c.account_id IS NOT NULL AS self_only
         FROM public.events e
         LEFT JOIN public.event_registrations r ON r.event_slug=e.slug AND r.account_id=$2
         LEFT JOIN public.event_registration_cancellations c ON c.event_slug=e.slug AND c.account_id=$2
         WHERE e.slug=$1 AND e.published_at IS NOT NULL`,
        [slug, account],
      );
      if (!rows[0]) throw new ApiError(404, "event_not_found");
      const { registration_id, guests, self_only } = rows[0];
      return {
        registration: registration_id ? { registration_id, guests } : null,
        selfOnly: self_only,
      };
    },
    async cancel(slug: string, account: string, registrationId: unknown) {
      if (
        typeof registrationId !== "string" ||
        !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(registrationId)
      )
        throw new ApiError(400, "invalid_registration");
      return withEventLock(pool, slug, async (client, event) => {
        if (!event.published_at) throw new ApiError(404, "event_not_found");
        if (eventDeadlinePassed(event.starts_at, 24))
          throw new ApiError(409, "cancellation_deadline_passed");
        const { rowCount } = await client.query(
          `DELETE FROM public.event_registrations
           WHERE event_slug=$1 AND account_id=$2 AND registration_id=$3`,
          [slug, account, registrationId],
        );
        if (!rowCount) throw new ApiError(404, "registration_not_found");
        await client.query(
          `INSERT INTO public.event_registration_cancellations (event_slug, account_id)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [slug, account],
        );
        return { cancelled: true };
      });
    },
  };
}

type LockedEvent = {
  title: string;
  description: string;
  capacity: number;
  guest_limit: number;
  starts_at: Date;
  published_at: Date | null;
  registration_closed_at: Date | null;
};

// Khóa cùng một hàng sự kiện khi chỉnh sức chứa hoặc ghi đăng ký.
async function withEventLock<T>(
  pool: Pool,
  slug: string,
  callback: (client: PoolClient, event: LockedEvent) => Promise<T>,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<LockedEvent>(
      "SELECT title, description, capacity, guest_limit, starts_at, published_at, registration_closed_at FROM public.events WHERE slug = $1 FOR UPDATE",
      [slug],
    );
    if (!rows[0]) throw new ApiError(404, "event_not_found");
    const result = await callback(client, rows[0]);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
