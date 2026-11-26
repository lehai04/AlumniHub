import Link from "next/link";
import { eventDate, readBackend } from "../../../lib/backend";
import {
  type Collaboration,
  type CommunityPost,
  communityStatus,
  communityTabs,
  type RoleRequest,
  roleNames,
  topicNames,
} from "../../../lib/community";
import { ReviewForm } from "./review-form";

export default async function AdminCommunity({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const section = communityTabs.find(([id]) => id === tab)?.[0] ?? "posts";
  const response = await readBackend(`/api/admin/community/${section}`, true);
  if (response.status === 401 || response.status === 403)
    return (
      <section className="page-section">
        <h1>Quản trị cộng đồng</h1>
        <p>Khu vực này yêu cầu quyền quản trị viên.</p>
        <Link href="/admin/login">Đăng nhập quản trị</Link>
      </section>
    );
  if (!response.ok) throw new Error("Community admin endpoint unavailable");
  const rows: RoleRequest[] | CommunityPost[] | Collaboration[] =
    await response.json();
  return (
    <section className="page-section">
      <Link href="/admin/events">← Quản trị Alumni Hub</Link>
      <h1>Quản trị cộng đồng</h1>
      <nav className="section-tabs" aria-label="Điều hướng quản trị cộng đồng">
        {communityTabs.map(([id, title]) => (
          <Link
            className={`button ${id === section ? "button-primary" : "button-outline"}`}
            href={`/admin/community?tab=${id}`}
            aria-current={id === section ? "page" : undefined}
            key={id}
          >
            {title}
          </Link>
        ))}
      </nav>
      {section === "collaborations" && (
        <p>Ghi nhận đơn vị đã được chuyển xử lý và cập nhật kết quả tại đây.</p>
      )}
      <div className="event-list">
        {rows.length === 0 && <p>Chưa có mục nào cần xử lý.</p>}
        {rows.map((row) => {
          const ended = "ended_at" in row && row.ended_at;
          const title =
            "role" in row
              ? `${roleNames[row.role]} · ${row.target_name}`
              : "topic" in row
                ? `${topicNames[row.topic]} · ${row.author_name}`
                : row.sender_name;
          return (
            <details key={row.id} className="info-card">
              <summary>
                {title} · {ended ? "Đã kết thúc" : communityStatus[row.status]}
              </summary>
              <p>Ngày gửi: {eventDate(row.created_at)}</p>
              {"role" in row && (
                <>
                  <p>
                    Người gửi: {row.requester_name} · Mã người được đề nghị:{" "}
                    {row.target_code}
                  </p>
                  <p className="community-copy">{row.reason}</p>
                  <a
                    href={row.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mở minh chứng
                  </a>
                  {row.reviewed_at && (
                    <p>
                      Xét bởi {row.reviewed_by} · {eventDate(row.reviewed_at)} ·{" "}
                      {row.decision_note}
                    </p>
                  )}
                  {row.ended_at && (
                    <p>
                      Kết thúc bởi {row.ended_by} · {eventDate(row.ended_at)} ·{" "}
                      {row.end_note}
                    </p>
                  )}
                </>
              )}
              {"topic" in row && <p className="community-copy">{row.body}</p>}
              {"need" in row && (
                <>
                  <p>Email liên hệ: {row.contact_email}</p>
                  <p className="community-copy">{row.need}</p>
                  {row.requested_unit && (
                    <p>Đơn vị mong muốn: {row.requested_unit}</p>
                  )}
                  {row.assigned_unit && (
                    <p>Đơn vị tiếp nhận: {row.assigned_unit}</p>
                  )}
                  {row.handling_note && <p>Ghi chú: {row.handling_note}</p>}
                </>
              )}
              {!ended && (
                <ReviewForm section={section} id={row.id} status={row.status} />
              )}
            </details>
          );
        })}
      </div>
    </section>
  );
}
