import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { indexedSiteOrigin } from "../lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const origin = indexedSiteOrigin();
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(origin && { sitemap: `${origin}/sitemap.xml` }),
  };
}
