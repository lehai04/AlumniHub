import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { eventDate, readBackend } from "../../../../lib/backend";
import { type Article, newsImage } from "../../../../lib/news";
import { readNews } from "../../../../lib/public-feeds";
import { publicMetadata, publicSiteOrigin } from "../../../../lib/seo";
import { Breadcrumbs, JsonLd } from "../../breadcrumbs";
import { StoryCard } from "../../featured-feed";
import "../../collection.css";
import "../../detail.css";

type Props = { params: Promise<{ slug: string }> };

const readArticle = cache(async (slug: string): Promise<Article> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const response = await readBackend(`/api/news/${slug}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Article endpoint unavailable");
  return response.json();
});

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await readArticle(slug);
  return publicMetadata({
    path: `/news/${slug}`,
    title: article.title,
    description: article.summary,
    image: newsImage(article),
    articleDate: article.published_at,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, recent] = await Promise.all([readArticle(slug), readNews()]);
  const cover = newsImage(article);
  const origin = publicSiteOrigin();
  return (
    <article className="page-section article-detail">
      <Breadcrumbs
        collection="/news"
        label="Tin tức"
        title={article.title}
        slug={slug}
      />
      {origin && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.summary,
            datePublished: article.published_at,
            mainEntityOfPage: `${origin}/news/${slug}`,
            ...(cover && { image: `${origin}${cover}` }),
            publisher: {
              "@type": "Organization",
              name: "Alumni Hub, Đại học Văn Lang",
            },
          }}
        />
      )}
      <header className="article-heading">
        <p className="eyebrow">Tin tức Alumni</p>
        <h1>{article.title}</h1>
        {article.published_at && (
          <time dateTime={article.published_at}>
            {eventDate(article.published_at)}
          </time>
        )}
      </header>
      {cover && (
        <Image
          src={cover}
          alt={article.uploaded_cover ? (article.image_alt ?? "") : ""}
          width={1200}
          height={675}
          className="article-cover"
          preload
          unoptimized
        />
      )}
      <div className="article-columns">
        <div className="article-body">
          {article.summary && <p className="article-lead">{article.summary}</p>}
          <div className="news-body">{article.body}</div>
          {article.link_url && article.link_label && (
            <p className="public-banner-action">
              <a className="button button-outline" href={article.link_url}>
                {article.link_label}
              </a>
            </p>
          )}
        </div>
        <aside className="recent-news" aria-labelledby="recent-title">
          <h2 id="recent-title">Tin tức gần đây</h2>
          <div className="featured-news-list">
            {recent
              .filter((item) => item.slug !== slug)
              .slice(0, 3)
              .map((item) => (
                <StoryCard
                  key={item.slug}
                  item={{
                    href: `/news/${item.slug}`,
                    title: item.title,
                    summary: item.summary,
                    image: newsImage(item),
                    alt: item.image_alt ?? "",
                  }}
                />
              ))}
          </div>
          <Link className="button button-outline" href="/news?view=all">
            Xem tất cả tin tức →
          </Link>
        </aside>
      </div>
    </article>
  );
}
