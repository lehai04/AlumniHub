import Image from "next/image";
import Link from "next/link";
import { eventDate } from "../../lib/backend";

export type FeedItem = {
  href: string;
  title: string;
  summary: string;
  image?: string;
  alt?: string;
  date?: string | null;
};

export function StoryCard({
  item,
  grid = false,
}: {
  item: FeedItem;
  grid?: boolean;
}) {
  // Chỉ gửi đoạn giới thiệu ngắn vào thẻ, tránh lặp cả nội dung bài cho trình đọc màn hình.
  const text = item.summary.trim().replace(/\s+/g, " ");
  const summary = text.length > 180 ? `${text.slice(0, 177)}…` : text;
  return (
    <article className="featured-news-card" data-cover={Boolean(item.image)}>
      <Link href={item.href}>
        {item.image && (
          <Image
            src={item.image}
            alt={item.alt ?? ""}
            width={731}
            height={490}
            unoptimized
          />
        )}
        <div className="featured-news-copy">
          <h3>{item.title}</h3>
          <p>{summary}</p>
          {item.date && (
            <time dateTime={item.date}>{eventDate(item.date)}</time>
          )}
          {grid && <span className="story-action">Đọc chi tiết →</span>}
        </div>
      </Link>
    </article>
  );
}

export function FeaturedFeed({
  items,
  empty,
}: {
  items: FeedItem[];
  empty: string;
}) {
  const [lead, ...rest] = items;
  if (!lead) return <p className="public-empty">{empty}</p>;
  return (
    <div className="featured-news">
      <StoryCard item={lead} />
      <div className="featured-news-list">
        {rest.slice(0, 4).map((item) => (
          <StoryCard key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}
