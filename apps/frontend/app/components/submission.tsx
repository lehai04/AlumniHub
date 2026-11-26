"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { mutate } from "../../lib/mutations";

export function Submission({
  path,
  method = "POST",
  success,
  children,
}: {
  path: string;
  method?: "POST" | "PATCH";
  success: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(
      form,
      event.nativeEvent instanceof SubmitEvent
        ? event.nativeEvent.submitter
        : undefined,
    );
    setBusy(true);
    const failure = await mutate(path, method, Object.fromEntries(data));
    setBusy(false);
    setMessage(failure ?? success);
    if (!failure) {
      form.reset();
      router.refresh();
    }
  }
  return (
    <form className="event-form" method="post" onSubmit={submit}>
      <fieldset className="community-fields" disabled={busy}>
        {children}
      </fieldset>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
