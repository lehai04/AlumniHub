import { cache } from "react";
import { readBackend } from "./backend";
import type { Homepage } from "./homepage";
import { type PublicPage, publicPages } from "./public-pages";

export const readPageIntro = cache(async (page: PublicPage) => {
  const response = await readBackend(`/api/pages/${page}`);
  if (!response.ok) throw new Error("Page content unavailable");
  const { content, hero, revision }: Homepage = await response.json();
  const defaults = publicPages[page];
  return {
    title: content.title?.trim() || defaults.title,
    description: content.description ?? defaults.description,
    image: hero
      ? `/api/pages/${page}/image?v=${revision}`
      : "image" in defaults
        ? defaults.image
        : undefined,
    alt: hero ? (content.imageAlt ?? "") : "",
    linkUrl: content.linkUrl,
    linkLabel: content.linkLabel,
  };
});
