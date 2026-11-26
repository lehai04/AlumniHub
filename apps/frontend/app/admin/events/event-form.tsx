"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Event } from "../../../lib/backend";
import { mutate } from "../../../lib/mutations";

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const path = event ? `/api/admin/events/${event.slug}` : "/api/admin/events";
  const localTime = event
    ? new Date(Date.parse(event.starts_at) + 7 * 3600000)
        .toISOString()
        .slice(0, 16)
    : "";

  async function submit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    const form = submission.currentTarget;
    const data = new FormData(form);
    const payload = {
      slug: data.get("slug"),
      ...(!event && {
        title: data.get("title"),
        description: data.get("description"),
      }),
      location: data.get("location"),
      startsAt: `${data.get("startsAt")}:00+07:00`,
      capacity: Number(data.get("capacity")),
      guestLimit: Number(data.get("guestLimit")),
    };
    setPending(true);
    const error = await mutate(path, event ? "PATCH" : "POST", payload);
    setMessage(error ?? "Đã lưu sự kiện.");
    setPending(false);
    if (!error) {
      if (!event) form.reset();
      router.refresh();
    }
  }

  async function closeRegistration() {
    setPending(true);
    const error = await mutate(`${path}/close-registration`, "POST");
    setMessage(error ?? "Đã đóng đăng ký.");
    setPending(false);
    if (!error) router.refresh();
  }

  return (
    <form className="event-form" onSubmit={submit}>
      {!event && (
        <label>
          Mã sự kiện{" "}
          <input
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={80}
            required
          />
        </label>
      )}
      {!event && (
        <>
          <label>
            Tiêu đề <input name="title" maxLength={160} required />
          </label>
          <label>
            Mô tả <textarea name="description" maxLength={4000} />
          </label>
        </>
      )}
      <label>
        Địa điểm{" "}
        <input
          name="location"
          defaultValue={event?.location}
          maxLength={160}
          required
        />
      </label>
      <label>
        Thời gian (giờ Việt Nam){" "}
        <input
          name="startsAt"
          type="datetime-local"
          defaultValue={localTime}
          required
        />
      </label>
      <label>
        Sức chứa{" "}
        <input
          name="capacity"
          type="number"
          min="1"
          max="100000"
          defaultValue={event?.capacity}
          required
        />
      </label>
      <label>
        Số người đi cùng tối đa cho mỗi CSV (0 nếu không có khách)
        <input
          name="guestLimit"
          type="number"
          min={0}
          max={99999}
          step={1}
          defaultValue={event?.guest_limit ?? 0}
          required
        />
      </label>
      <div className="form-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={pending}
        >
          {event ? "Lưu cấu hình sự kiện" : "Tạo bản nháp"}
        </button>
        {event?.published_at && !event.registration_closed_at && (
          <button
            className="button button-outline"
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  "Đóng đăng ký cho sự kiện này? Các lượt đã ghi nhận vẫn được giữ.",
                )
              )
                void closeRegistration();
            }}
          >
            Đóng đăng ký
          </button>
        )}
        {event?.registration_closed_at && <span>Đã đóng đăng ký</span>}
      </div>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
