import type { Pool } from "pg";
import { ApiError } from "./events.ts";

export function serviceContentStore(pool: Pool) {
  return {
    async list(publicOnly: boolean) {
      const filter = publicOnly
        ? "WHERE status='published' AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())"
        : "";
      const { rows } = await pool.query(
        `SELECT * FROM public.alumni_service_content ${filter} ORDER BY updated_at DESC, id`,
      );
      return rows;
    },
    async save(id: string | undefined, input: Record<string, unknown>) {
      const { category, title, body, startsAt, endsAt, revision } = input;
      const start = typeof startsAt === "string" ? Date.parse(startsAt) : NaN;
      const end =
        typeof endsAt === "string" && endsAt ? Date.parse(endsAt) : null;
      if (
        (category !== "benefits" && category !== "library") ||
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 160 ||
        typeof body !== "string" ||
        !body.trim() ||
        body.trim().length > 6500 ||
        !Number.isFinite(start) ||
        (end !== null && (!Number.isFinite(end) || end <= start)) ||
        (id &&
          (typeof revision !== "number" || !Number.isSafeInteger(revision)))
      )
        throw new ApiError(400, "invalid_service_content");
      const fields = [
        category,
        title.trim(),
        body.trim(),
        new Date(start),
        end === null ? null : new Date(end),
      ];
      const { rows } = id
        ? await pool.query(
            `UPDATE public.alumni_service_content SET category=$1, title=$2, body=$3, starts_at=$4, ends_at=$5,
         status='draft', revision=revision+1, updated_at=now()
         WHERE id=$6 AND revision=$7 AND status IN ('draft','submitted','withdrawn') RETURNING *`,
            [...fields, id, revision],
          )
        : await pool.query(
            `INSERT INTO public.alumni_service_content (category,title,body,starts_at,ends_at)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            fields,
          );
      if (!rows[0]) throw new ApiError(409, "service_content_changed");
      return rows[0];
    },
    async transition(
      id: string,
      action: "submit" | "return" | "publish" | "withdraw",
      revision: unknown,
    ) {
      if (typeof revision !== "number" || !Number.isSafeInteger(revision))
        throw new ApiError(400, "invalid_service_content");
      const [from, to] = {
        submit: ["draft", "submitted"],
        return: ["submitted", "draft"],
        publish: ["submitted", "published"],
        withdraw: ["published", "withdrawn"],
      }[action];
      const { rows } = await pool.query(
        `UPDATE public.alumni_service_content SET status=$1, revision=revision+1, updated_at=now()
         WHERE id=$2 AND status=$3 AND revision=$4 RETURNING *`,
        [to, id, from, revision],
      );
      if (!rows[0]) throw new ApiError(409, "service_content_changed");
      return rows[0];
    },
  };
}
