export type ItemContentKind = "news" | "events";

export type ItemAssets = {
  uploaded_cover?: boolean;
  content_revision?: number;
  image_alt?: string | null;
  link_label?: string | null;
  link_url?: string | null;
};

export function itemImagePath(
  kind: ItemContentKind,
  slug: string,
  revision?: number,
) {
  return `/api/${kind}-content/${slug}/image?v=${revision ?? 0}`;
}
