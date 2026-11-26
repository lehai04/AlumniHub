import Link from "next/link";
import { readBackend, readStaffSession } from "../../../lib/backend";
import type { ServiceContent } from "../../../lib/services";
import { Mailbox, ServiceEditor } from "./service-editor";

export default async function ManageServicesPage() {
  const session = await readStaffSession();
  const role = session.account?.role;
  if (role !== "admin" && role !== "reviewer")
    return (
      <section className="page-section">
        <h1>Quản trị Ưu đãi và Thư viện</h1>
        <Link href="/admin/login">Đăng nhập bằng tài khoản có quyền</Link>
      </section>
    );
  const response = await readBackend("/api/admin/services", true);
  if (!response.ok) throw new Error("Cannot load managed content");
  const entries: ServiceContent[] = await response.json();
  return (
    <section className="page-section">
      <h1>Quản trị Ưu đãi và Thư viện</h1>
      <p>
        Admin Alumni soạn và gửi nội dung. Người duyệt của Trường có thể trả
        lại, duyệt để công bố hoặc gỡ nội dung.
      </p>
      {role === "admin" && <ServiceEditor role={role} />}
      {entries.map((entry) => (
        <ServiceEditor
          key={`${entry.id}:${entry.revision}`}
          entry={entry}
          role={role}
        />
      ))}
      {!entries.length && <p>Chưa có nội dung.</p>}
      {role === "admin" && session.passwordResetEnabled && <Mailbox />}
    </section>
  );
}
