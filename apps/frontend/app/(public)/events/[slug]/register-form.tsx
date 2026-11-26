"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState, useTransition } from "react";
import { mutate } from "../../../../lib/mutations";

export type EventRegistration = { registration_id: string; guests: number };

export function RegisterForm({
  slug,
  registration,
  selfOnly,
  canCancel,
  maxGuests,
  eventTitle,
  onSuccess,
}: {
  slug: string;
  registration: EventRegistration | null;
  selfOnly: boolean;
  canCancel: boolean;
  maxGuests: number;
  eventTitle: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const guestsId = useId();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const path = `/api/events/${slug}/registrations`;

  async function submit(
    method: "POST" | "DELETE",
    body: Record<string, unknown>,
    success: string,
  ) {
    setPending(true);
    const error = await mutate(path, method, body);
    setMessage(error ?? success);
    if (!error) {
      startTransition(() => router.refresh());
      onSuccess?.();
    }
    setPending(false);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const guests = Number(new FormData(event.currentTarget).get("guests"));
    await submit(
      "POST",
      { guests },
      `Đăng ký thành công cho ${guests + 1} người.`,
    );
  }

  if (registration) {
    return (
      <section className="event-form">
        <h3>{eventTitle}</h3>
        <p>
          Bạn đã đăng ký cho {registration.guests + 1} người, gồm{" "}
          {registration.guests} người đi cùng.
        </p>
        {canCancel ? (
          <button
            type="button"
            className="button button-outline"
            disabled={pending || refreshing}
            onClick={() => {
              if (window.confirm("Hủy lượt đăng ký của bạn và người đi cùng?"))
                void submit(
                  "DELETE",
                  { registrationId: registration.registration_id },
                  "Đã hủy đăng ký.",
                );
            }}
          >
            Hủy đăng ký
          </button>
        ) : (
          <p>Đã hết hạn hủy. Lượt đăng ký được giữ nguyên.</p>
        )}
        <output aria-live="polite">{message}</output>
      </section>
    );
  }

  return (
    <form className="event-form" onSubmit={register}>
      <h3>Bạn đang đăng ký sự kiện “{eventTitle}”</h3>
      {selfOnly ? (
        <p>Sau khi hủy, bạn chỉ có thể đăng ký lại cho bản thân.</p>
      ) : maxGuests > 0 ? (
        <label htmlFor={guestsId}>
          Số người đi cùng{" "}
          {maxGuests <= 50 ? (
            <select id={guestsId} name="guests" defaultValue="0" required>
              {Array.from({ length: maxGuests + 1 }, (_, value) => value).map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          ) : (
            <input
              id={guestsId}
              name="guests"
              type="number"
              min="0"
              max={maxGuests}
              defaultValue="0"
              required
            />
          )}
        </label>
      ) : (
        <p>Hiện chỉ còn lựa chọn đăng ký cho bản thân.</p>
      )}
      <button
        className="button button-primary"
        type="submit"
        disabled={pending || refreshing}
      >
        {pending || refreshing ? "Đang xử lý…" : "Đăng ký"}
      </button>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
