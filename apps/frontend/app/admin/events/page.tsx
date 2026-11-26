import Link from "next/link";
import {
  type Event,
  readBackend,
  readStaffSession,
} from "../../../lib/backend";
import { EventForm } from "./event-form";

export default async function AdminEvents() {
  const { account } = await readStaffSession();
  if (account?.role !== "admin") {
    return (
      <section className="page-section">
        <h1>Quản trị sự kiện</h1>
        <p>Khu vực này yêu cầu quyền quản trị viên.</p>
        <Link href="/admin/login">Đăng nhập quản trị</Link>
      </section>
    );
  }
  const response = await readBackend("/api/admin/events", true);
  if (!response.ok) throw new Error("Admin events endpoint unavailable");
  const events: Event[] = await response.json();
  return (
    <section className="page-section">
      <h1>Quản trị sự kiện</h1>
      <h2>Tạo sự kiện</h2>
      <EventForm />
      <h2>Sự kiện hiện có</h2>
      <div className="event-list">
        {events.map((event) => (
          <details key={event.slug} className="info-card">
            <summary>
              {event.title} · {event.published_at ? "Đã xuất bản" : "Bản nháp"}
            </summary>
            <p>
              <Link href={`/admin/items/events/${event.slug}`}>
                Chỉnh nội dung, ảnh và link sự kiện
              </Link>
            </p>
            <p>
              <Link href={`/admin/events/${event.slug}/registrations`}>
                Xem danh sách đăng ký
              </Link>
            </p>
            <EventForm key={JSON.stringify(event)} event={event} />
          </details>
        ))}
      </div>
    </section>
  );
}
