import Link from "next/link";
import { notFound } from "next/navigation";
import { eventDate, readBackend } from "../../../../../lib/backend";

type Report = {
  title: string;
  registration_count: number;
  expected_attendees: number;
  registrations: {
    account_id: string;
    full_name: string | null;
    alumni_code: string | null;
    email: string | null;
    registered_at: string;
    guests: number;
    total: number;
  }[];
};

export default async function Registrations({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const response = await readBackend(
    `/api/admin/events/${slug}/registrations`,
    true,
  );
  if (response.status === 404) notFound();
  if (response.status === 401 || response.status === 403) {
    return (
      <section className="page-section">
        <h1>Danh sách đăng ký</h1>
        <p>Khu vực này yêu cầu quyền quản trị viên.</p>
        <Link href="/admin/login">Đăng nhập quản trị</Link>
      </section>
    );
  }
  if (!response.ok) throw new Error("Event registration report unavailable");
  const report: Report = await response.json();
  return (
    <section className="page-section">
      <Link href="/admin/events">← Quản trị sự kiện</Link>
      <h1>Danh sách đăng ký</h1>
      <h2>{report.title}</h2>
      <p>
        {report.registration_count} lượt đăng ký · {report.expected_attendees}{" "}
        người dự kiến tham dự
      </p>
      <p>
        <a
          className="button button-outline"
          href={`/api/admin/events/${slug}/registrations-export`}
        >
          Xuất Excel
        </a>
      </p>
      <p>Gửi file cho bộ phận tạo vé để họ gửi QR đến email đăng ký.</p>
      {report.registrations.length === 0 ? (
        <p>Chưa có lượt đăng ký.</p>
      ) : (
        <div className="report-scroll">
          <table className="registration-report">
            <caption>{slug}</caption>
            <thead>
              <tr>
                <th scope="col">Cựu sinh viên</th>
                <th scope="col">Email đăng ký</th>
                <th scope="col">Thời gian đăng ký</th>
                <th scope="col">Người đi cùng</th>
                <th scope="col">Tổng số người</th>
              </tr>
            </thead>
            <tbody>
              {report.registrations.map((registration) => (
                <tr key={registration.account_id}>
                  <td>
                    {registration.full_name && (
                      <div>{registration.full_name}</div>
                    )}
                    {registration.alumni_code ?? registration.account_id}
                  </td>
                  <td>{registration.email ?? "—"}</td>
                  <td>
                    <time dateTime={registration.registered_at}>
                      {eventDate(registration.registered_at)}
                    </time>
                  </td>
                  <td>{registration.guests}</td>
                  <td>{registration.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
