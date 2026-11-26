import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell page-section" id="main" tabIndex={-1}>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc nội dung đã được gỡ.</p>
      <Link className="button button-primary event-action" href="/">
        Về trang chủ Alumni Hub
      </Link>
    </main>
  );
}
