import Link from "next/link";
import { readBackend, readStaffSession } from "../../../lib/backend";
import { HomepageEditor } from "./homepage-editor";

export default async function AdminHomepage() {
  const session = await readStaffSession();
  if (session.account?.role !== "admin")
    return (
      <section className="page-section">
        <h1>Nội dung trang chủ</h1>
        <Link href="/admin/login">Đăng nhập Admin Alumni</Link>
      </section>
    );
  const response = await readBackend("/api/admin/homepage", true);
  if (!response.ok) throw new Error("Cannot load homepage draft");
  return (
    <section className="page-section">
      <Link href="/admin">← Quản trị Alumni Hub</Link>
      <h1>Nội dung trang chủ</h1>
      <p>
        Lưu bản nháp để xem lại nội dung và ảnh. Chọn Công bố để cập nhật
        website.
      </p>
      <HomepageEditor initial={await response.json()} />
    </section>
  );
}
