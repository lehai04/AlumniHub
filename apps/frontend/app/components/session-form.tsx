"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { mutate } from "../../lib/mutations";
import { PasswordInput } from "./password-input";

export function SessionForm({
  signedIn,
  portal = "alumni",
  localAlumni = false,
  emailLabel = "Email",
}: {
  signedIn: boolean;
  portal?: "alumni" | "staff";
  localAlumni?: boolean;
  emailLabel?: string;
}) {
  const router = useRouter();
  const passwordId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const staff = portal === "staff";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    const failure = await mutate(
      staff ? "/api/admin/session" : "/api/session",
      signedIn ? "DELETE" : "POST",
      Object.fromEntries(fields),
    );
    setError(failure ?? "");
    setPending(false);
    if (!failure) {
      if (staff) {
        window.location.replace(signedIn ? "/admin/login" : "/admin");
        return;
      }
      router.refresh();
    }
  }

  return (
    <form
      className={signedIn ? "session-signout" : "event-form"}
      method="post"
      onSubmit={submit}
    >
      {!signedIn && (
        <>
          {localAlumni ? (
            <input type="hidden" name="username" value="alumni" />
          ) : (
            <label>
              {staff ? "Tên đăng nhập" : emailLabel}
              <input
                name={staff ? "username" : "email"}
                type={staff ? "text" : "email"}
                placeholder={
                  !staff && emailLabel !== "Email"
                    ? "Email đã đăng ký"
                    : undefined
                }
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={staff ? 80 : 254}
              />
            </label>
          )}
          <label htmlFor={passwordId}>
            Mật khẩu
            <PasswordInput
              id={passwordId}
              name="password"
              aria-label="Mật khẩu"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
        </>
      )}
      <button
        className={signedIn ? "button button-outline" : "button button-primary"}
        type="submit"
        disabled={pending}
      >
        {signedIn ? "Đăng xuất" : "Đăng nhập"}
      </button>
      <output aria-live="polite">{error}</output>
    </form>
  );
}
