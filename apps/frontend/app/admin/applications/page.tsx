import Link from "next/link";
import { eventDate, readBackend } from "../../../lib/backend";
import { ApproveForm } from "./approve-form";

type Review = {
  id: string;
  full_name: string;
  email: string;
  faculty: string;
  cohort: string;
  phone: string;
  occupation: string;
  workplace: string;
  identifier_type: "mssv" | "cccd";
  identifier: string;
  created_at: string;
  code: string | null;
  reviewed_by: string | null;
  issued_at: string | null;
};

export default async function ApplicationsPage() {
  const response = await readBackend("/api/admin/applications", true);
  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return (
      <section className="page-section">
        <h1>Xét duyệt hồ sơ Alumni</h1>
        <p>Mục này yêu cầu quyền quản trị viên.</p>
        <Link href="/admin/login">Đăng nhập quản trị</Link>
      </section>
    );
  }
  if (!response.ok) throw new Error("Applications endpoint unavailable");
  const { applications }: { applications: Review[] } = await response.json();

  return (
    <section className="page-section">
      <Link href="/admin/events">Quản trị sự kiện</Link>
      <h1>Xét duyệt hồ sơ Alumni</h1>
      <div className="event-list">
        {applications.length === 0 && <p>Chưa có hồ sơ đăng ký.</p>}
        {applications.map((application) => (
          <details className="info-card" key={application.id}>
            <summary>
              {application.full_name} ·{" "}
              {application.code ? "Đã duyệt" : "Chờ duyệt"}
            </summary>
            <p>
              {application.identifier_type.toUpperCase()}:{" "}
              {application.identifier}
            </p>
            <p>
              Khoa: {application.faculty} · Gửi ngày{" "}
              {eventDate(application.created_at)}
            </p>
            <p>
              Liên hệ: {application.email} · {application.phone}
            </p>
            {application.cohort && <p>Khóa theo học: {application.cohort}</p>}
            {application.occupation && (
              <p>Ngành nghề: {application.occupation}</p>
            )}
            {application.workplace && (
              <p>Đơn vị làm việc: {application.workplace}</p>
            )}
            {application.code && application.issued_at ? (
              <p>
                Mã thẻ {application.code} · Duyệt bởi {application.reviewed_by}{" "}
                · {eventDate(application.issued_at)}
              </p>
            ) : (
              <>
                {application.identifier_type === "cccd" && (
                  <p>
                    Đối chiếu CCCD ngoài hệ thống trước khi xác nhận tốt nghiệp.
                  </p>
                )}
                <ApproveForm id={application.id} />
              </>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
