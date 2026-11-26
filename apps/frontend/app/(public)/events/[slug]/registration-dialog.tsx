"use client";

import { type ComponentProps, useRef } from "react";
import { RegisterForm } from "./register-form";

export function RegistrationDialog(props: ComponentProps<typeof RegisterForm>) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="button button-primary"
        onClick={() => dialog.current?.showModal()}
      >
        {props.registration ? "Đã đăng ký" : "Đăng ký"}
      </button>
      {/* Dialog gốc hỗ trợ phím Escape, giữ focus và ngăn thao tác phía sau. */}
      <dialog
        className="registration-dialog"
        ref={dialog}
        aria-labelledby="registration-title"
      >
        <header>
          <h2 id="registration-title">Thông tin đăng ký</h2>
          <button
            type="button"
            className="dialog-close"
            aria-label="Đóng thông tin đăng ký"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        <RegisterForm {...props} onSuccess={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}
