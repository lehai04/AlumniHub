import Link from "next/link";
import { type Event, readBackend, readSession } from "../../../lib/backend";
import { privateRobots, sectionMetadata } from "../../../lib/seo";
import { PageIntro } from "../page-intro";
import { EventCard } from "./event-card";
import { EventCarousel } from "./event-carousel";
import "../collection.css";

type Props = {
  searchParams: Promise<{ q?: string | string[]; view?: string | string[] }>;
};
const views = {
  all: "Sự kiện",
  conferences: "Hội nghị",
  calendar: "Lịch sự kiện",
  mine: "Sự kiện của tôi",
} as const;
const month = new Intl.DateTimeFormat("vi-VN", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

async function filters(searchParams: Props["searchParams"]) {
  const params = await searchParams;
  const view =
    typeof params.view === "string" && Object.hasOwn(views, params.view)
      ? (params.view as keyof typeof views)
      : "all";
  return {
    view,
    query: typeof params.q === "string" ? params.q.trim().slice(0, 160) : "",
  };
}

export async function generateMetadata({ searchParams }: Props) {
  const { view, query } = await filters(searchParams);
  const metadata = await sectionMetadata("events");
  return view === "all" && !query
    ? metadata
    : { ...metadata, robots: privateRobots };
}

export default async function Events({ searchParams }: Props) {
  const { view, query } = await filters(searchParams);
  const session = view === "mine" ? await readSession() : undefined;
  const needsAccount = view === "mine" && session?.account?.role !== "alumni";
  let events: Event[] = [];
  if (!needsAccount) {
    const response = await readBackend(
      view === "mine" ? "/api/events?registered=true" : "/api/events",
      view === "mine",
    );
    if (!response.ok) throw new Error("Events endpoint unavailable");
    events = await response.json();
  }
  // Chưa có trường phân loại: tìm hội nghị theo tên, không suy đoán từ ảnh minh họa.
  const visible = events.filter(
    (event) =>
      (view !== "conferences" ||
        /hội nghị|hội thảo|conference|seminar/iu.test(event.title)) &&
      `${event.title} ${event.description} ${event.location}`
        .toLocaleLowerCase("vi-VN")
        .includes(query.toLocaleLowerCase("vi-VN")),
  );
  const suggested = events.filter(
    (event) => Date.parse(event.starts_at) > Date.now(),
  );
  const groups: [string, Event[] | undefined][] =
    view === "calendar"
      ? Object.entries(
          Object.groupBy(visible, (event) =>
            month.format(new Date(event.starts_at)),
          ),
        )
      : [
          [
            query
              ? "Kết quả tìm kiếm"
              : view === "all"
                ? "Sự kiện nổi bật"
                : views[view],
            visible,
          ],
        ];

  return (
    <div className="collection-page events-collection">
      <PageIntro page="events" presentation="poster" />
      <nav className="event-views" aria-label="Khám phá sự kiện">
        {Object.entries(views).map(([key, label]) => (
          <Link
            key={key}
            href={`/events?${new URLSearchParams({ view: key, ...(query ? { q: query } : {}) })}`}
            aria-current={view === key ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="collection-content">
        <search>
          <form className="event-search" action="/events">
            <input type="hidden" name="view" value={view} />
            <label className="visually-hidden" htmlFor="event-query">
              Tìm kiếm sự kiện
            </label>
            <input
              id="event-query"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Tìm kiếm sự kiện"
              maxLength={160}
            />
            <button className="button button-primary" type="submit">
              Tìm kiếm
            </button>
          </form>
        </search>
        {needsAccount ? (
          <p className="public-empty">
            {session?.account
              ? "Cần được cấp thẻ Alumni để xem sự kiện đã đăng ký."
              : "Đăng nhập để xem sự kiện bạn đã đăng ký."}
            <Link href="/account">Mở tài khoản Alumni →</Link>
          </p>
        ) : visible.length === 0 ? (
          <p className="public-empty">
            {query
              ? "Không tìm thấy sự kiện phù hợp."
              : view === "mine"
                ? "Bạn chưa đăng ký sự kiện nào."
                : "Chưa có sự kiện nào trong mục này."}
          </p>
        ) : (
          groups.map(([title, items]) => (
            <section className="event-group" key={title} aria-label={title}>
              <h2>{title}</h2>
              <div className="event-tiles">
                {items?.map((event) => (
                  <EventCard key={event.slug} event={event} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      {view === "all" && !query && suggested.length > 0 && (
        <section className="suggested-events" aria-labelledby="suggested-title">
          <h2 id="suggested-title">Sự kiện đề xuất</h2>
          <EventCarousel count={suggested.length}>
            {suggested.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </EventCarousel>
        </section>
      )}
    </div>
  );
}
