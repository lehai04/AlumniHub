import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  type Event,
  eventDate,
  readBackend,
  readSession,
  registrationStatus,
} from "../../../../lib/backend";
import { itemImagePath } from "../../../../lib/item-content";
import { publicMetadata } from "../../../../lib/seo";
import { Breadcrumbs } from "../../breadcrumbs";
import type { EventRegistration } from "./register-form";
import { RegistrationDialog } from "./registration-dialog";
import "../../collection.css";
import "../../detail.css";

type Props = { params: Promise<{ slug: string }> };
const readEvent = cache(async (slug: string): Promise<Event> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const response = await readBackend(`/api/events/${slug}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Event endpoint unavailable");
  return response.json();
});
const eventImage = (event: Event) =>
  event.uploaded_cover
    ? itemImagePath("events", event.slug, event.content_revision)
    : "/assets/illustrations/alumni-community.jpg";

export async function generateMetadata({ params }: Props) {
  const event = await readEvent((await params).slug);
  return publicMetadata({
    path: `/events/${event.slug}`,
    title: event.title,
    description: event.description,
    image: eventImage(event),
  });
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [event, session] = await Promise.all([readEvent(slug), readSession()]);
  const status = registrationStatus(event);
  const open = status === "Đang nhận đăng ký";
  const role = session.account?.role;
  let booking: { registration: EventRegistration | null; selfOnly: boolean } = {
    registration: null,
    selfOnly: false,
  };
  if (role === "alumni") {
    const response = await readBackend(
      `/api/events/${slug}/registrations`,
      true,
    );
    if (!response.ok)
      throw new Error("Event registration endpoint unavailable");
    booking = await response.json();
  }
  const remaining = Math.max(0, event.capacity - event.registered_people);
  return (
    <article className="page-section event-detail">
      <Breadcrumbs
        collection="/events"
        label="Sự kiện"
        title={event.title}
        slug={slug}
      />
      <h1 className="visually-hidden">{event.title}</h1>
      <Image
        className="event-poster"
        src={eventImage(event)}
        alt={event.image_alt || event.title}
        width={1440}
        height={640}
        preload
        unoptimized
      />
      <div className="event-booking-bar">
        <span>{event.location}</span>
        <time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time>
        <span>
          Vé còn lại: {remaining}/{event.capacity}
        </span>
        {role === "alumni" && (open || booking.registration) ? (
          <RegistrationDialog
            slug={slug}
            eventTitle={event.title}
            registration={booking.registration}
            selfOnly={booking.selfOnly}
            canCancel={!event.cancellation_deadline_passed}
            maxGuests={Math.max(0, Math.min(event.guest_limit, remaining - 1))}
          />
        ) : open ? (
          <Link
            className="button button-primary"
            href={role === "applicant" ? "#event-eligibility" : "/account"}
          >
            {role === "applicant" ? "Chờ duyệt hồ sơ" : "Đăng nhập để đăng ký"}
          </Link>
        ) : (
          <span className="booking-unavailable">
            {remaining === 0 ? "Hết vé" : status}
          </span>
        )}
      </div>
      {open && role === "applicant" && (
        <p id="event-eligibility" className="info-card">
          Hồ sơ đang chờ duyệt. Bạn có thể đăng ký sự kiện sau khi được cấp thẻ
          Alumni.
        </p>
      )}
      <div className="event-detail-columns">
        <section aria-labelledby="event-content-title">
          <h2 id="event-content-title">Nội dung sự kiện</h2>
          <div className="event-description">{event.description}</div>
          {event.link_url && event.link_label && (
            <p className="event-action">
              <a className="button button-outline" href={event.link_url}>
                {event.link_label}
              </a>
            </p>
          )}
        </section>
        <aside
          className="event-information"
          aria-labelledby="event-information-title"
        >
          <h2 id="event-information-title">Thông tin sự kiện</h2>
          <dl>
            <div>
              <dt>Địa điểm</dt>
              <dd>{event.location}</dd>
            </div>
            <div>
              <dt>Ngày bắt đầu</dt>
              <dd>
                <time dateTime={event.starts_at}>
                  {eventDate(event.starts_at)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Số người tham dự</dt>
              <dd>
                {event.registered_people}/{event.capacity}
              </dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{status}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </article>
  );
}
