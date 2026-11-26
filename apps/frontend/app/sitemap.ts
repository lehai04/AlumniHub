import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { type Event, readBackend } from "../lib/backend";
import type { NewsItem } from "../lib/news";
import { publicNavigation } from "../lib/public-pages";
import { indexedSiteOrigin } from "../lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const origin = indexedSiteOrigin();
  if (!origin) return [];

  const [newsResponse, eventsResponse] = await Promise.all([
    readBackend("/api/news"),
    readBackend("/api/events"),
  ]);
  if (!newsResponse.ok || !eventsResponse.ok)
    throw new Error("Cannot load published entries for sitemap");
  const [news, events]: [NewsItem[], Event[]] = await Promise.all([
    newsResponse.json(),
    eventsResponse.json(),
  ]);
  return [
    { url: `${origin}/` },
    ...publicNavigation.map(({ href }) => ({ url: `${origin}${href}` })),
    ...news.map(({ slug }) => ({ url: `${origin}/news/${slug}` })),
    ...events.map(({ slug }) => ({ url: `${origin}/events/${slug}` })),
  ];
}
