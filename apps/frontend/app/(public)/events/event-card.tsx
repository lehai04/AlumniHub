import Image from "next/image";
import Link from "next/link";
import {
  type Event,
  eventDate,
  registrationStatus,
} from "../../../lib/backend";
import { itemImagePath } from "../../../lib/item-content";

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="event-tile">
      <Link href={`/events/${event.slug}`}>
        <Image
          src={
            event.uploaded_cover
              ? itemImagePath("events", event.slug, event.content_revision)
              : "/assets/illustrations/alumni-sports.jpg"
          }
          alt={
            event.uploaded_cover
              ? (event.image_alt ?? "")
              : "Ảnh minh họa hoạt động Alumni"
          }
          width={612}
          height={361}
          unoptimized
        />
        <div className="event-tile-copy">
          <h3>{event.title}</h3>
          <div className="event-tile-meta">
            <time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time>
            <span>{event.location}</span>
          </div>
          <small>{registrationStatus(event)}</small>
        </div>
      </Link>
    </article>
  );
}
