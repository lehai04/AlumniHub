"use client";

import { type InputHTMLAttributes, useId, useState } from "react";
import "./password-input.css";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const label = props["aria-label"] ?? "mật khẩu";

  // Chỉ đổi cách hiển thị, giữ nguyên giá trị và quy tắc kiểm tra của ô nhập.
  return (
    <span className="password-field">
      <input {...props} id={id} type={visible ? "text" : "password"} />
      <button
        className="password-toggle"
        type="button"
        aria-controls={id}
        aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLocaleLowerCase("vi")}`}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(!visible)}
      >
        {visible ? "Ẩn" : "Hiện"}
      </button>
    </span>
  );
}
