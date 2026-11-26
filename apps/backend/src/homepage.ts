import type { Pool } from "pg";
import { ApiError } from "./events.ts";

const imageSlots = [
  "hero",
  "event",
  "career1",
  "career2",
  "career3",
  "career4",
] as const;
export type HomepageImage = (typeof imageSlots)[number];
export function isHomepageImage(slot: unknown): slot is HomepageImage {
  return imageSlots.some((name) => name === slot);
}
const imageFields = (document: string) =>
  imageSlots.map((slot) => `${document} ? '${slot}' AS ${slot}`).join(", ");
export type ItemKind = "news" | "events";
const draftFields = `revision, COALESCE(draft->'content', '{}'::jsonb) AS content, ${imageFields("draft")}`;

function requireRevision(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 2147483647
  )
    throw new ApiError(400, "invalid_homepage_revision");
  return value;
}

function validLink(value: string) {
  if (value === "") return true;
  if (value !== value.trim() || /[\\\s\p{Cc}]/u.test(value)) return false;
  if (value.startsWith("#")) return value.length > 1;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return /^https?:\/\//i.test(value) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function homepageStore(pool: Pool, page?: string, item?: ItemKind) {
  const article = item === "news";
  const table = article
    ? "public.news_articles"
    : item
      ? "public.events"
      : page
        ? "public.website_page_cms"
        : "public.homepage_cms";
  const key = item ? "slug" : "id";
  const id = page ?? true;
  const visible = item
    ? ` AND published_at IS NOT NULL${article ? " AND withdrawn_at IS NULL" : ""}`
    : "";
  const defaults = article
    ? "jsonb_build_object('title', title, 'summary', summary, 'body', body)"
    : item
      ? "jsonb_build_object('title', title, 'body', description)"
      : "'{}'::jsonb";
  const publishContent = article
    ? `, title=COALESCE(draft->'content'->>'title', title),
    summary=COALESCE(draft->'content'->>'summary', summary),
    body=COALESCE(draft->'content'->>'body', body),
    published_at=CASE WHEN withdrawn_at IS NULL THEN COALESCE(published_at, now()) ELSE now() END,
    withdrawn_at=NULL`
    : item
      ? `, title=COALESCE(draft->'content'->>'title', title),
    description=COALESCE(draft->'content'->>'body', description),
    published_at=COALESCE(published_at, now())`
      : "";
  return {
    async read(admin: boolean) {
      const { rows } = await pool.query(
        `SELECT revision, COALESCE(doc->'content', defaults) AS content,
         ${imageFields("doc")}
         FROM (SELECT revision, ${admin ? "draft" : "published"} AS doc, ${defaults} AS defaults
           FROM ${table} WHERE ${key}=$1 ${admin ? "" : visible}) state`,
        [id],
      );
      if (!rows[0]) throw new ApiError(404, "cms_content_not_found");
      return rows[0];
    },
    async save(input: Record<string, unknown>) {
      const { content, revision } = input;
      if (!content || typeof content !== "object" || Array.isArray(content))
        throw new ApiError(400, "invalid_homepage_content");
      const values = Object.entries(content);
      if (
        values.length > 100 ||
        values.some(
          ([key, value]) =>
            !/^[a-z][a-zA-Z0-9]{0,39}$/.test(key) ||
            typeof value !== "string" ||
            value.length >
              (item && key === "body" ? (article ? 6500 : 4000) : 1200),
        )
      )
        throw new ApiError(400, "invalid_homepage_content");
      if (page) {
        const fields = new Map(values);
        const href = fields.get("linkUrl");
        const label = fields.get("linkLabel");
        if (
          typeof href !== "string" ||
          typeof label !== "string" ||
          !validLink(href) ||
          Boolean(href) !== Boolean(label.trim())
        )
          throw new ApiError(400, "invalid_page_link");
      }
      // Các thẻ nghề nghiệp chỉ nhận đường dẫn an toàn, không chấp nhận mã JavaScript.
      if (
        !page &&
        !item &&
        values.some(
          ([key, value]) =>
            /^career[1-4]Url$/.test(key) && !validLink(value as string),
        )
      )
        throw new ApiError(400, "invalid_page_link");
      if (item) {
        const fields = new Map(values);
        const title = fields.get("title");
        const body = fields.get("body");
        const summary = fields.get("summary");
        if (
          typeof title !== "string" ||
          !title.trim() ||
          title.trim().length > 160 ||
          typeof body !== "string" ||
          (article && !body.trim()) ||
          (article &&
            (typeof summary !== "string" || summary.trim().length > 280))
        )
          throw new ApiError(400, "invalid_item_content");
      }
      const result = await pool.query(
        `UPDATE ${table} SET draft=jsonb_set(draft, '{content}', $1::jsonb), revision=revision+1
         WHERE ${key}=$3 AND revision=$2 RETURNING ${draftFields}`,
        [JSON.stringify(content), requireRevision(revision), id],
      );
      if (!result.rowCount) throw new ApiError(409, "homepage_changed");
      return result.rows[0];
    },
    async publish(revision: unknown) {
      const result = await pool.query(
        `UPDATE ${table} SET published=draft, revision=revision+1 ${publishContent}
         WHERE ${key}=$2 AND revision=$1 RETURNING ${draftFields}`,
        [requireRevision(revision), id],
      );
      if (!result.rowCount) throw new ApiError(409, "homepage_changed");
      return result.rows[0];
    },
    async writeImage(
      slot: HomepageImage,
      type: string,
      bytes: Buffer,
      revision: unknown,
    ) {
      const valid =
        (type === "image/jpeg" &&
          bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
        (type === "image/png" &&
          bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
        (type === "image/webp" &&
          bytes.subarray(0, 4).toString() === "RIFF" &&
          bytes.subarray(8, 12).toString() === "WEBP");
      if (!valid) throw new ApiError(415, "invalid_homepage_image");
      const result = await pool.query(
        `UPDATE ${table} SET draft=jsonb_set(draft, ARRAY[$1], $2::jsonb), revision=revision+1 WHERE ${key}=$4 AND revision=$3 RETURNING ${draftFields}`,
        [
          slot,
          JSON.stringify({ type, data: bytes.toString("base64") }),
          requireRevision(revision),
          id,
        ],
      );
      if (!result.rowCount) throw new ApiError(409, "homepage_changed");
      return result.rows[0];
    },
    async removeImage(slot: HomepageImage, revision: unknown) {
      const result = await pool.query(
        `UPDATE ${table} SET draft=draft-$1::text, revision=revision+1 WHERE ${key}=$3 AND revision=$2 RETURNING ${draftFields}`,
        [slot, requireRevision(revision), id],
      );
      if (!result.rowCount) throw new ApiError(409, "homepage_changed");
      return result.rows[0];
    },
    async image(slot: HomepageImage, admin: boolean) {
      const { rows } = await pool.query<{
        image: { type: string; data: string } | null;
      }>(
        `SELECT ${admin ? "draft" : "published"}->$1::text AS image FROM ${table} WHERE ${key}=$2 ${admin ? "" : visible}`,
        [slot, id],
      );
      const image = rows[0]?.image;
      if (!image) throw new ApiError(404, "homepage_image_not_found");
      return { type: image.type, bytes: Buffer.from(image.data, "base64") };
    },
  };
}
