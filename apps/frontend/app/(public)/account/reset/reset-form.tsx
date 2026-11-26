"use client";

import { type FormEvent, useId, useState } from "react";
import { PasswordInput } from "../../../components/password-input";

export function PasswordResetForm() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const complete =
      sent &&
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") !==
        "resend";
    if (complete && fields.get("password") !== fields.get("confirmation")) {
      setMessage("Hai mật khẩu chưa khớp.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(
        `/api/password-reset/${complete ? "complete" : "request"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            complete
              ? {
                  email,
                  code: fields.get("code"),
                  password: fields.get("password"),
                }
              : { email },
          ),
        },
      );
      if (!response.ok) {
        setMessage(
          complete
            ? "Mã không hợp lệ, đã hết hạn hoặc đã hết lượt thử."
            : "Chưa gửi được yêu cầu. Vui lòng thử lại.",
        );
        return;
      }
      if (complete) {
        setDone(true);
        setMessage("Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.");
      } else {
        setSent(true);
        setMessage(
          "Nếu email đã đăng ký, mã 6 số sẽ được gửi và có hiệu lực trong 10 phút.",
        );
      }
    } catch {
      setMessage("Không kết nối được. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="event-form" onSubmit={submit}>
      {!done && (
        <>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              readOnly={sent}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {sent && (
            <>
              <label>
                Mã xác thực
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                  required
                />
              </label>
              <label htmlFor={`${formId}-password`}>
                Mật khẩu mới
                <PasswordInput
                  id={`${formId}-password`}
                  aria-label="Mật khẩu mới"
                  name="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
              <label htmlFor={`${formId}-confirmation`}>
                Nhập lại mật khẩu mới
                <PasswordInput
                  id={`${formId}-confirmation`}
                  aria-label="Nhập lại mật khẩu mới"
                  name="confirmation"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
            </>
          )}
          <button
            type="submit"
            className="button button-primary"
            disabled={pending}
          >
            {sent ? "Đổi mật khẩu" : "Gửi mã"}
          </button>
          {sent && (
            <button
              type="submit"
              className="button"
              value="resend"
              formNoValidate
              disabled={pending}
            >
              Gửi lại mã
            </button>
          )}
        </>
      )}
      <output aria-live="polite">{message}</output>
    </form>
  );
}
