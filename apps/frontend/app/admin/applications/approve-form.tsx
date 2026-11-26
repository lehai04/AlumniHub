"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { mutate } from "../../../lib/mutations";

export function ApproveForm({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const verified = new FormData(event.currentTarget).has("verified");
    setPending(true);
    const failure = await mutate(
      `/api/admin/applications/${id}/approve`,
      "POST",
      { verified },
    );
    setError(failure ?? "");
    setPending(false);
    if (!failure) router.refresh();
  }

  return (
    <form className="event-form" onSubmit={submit}>
      <p>
        <input
          id={`verified-${id}`}
          name="verified"
          type="checkbox"
          required
          style={{ width: "auto" }}
        />{" "}
        <label htmlFor={`verified-${id}`} style={{ display: "inline" }}>
          Tôi đã đối chiếu và xác minh tốt nghiệp.
        </label>
      </p>
      <button
        type="submit"
        className="button button-primary"
        disabled={pending}
      >
        Duyệt và cấp thẻ
      </button>
      <output aria-live="polite">{error}</output>
    </form>
  );
}
