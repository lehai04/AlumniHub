import type { Pool } from "pg";
import { ApiError, editorialFields, slugPattern } from "./events.ts";

const fields = "slug, title, summary, body, cover, published_at, withdrawn_at";
const publicFilter = "published_at IS NOT NULL AND withdrawn_at IS NULL";

function articleInput(input: Record<string, unknown>) {
  const { title, summary, body, cover } = input;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 160 ||
    typeof body !== "string" ||
    !body.trim() ||
    body.trim().length > 6500 ||
    (summary !== undefined &&
      (typeof summary !== "string" || summary.trim().length > 280)) ||
    (cover !== undefined &&
      cover !== null &&
      cover !== "community" &&
      cover !== "event")
  )
    throw new ApiError(400, "invalid_article");
  return [
    title.trim(),
    typeof summary === "string" ? summary.trim() : "",
    body.trim(),
    cover ?? null,
  ];
}

export function newsStore(pool: Pool) {
  return {
    async listPublic() {
      const { rows } = await pool.query(
        `SELECT slug, title, COALESCE(NULLIF(summary, ''), left(body, 200)) AS summary,
          cover, published_at, ${editorialFields}
         FROM public.news_articles WHERE ${publicFilter}
         ORDER BY published_at DESC, slug`,
      );
      return rows;
    },
    async readPublic(slug: string) {
      const { rows } = await pool.query(
        `SELECT slug, title, summary, body, cover, published_at, ${editorialFields}
         FROM public.news_articles WHERE slug = $1 AND ${publicFilter}`,
        [slug],
      );
      if (!rows[0]) throw new ApiError(404, "article_not_found");
      return rows[0];
    },
    async listAdmin() {
      const { rows } = await pool.query(
        `SELECT ${fields} FROM public.news_articles ORDER BY created_at DESC, slug`,
      );
      return rows;
    },
    async create(input: Record<string, unknown>) {
      const { slug } = input;
      if (
        typeof slug !== "string" ||
        slug.length > 80 ||
        !slugPattern.test(slug)
      )
        throw new ApiError(400, "invalid_slug");
      const { rows } = await pool.query(
        `INSERT INTO public.news_articles (slug, title, summary, body, cover)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING RETURNING ${fields}`,
        [slug, ...articleInput(input)],
      );
      if (!rows[0]) throw new ApiError(409, "slug_taken");
      return rows[0];
    },
    async update(slug: string, input: Record<string, unknown>) {
      const { rows } = await pool.query(
        `UPDATE public.news_articles SET title=$2, summary=$3, body=$4, cover=$5
         WHERE slug=$1 RETURNING ${fields}`,
        [slug, ...articleInput(input)],
      );
      if (!rows[0]) throw new ApiError(404, "article_not_found");
      return rows[0];
    },
    async publish(slug: string) {
      const { rows } = await pool.query(
        `UPDATE public.news_articles
         SET published_at = CASE WHEN withdrawn_at IS NULL THEN COALESCE(published_at, now()) ELSE now() END,
             withdrawn_at = NULL
         WHERE slug=$1 RETURNING ${fields}`,
        [slug],
      );
      if (!rows[0]) throw new ApiError(404, "article_not_found");
      return rows[0];
    },
    async withdraw(slug: string) {
      const { rows } = await pool.query(
        `UPDATE public.news_articles SET withdrawn_at=COALESCE(withdrawn_at, now())
         WHERE slug=$1 AND published_at IS NOT NULL RETURNING ${fields}`,
        [slug],
      );
      if (!rows[0]) throw new ApiError(404, "article_not_published");
      return rows[0];
    },
  };
}
