import Link from "next/link";
import { sectionMetadata } from "../../../lib/seo";
import { PageIntro } from "../page-intro";

export function generateMetadata() {
  return sectionMetadata("alumni-card");
}

export default function CardOverview() {
  return (
    <section className="page-section">
      <PageIntro page="alumni-card" />
      <div className="event-list">
        <article className="info-card">
          <h2>Ai có thể nhận thẻ?</h2>
          <p>
            Cựu sinh viên gửi hồ sơ để Nhà trường đối chiếu thông tin tốt
            nghiệp. Khi được duyệt, tài khoản nhận một thẻ điện tử và mã Alumni.
          </p>
        </article>
        <article className="info-card">
          <h2>Hạng thẻ và vai trò</h2>
          <p>
            Thẻ hiển thị hạng Thành viên, Gắn kết hoặc Đại sứ theo vai trò còn
            hiệu lực.
          </p>
        </article>
      </div>
      <p className="event-action">
        <Link className="button button-primary" href="/account">
          Mở tài khoản và thẻ
        </Link>
      </p>
    </section>
  );
}
