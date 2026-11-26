import Link from "next/link";
import { eventDate, readBackend, readSession } from "../../../lib/backend";
import {
  type Collaboration,
  type CommunityPost,
  communityStatus,
  communityTabs,
  type RoleRequest,
  roleNames,
  topicNames,
} from "../../../lib/community";
import { sectionMetadata } from "../../../lib/seo";
import { PageIntro } from "../page-intro";
import { CollaborationForm, PostForm, RoleForm } from "./forms";

async function load<T>(resource: string): Promise<T> {
  const response = await readBackend(`/api/community/${resource}`, true);
  if (!response.ok) throw new Error("Community endpoint unavailable");
  return response.json();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab, topic } = await searchParams;
  return sectionMetadata("community", tab !== undefined || topic !== undefined);
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; topic?: string }>;
}) {
  const [session, params] = await Promise.all([readSession(), searchParams]);
  if (
    session.account?.role !== "alumni" ||
    session.account.id.startsWith("local:")
  ) {
    return (
      <section className="page-section">
        <PageIntro page="community" />
        <p>Đăng nhập bằng tài khoản đã được cấp thẻ Alumni để tham gia.</p>
        <Link className="button button-primary" href="/account">
          Mở trang tài khoản
        </Link>
      </section>
    );
  }
  const tab = communityTabs.find(([id]) => id === params.tab)?.[0] ?? "posts";
  return (
    <section className="page-section">
      <PageIntro page="community" />
      <nav aria-label="Điều hướng cộng đồng" className="section-tabs">
        {communityTabs.map(([id, title]) => (
          <Link
            key={id}
            href={`/community?tab=${id}`}
            aria-current={id === tab ? "page" : undefined}
            className={`button ${id === tab ? "button-primary" : "button-outline"}`}
          >
            {title}
          </Link>
        ))}
      </nav>
      {tab === "posts" && <Board topic={params.topic} />}
      {tab === "roles" && <Roles />}
      {tab === "collaborations" && <Collaborations />}
    </section>
  );
}

async function Board({ topic }: { topic?: string }) {
  const [board, mine] = await Promise.all([
    load<CommunityPost[]>("board"),
    load<CommunityPost[]>("posts"),
  ]);
  const posts =
    topic === "career"
      ? board.filter((post) => post.topic === "career")
      : board;
  return (
    <>
      <h2>Bảng tin cộng đồng</h2>
      <div className="section-tabs">
        <Link href="/community" className="button button-outline">
          Tất cả
        </Link>
        <Link href="/community?topic=career" className="button button-outline">
          Cơ hội nghề nghiệp
        </Link>
      </div>
      <div className="event-list">
        {posts.length === 0 && <p>Chưa có bài viết được phép hiển thị.</p>}
        {posts.map((post) => (
          <article key={post.id} className="info-card">
            <h3>{topicNames[post.topic]}</h3>
            <p>
              {post.author_name} · {eventDate(post.created_at)}
            </p>
            <p className="community-copy">{post.body}</p>
          </article>
        ))}
      </div>
      <h2>Viết bài</h2>
      <PostForm />
      <h2>Bài của tôi</h2>
      <div className="event-list">
        {mine.length === 0 && <p>Bạn chưa gửi bài.</p>}
        {mine.map((post) => (
          <article key={post.id} className="info-card">
            <h3>
              {topicNames[post.topic]} ·{" "}
              {post.status === "pending"
                ? "Chờ kiểm duyệt"
                : communityStatus[post.status]}
            </h3>
            <p className="community-copy">{post.body}</p>
          </article>
        ))}
      </div>
    </>
  );
}

async function Roles() {
  const requests = await load<RoleRequest[]>("roles");
  return (
    <>
      <h2>Đề nghị Gắn kết</h2>
      <RoleForm requestedRole="engagement" />
      <h2>Đề cử Đại sứ</h2>
      <RoleForm requestedRole="ambassador" />
      <h2>Đề nghị của tôi</h2>
      <div className="event-list">
        {requests.length === 0 && <p>Bạn chưa gửi đề nghị hoặc đề cử.</p>}
        {requests.map((request) => (
          <article key={request.id} className="info-card">
            <h3>
              {roleNames[request.role]} · {request.target_name}
            </h3>
            <p>
              {request.ended_at
                ? "Đã kết thúc vai trò"
                : request.status === "pending"
                  ? "Chờ xét duyệt"
                  : communityStatus[request.status]}
            </p>
            <p className="community-copy">{request.reason}</p>
            {request.decision_note && <p>Kết quả: {request.decision_note}</p>}
            {request.end_note && <p>Ghi chú kết thúc: {request.end_note}</p>}
          </article>
        ))}
      </div>
    </>
  );
}

async function Collaborations() {
  const items = await load<Collaboration[]>("collaborations");
  return (
    <>
      <h2>Gửi đề xuất hợp tác</h2>
      <p>
        Admin Alumni tiếp nhận và ghi nhận khoa hoặc trường được chuyển xử lý.
      </p>
      <CollaborationForm />
      <h2>Đề xuất của tôi</h2>
      <div className="event-list">
        {items.length === 0 && <p>Bạn chưa gửi đề xuất.</p>}
        {items.map((item) => (
          <article key={item.id} className="info-card">
            <h3>
              {item.status === "pending"
                ? "Chờ tiếp nhận"
                : communityStatus[item.status]}
            </h3>
            <p className="community-copy">{item.need}</p>
            {item.requested_unit && (
              <p>Đơn vị mong muốn: {item.requested_unit}</p>
            )}
            {item.assigned_unit && (
              <p>Đơn vị tiếp nhận: {item.assigned_unit}</p>
            )}
            {item.handling_note && <p>Ghi chú: {item.handling_note}</p>}
          </article>
        ))}
      </div>
    </>
  );
}
