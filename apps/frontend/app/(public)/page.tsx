import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { readBackend } from "../../lib/backend";
import {
  careerSlots,
  type Homepage,
  homepageFields,
  homepageImage,
} from "../../lib/homepage";
import { itemImagePath } from "../../lib/item-content";
import { newsImage } from "../../lib/news";
import { readEvents, readNews } from "../../lib/public-feeds";
import { publicMetadata, siteName } from "../../lib/seo";
import { FeaturedFeed } from "./featured-feed";
import "./collection.css";
import "./home.css";

const readHome = cache(async (): Promise<Homepage> => {
  const response = await readBackend("/api/homepage");
  if (!response.ok) throw new Error("Homepage content unavailable");
  return response.json();
});
const shortcuts = [
  [
    "/community",
    "Kết nối",
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  ],
  [
    "/career",
    "Cơ hội",
    "M16 21H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M8 5V3h8v2M2 10l10 5 10-5M12 12v5",
  ],
  [
    "/events",
    "Sự kiện",
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M8 14h2M14 14h2M8 18h2",
  ],
  [
    "/services#benefits",
    "Đặc quyền",
    "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z",
  ],
] as const;

export async function generateMetadata() {
  const home = await readHome();
  return publicMetadata({
    path: "/",
    title: siteName,
    description:
      home.content.heroDescription ?? homepageFields.heroDescription[1],
    image: homepageImage(home, "hero"),
  });
}

export default async function Home() {
  const [home, events, articles] = await Promise.all([
    readHome(),
    readEvents(),
    readNews(),
  ]);
  const text = (key: keyof typeof homepageFields) =>
    home.content[key] ?? homepageFields[key][1];
  // Chọn hoạt động trong 7 ngày tới; dữ liệu thật luôn thay thế nội dung minh họa.
  const now = Date.now();
  const weekly = events.filter((event) => {
    const start = Date.parse(event.starts_at);
    return start >= now && start < now + 7 * 86400000;
  });
  const eventItems = weekly.slice(0, 5).map((event, index) => ({
    href: `/events/${event.slug}`,
    title: event.title,
    summary: event.description,
    image: event.uploaded_cover
      ? itemImagePath("events", event.slug, event.content_revision)
      : index === 0
        ? homepageImage(home, "event")
        : "/assets/illustrations/alumni-sports.jpg",
    alt: event.image_alt ?? "Ảnh minh họa hoạt động Alumni",
  }));
  return (
    <div className="collection-page home-page">
      <section className="home-hero" aria-labelledby="welcome">
        <Image
          src={homepageImage(home, "hero")}
          alt=""
          fill
          preload
          unoptimized
          sizes="100vw"
        />
        <div className="home-hero-copy">
          <h1 id="welcome">{text("heroTitle")}</h1>
          <p>{text("heroDescription")}</p>
          <Link className="button button-outline" href="#events">
            {text("heroEvent")}
          </Link>
        </div>
      </section>
      <nav className="home-shortcuts" aria-label="Khám phá Alumni">
        {shortcuts.map(([href, label, path]) => (
          <Link key={href} href={href}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={path} />
            </svg>
            {label}
          </Link>
        ))}
      </nav>
      <section
        id="events"
        className="collection-content home-feed"
        aria-labelledby="events-title"
      >
        <div className="home-section-heading">
          <h2 id="events-title">{text("eventSection")}</h2>
          <Link href="/events">Xem tất cả sự kiện →</Link>
        </div>
        <FeaturedFeed
          items={eventItems}
          empty="Chưa có sự kiện được công bố trong tuần này."
        />
      </section>
      <section className="home-news" aria-labelledby="home-news-title">
        <div className="collection-content home-feed">
          <div className="home-section-heading">
            <h2 id="home-news-title">Tin tức nổi bật</h2>
            <Link href="/news?view=all">Xem tất cả tin tức →</Link>
          </div>
          <FeaturedFeed
            items={articles.slice(0, 5).map((article) => ({
              href: `/news/${article.slug}`,
              title: article.title,
              summary: article.summary,
              image: newsImage(article),
              alt: article.image_alt ?? "",
            }))}
            empty="Chưa có tin được công bố."
          />
        </div>
      </section>
      <section className="home-careers" aria-labelledby="careers-title">
        <div className="collection-content">
          <h2 id="careers-title">{text("careersSection")}</h2>
          <div className="home-section-heading">
            <p>{text("careersTitle")}</p>
            <Link href="/career">Xem tất cả công việc →</Link>
          </div>
          <div className="career-card-track">
            {careerSlots.map((slot) => (
              <article className="career-preview" key={slot}>
                <Link href={text(`${slot}Url`)}>
                  <Image
                    src={homepageImage(home, slot)}
                    alt="Ảnh minh họa cơ hội nghề nghiệp"
                    width={404}
                    height={264}
                    unoptimized
                  />
                  <h3>{text(`${slot}Title`)}</h3>
                  <p>{text(`${slot}Description`)}</p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        className="collection-content home-community"
        aria-labelledby="community-title"
      >
        <h2 id="community-title">{text("communitySection")}</h2>
        <div className="community-links">
          {(
            [
              [
                "communityTitle",
                "communityDescription",
                "communityLink",
                "/community",
              ],
              [
                "partnerTitle",
                "partnerDescription",
                "partnerLink",
                "/community?tab=collaborations",
              ],
              ["cardTitle", "cardDescription", "cardAbout", "/alumni-card"],
              [
                "privilegesTitle",
                "privilegesDescription",
                "privilegesLink",
                "/services#benefits",
              ],
            ] as const
          ).map(([title, description, label, href]) => (
            <article key={href}>
              <h3>{text(title)}</h3>
              <p>{text(description)}</p>
              <Link href={href}>{text(label)}</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
