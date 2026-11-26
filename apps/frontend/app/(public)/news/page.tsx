import Link from "next/link";
import { newsImage } from "../../../lib/news";
import { readNews } from "../../../lib/public-feeds";
import { sectionMetadata } from "../../../lib/seo";
import { FeaturedFeed, StoryCard } from "../featured-feed";
import { PageIntro } from "../page-intro";
import "../collection.css";

type Props = { searchParams: Promise<{ view?: string; page?: string }> };
const pageSize = 6;

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return sectionMetadata(
    "news",
    params.view !== undefined || params.page !== undefined,
  );
}

export default async function NewsPage({ searchParams }: Props) {
  const [articles, params] = await Promise.all([readNews(), searchParams]);
  const all = params.view === "all";
  const pages = Math.max(1, Math.ceil(articles.length / pageSize));
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested)
    ? Math.min(pages, Math.max(1, requested))
    : 1;
  const items = articles.map((article) => ({
    href: `/news/${article.slug}`,
    title: article.title,
    summary: article.summary,
    image: newsImage(article),
    alt: article.image_alt ?? "",
    date: article.published_at,
  }));
  const pageUrl = (number: number) => `/news?view=all&page=${number}`;
  return (
    <div
      className={`collection-page news-collection${all ? " news-catalog" : ""}`}
    >
      <PageIntro page="news" presentation="cover" />
      <section className="collection-content" aria-labelledby="news-title">
        <h2 id="news-title" className={all ? "visually-hidden" : undefined}>
          {all ? "Tất cả tin tức" : "Tin tức nổi bật"}
        </h2>
        {all ? (
          articles.length ? (
            <div className="story-grid">
              {items
                .slice((page - 1) * pageSize, page * pageSize)
                .map((item) => (
                  <StoryCard key={item.href} item={item} grid />
                ))}
            </div>
          ) : (
            <p className="public-empty">Chưa có tin được công bố.</p>
          )
        ) : (
          <FeaturedFeed items={items} empty="Chưa có tin được công bố." />
        )}
        {all && pages > 1 ? (
          <nav className="pagination" aria-label="Phân trang tin tức">
            {page > 1 ? (
              <Link href={pageUrl(page - 1)}>← Trước</Link>
            ) : (
              <span aria-disabled="true">← Trước</span>
            )}
            {Array.from(
              { length: Math.min(5, pages) },
              (_, index) => Math.max(1, Math.min(page - 2, pages - 4)) + index,
            ).map((number) => (
              <Link
                key={number}
                href={pageUrl(number)}
                aria-current={number === page ? "page" : undefined}
              >
                {number}
              </Link>
            ))}
            {page < pages ? (
              <Link href={pageUrl(page + 1)}>Sau →</Link>
            ) : (
              <span aria-disabled="true">Sau →</span>
            )}
          </nav>
        ) : (
          !all &&
          articles.length > 0 && (
            <Link className="collection-more" href={pageUrl(1)}>
              Xem tất cả tin tức →
            </Link>
          )
        )}
      </section>
    </div>
  );
}
