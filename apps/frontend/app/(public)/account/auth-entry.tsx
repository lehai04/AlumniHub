"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { BrandMark } from "../../components/brand-mark";
import { SessionForm } from "../../components/session-form";
import { ApplicationForm } from "./application-form";

type Props = {
  registrationEnabled: boolean;
  localLogin: boolean;
  passwordResetEnabled: boolean;
};

export function AuthEntry({
  registrationEnabled,
  localLogin,
  passwordResetEnabled,
}: Props) {
  const params = useSearchParams();
  const register = registrationEnabled && params.get("view") === "register";
  const local =
    localLogin && (!registrationEnabled || params.get("view") === "local");
  const stage = useRef<HTMLDivElement>(null);
  const [moving, setMoving] = useState(false);

  function switchView(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (
      (new URL(event.currentTarget.href).searchParams.get("view") ===
        "register") !==
      register
    )
      setMoving(true);
    // Lịch sử trình duyệt đổi tức thì để CSS chạy liên tục và giữ dữ liệu hai form.
    window.history.pushState(null, "", event.currentTarget.href);
  }

  useEffect(() => {
    stage.current
      ?.querySelector<HTMLElement>(
        register ? ".auth-register h1" : ".auth-login h1",
      )
      ?.focus({ preventScroll: true });
  }, [register]);

  const logo = (
    <Link href="/" aria-label="Về trang chủ Alumni">
      <BrandMark />
    </Link>
  );
  return (
    <section className="auth-entry">
      <div
        className="auth-stage"
        data-register={register}
        data-moving={moving}
        ref={stage}
      >
        <aside className="auth-welcome" aria-label="Chào mừng trở lại">
          <p
            className="auth-greeting auth-greeting-login"
            aria-hidden={register}
          >
            Chào mừng anh chị<span>Đã trở lại!</span>
          </p>
          <p
            className="auth-greeting auth-greeting-register"
            aria-hidden={!register}
          >
            Chào mừng anh chị<span>Đã trở lại!</span>
          </p>
        </aside>
        <div
          className="auth-panel auth-login"
          inert={register}
          aria-hidden={register}
        >
          {logo}
          <h1 tabIndex={-1}>Đăng nhập</h1>
          {registrationEnabled || local ? (
            <SessionForm
              signedIn={false}
              localAlumni={local}
              emailLabel="Tên đăng nhập"
            />
          ) : (
            <p>Hệ thống đăng nhập chưa được mở.</p>
          )}
          {passwordResetEnabled && !local && (
            <Link className="auth-help" href="/account/reset">
              Quên tài khoản?
            </Link>
          )}
          {registrationEnabled && (
            <p className="auth-switch">
              Bạn chưa có tài khoản?{" "}
              <Link href="/account?view=register" onClick={switchView}>
                Đăng ký
              </Link>
            </p>
          )}
          {localLogin && registrationEnabled && (
            <Link
              className="auth-help"
              href={local ? "/account" : "/account?view=local"}
              onClick={switchView}
            >
              {local ? "Đăng nhập bằng email" : "Tài khoản thử nghiệm local"}
            </Link>
          )}
        </div>
        {registrationEnabled && (
          <div
            className="auth-panel auth-register"
            inert={!register}
            aria-hidden={!register}
          >
            {logo}
            <ApplicationForm />
            <p className="auth-switch">
              Bạn đã có tài khoản?{" "}
              <Link href="/account" onClick={switchView}>
                Đăng nhập
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
