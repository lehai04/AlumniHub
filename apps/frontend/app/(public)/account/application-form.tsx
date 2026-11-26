"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import { mutate } from "../../../lib/mutations";
import { PasswordInput } from "../../components/password-input";

const personal = [
  {
    name: "fullName",
    label: "Họ và tên",
    maxLength: 120,
    autoComplete: "name",
  },
  {
    name: "identifier",
    label: "MSSV / CCCD",
    maxLength: 24,
    pattern: "[A-Za-z0-9]{4,24}",
    autoComplete: "off",
  },
  {
    name: "phone",
    label: "Số điện thoại",
    maxLength: 15,
    type: "tel",
    pattern: "[0-9]{9,15}",
    autoComplete: "tel",
  },
] as const;
const accountFields = [
  { name: "faculty", label: "Khoa theo học", maxLength: 120 },
  {
    name: "cohort",
    label: "Khóa theo học",
    maxLength: 30,
    placeholder: "Ví dụ: K24",
  },
  {
    name: "email",
    label: "Email đăng nhập",
    maxLength: 254,
    type: "email",
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Mật khẩu",
    maxLength: 128,
    minLength: 8,
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "passwordConfirmation",
    label: "Nhập lại mật khẩu",
    maxLength: 128,
    minLength: 8,
    type: "password",
    autoComplete: "new-password",
  },
] as const;

export function ApplicationForm() {
  const formId = useId();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function changeStep(next: number) {
    setStep(next);
    setMessage("");
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>(`[data-step="${next}"] input`)
        ?.focus({ preventScroll: true }),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const confirmation = form.elements.namedItem(
      "passwordConfirmation",
    ) as HTMLInputElement;
    confirmation.setCustomValidity(
      data.get("password") === data.get("passwordConfirmation")
        ? ""
        : "Mật khẩu nhập lại chưa khớp.",
    );
    // Kiểm tra từng bước để trình duyệt không cố focus trường đang ẩn.
    for (let index = 0; index <= step; index++) {
      const controls = form.querySelectorAll<HTMLInputElement>(
        `[data-step="${index}"] input`,
      );
      const invalid = [...controls].find((input) => !input.checkValidity());
      if (invalid) {
        if (index !== step) setStep(index);
        requestAnimationFrame(() => invalid.reportValidity());
        return;
      }
    }
    if (step === 0) return changeStep(1);
    setPending(true);
    setMessage("");
    data.delete("passwordConfirmation");
    // CCCD gồm đúng 12 chữ số; các mã còn lại được gửi dưới dạng MSSV.
    data.set(
      "identifierType",
      /^\d{12}$/.test(String(data.get("identifier"))) ? "cccd" : "mssv",
    );
    const failure = await mutate(
      "/api/applications",
      "POST",
      Object.fromEntries(data),
    );
    setPending(false);
    setMessage(
      failure ??
        "Đã nhận hồ sơ. Bạn có thể đăng nhập bằng email để theo dõi xét duyệt.",
    );
    if (!failure) {
      form.reset();
      setSuccess(true);
    }
  }

  return (
    <form
      ref={formRef}
      className="auth-form"
      method="post"
      noValidate
      onSubmit={submit}
    >
      <div className="auth-registration-heading">
        {!success && step === 1 && (
          <button
            type="button"
            className="auth-back"
            disabled={pending}
            onClick={() => changeStep(0)}
          >
            ← Quay lại
          </button>
        )}
        <h1 tabIndex={-1}>Đăng ký</h1>
      </div>
      {!success && (
        <>
          <p className="auth-step" aria-live="polite">
            Bước {step + 1}/2 ·{" "}
            {step === 0 ? "Thông tin cá nhân" : "Thông tin tài khoản"}
          </p>
          <fieldset
            className="auth-fields"
            data-step="0"
            hidden={step !== 0}
            disabled={pending}
          >
            <legend className="visually-hidden">Thông tin cá nhân</legend>
            {personal.map(({ name, label, ...attributes }) => (
              <label key={name}>
                {label}
                <input
                  {...attributes}
                  name={name}
                  aria-label={label}
                  required
                />
              </label>
            ))}
          </fieldset>
          <fieldset
            className="auth-fields"
            data-step="1"
            hidden={step !== 1}
            disabled={pending}
          >
            <legend className="visually-hidden">Thông tin tài khoản</legend>
            {accountFields.map(({ name, label, ...attributes }) => {
              const Input = name.startsWith("password")
                ? PasswordInput
                : "input";
              return (
                <label key={name} htmlFor={`${formId}-${name}`}>
                  {label}
                  <Input
                    {...attributes}
                    id={`${formId}-${name}`}
                    name={name}
                    aria-label={label}
                    required
                    onInput={(event) =>
                      event.currentTarget.setCustomValidity("")
                    }
                  />
                  {name === "password" && (
                    <small>
                      Tối thiểu 8 ký tự. Dùng mật khẩu riêng cho Alumni.
                    </small>
                  )}
                </label>
              );
            })}
            <label className="auth-confirm">
              <input type="checkbox" required />
              Tôi xác nhận thông tin đăng ký là chính xác.
            </label>
          </fieldset>
          <div className="auth-form-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={pending}
            >
              {pending ? "Đang gửi…" : step === 0 ? "Tiếp theo →" : "Đăng ký"}
            </button>
          </div>
        </>
      )}
      <output
        className={success ? "auth-success" : undefined}
        aria-live="polite"
      >
        {message}
      </output>
    </form>
  );
}
