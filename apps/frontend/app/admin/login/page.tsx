import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readStaffSession } from "../../../lib/backend";
import { SessionForm } from "../../components/session-form";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
};

export default async function AdminLoginPage() {
  const { account, loginEnabled } = await readStaffSession();
  if (account) redirect("/admin");

  return (
    <section className="cms-signin">
      <h1>Đăng nhập quản trị</h1>
      {loginEnabled ? (
        <>
          <p>
            Sử dụng tài khoản quản trị hoặc tài khoản người duyệt do Trường cấp.
          </p>
          <SessionForm signedIn={false} portal="staff" />
        </>
      ) : (
        <p>
          Cổng quản trị chưa được kích hoạt. Vui lòng liên hệ đơn vị vận hành.
        </p>
      )}
    </section>
  );
}
