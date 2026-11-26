import Link from "next/link";
import { eventDate, readBackend } from "../../../lib/backend";
import type { Article } from "../../../lib/news";
import { ArticleForm } from "./article-form";

export default async function AdminNewsPage() {
  const response = await readBackend("/api/admin/news", true);
  if (response.status === 401 || response.status === 403) {
    return (
      <section className="page-section">
        <h1>Quản trị tin tức</h1>
        <p>Khu vực này yêu cầu quyền quản trị viên.</p>
        <Link href="/admin/login">Đăng nhập quản trị</Link>
      </section>
    );
  }
  if (!response.ok) throw new Error("Admin news endpoint unavailable");
  const articles: Article[] = await response.json();
  return (
    <section className="page-section">
      <Link href="/admin">← Quản trị Alumni Hub</Link>
      <h1>Quản trị tin tức</h1>
      <h2>Soạn tin mới</h2>
      <ArticleForm />
      <h2>Tin đã tạo</h2>
      <div className="event-list">
        {articles.length === 0 && <p>Chưa có bản tin.</p>}
        {articles.map((article) => {
          const published = Boolean(
            article.published_at && !article.withdrawn_at,
          );
          const status = published
            ? "Đã công bố"
            : article.withdrawn_at
              ? "Đã gỡ"
              : "Bản nháp";
          return (
            <details className="info-card" key={article.slug}>
              <summary>
                {article.title} · {status}
              </summary>
              {article.published_at && (
                <p>Lần công bố gần nhất: {eventDate(article.published_at)}</p>
              )}
              {published && (
                <Link href={`/news/${article.slug}`}>Xem tin công khai</Link>
              )}
              <p>
                <Link href={`/admin/items/news/${article.slug}`}>
                  Chỉnh nội dung, ảnh và link bài tin
                </Link>
              </p>
              <ArticleForm key={JSON.stringify(article)} article={article} />
            </details>
          );
        })}
      </div>
    </section>
  );
}
