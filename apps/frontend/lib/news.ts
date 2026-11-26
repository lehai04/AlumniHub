import { type ItemAssets, itemImagePath } from "./item-content";

export type NewsCover = "community" | "event";

export type NewsItem = ItemAssets & {
  slug: string;
  title: string;
  summary: string;
  cover: NewsCover | null;
  published_at: string;
};

export type Article = Omit<NewsItem, "published_at"> & {
  body: string;
  published_at: string | null;
  withdrawn_at: string | null;
};

export const covers = {
  community: { src: "/assets/alumni-community.jpg", label: "Cộng đồng Alumni" },
  event: {
    src: "/assets/illustrations/alumni-sports.jpg",
    label: "Hoạt động kết nối",
  },
} satisfies Record<NewsCover, { src: string; label: string }>;

export function newsImage(
  article: Pick<NewsItem, "slug" | "cover"> & ItemAssets,
) {
  return article.uploaded_cover
    ? itemImagePath("news", article.slug, article.content_revision)
    : article.cover
      ? covers[article.cover].src
      : "/assets/illustrations/alumni-community.jpg";
}
