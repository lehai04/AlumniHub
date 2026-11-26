import type { Metadata } from "next";
import { readPageIntro } from "./public-content";
import type { PublicPage } from "./public-pages";

export const siteName = "Alumni Hub | Đại học Văn Lang";
export const siteDescription =
  "Cổng cựu sinh viên Đại học Văn Lang. Theo dõi tin tức, sự kiện, cơ hội việc làm, dịch vụ và thẻ Alumni.";
export const privateRobots = { index: false, follow: false } as const;

export function publicSiteOrigin() {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (!configured) return undefined;
  try {
    const url = new URL(configured);
    if (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    )
      return url.origin;
  } catch {
    // Cấu hình sai sẽ giữ chế độ noindex.
  }
  return undefined;
}

export function indexedSiteOrigin() {
  return process.env.PUBLIC_INDEXING_ENABLED === "true"
    ? publicSiteOrigin()
    : undefined;
}

function summarize(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= 160) return normalized;
  const boundary = normalized.lastIndexOf(" ", 157);
  return `${normalized.slice(0, boundary >= 100 ? boundary : 157)}…`;
}

export function publicMetadata({
  path,
  title,
  description,
  image = "/assets/alumni-community.jpg",
  articleDate,
  privateView = false,
}: {
  path: string;
  title: string;
  description: string;
  image?: string;
  articleDate?: string | null;
  privateView?: boolean;
}): Metadata {
  const origin = publicSiteOrigin();
  const canonical = origin && new URL(path, origin).href;
  const imageUrl = origin && new URL(image, origin);
  const summary = summarize(description) || siteDescription;
  const social = {
    title,
    description: summary,
    ...(imageUrl && { images: [imageUrl] }),
  };
  return {
    title: path === "/" ? { absolute: siteName } : title,
    description: summary,
    ...(canonical && { alternates: { canonical } }),
    robots:
      !privateView && indexedSiteOrigin()
        ? { index: true, follow: true }
        : privateRobots,
    openGraph: {
      ...social,
      locale: "vi_VN",
      siteName,
      ...(canonical && { url: canonical }),
      ...(articleDate
        ? { type: "article", publishedTime: articleDate }
        : { type: "website" }),
    },
    twitter: { ...social, card: imageUrl ? "summary_large_image" : "summary" },
  };
}

export async function sectionMetadata(page: PublicPage, privateView = false) {
  const { title, description, image } = await readPageIntro(page);
  return publicMetadata({
    path: `/${page}`,
    title,
    description,
    image,
    privateView,
  });
}
