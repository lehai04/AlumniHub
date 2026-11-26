import Link from "next/link";
import { notFound } from "next/navigation";
import { readBackend, readStaffSession } from "../../../../../lib/backend";
import { HomepageEditor } from "../../../homepage/homepage-editor";

export default async function ManageItem({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;
  if ((kind !== "news" && kind !== "events") || !/^[a-z0-9-]{1,80}$/.test(slug))
    notFound();
  const { account } = await readStaffSession();
  if (account?.role !== "admin")
    return (
      <section className="page-section">
        <h1>Biên tập nội dung</h1>
        <Link href="/admin/login">Đăng nhập Admin Alumni</Link>
      </section>
    );

  const endpoint = `/api/admin/${kind}-content/${slug}`;
  const response = await readBackend(endpoint, true);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Item draft unavailable");
  const fields = {
    title: ["Tiêu đề", "", 160],
    ...(kind === "news" ? { summary: ["Tóm tắt", "", 280] as const } : {}),
    body: [
      kind === "news" ? "Nội dung bài viết" : "Nội dung sự kiện",
      "",
      kind === "news" ? 6500 : 4000,
    ],
    imageAlt: ["Mô tả ảnh", ""],
    linkLabel: ["Chữ hiển thị của link", ""],
    linkUrl: ["Địa chỉ link nội bộ hoặc HTTP/HTTPS", ""],
  } as const;
  return (
    <section className="page-section">
      <Link href={`/admin/${kind}`}>
        ← {kind === "news" ? "Quản trị tin tức" : "Quản trị sự kiện"}
      </Link>
      <h1>{kind === "news" ? "Biên tập bài tin" : "Biên tập sự kiện"}</h1>
      <p>
        Lưu bản nháp trước khi công bố. Nội dung đã công bố vẫn hiển thị trong
        lúc bạn chỉnh.
      </p>
      <HomepageEditor
        initial={await response.json()}
        endpoint={endpoint}
        publicPath={`/${kind}/${slug}`}
        fields={fields}
        images={[["hero", "Ảnh tải lên", null, "image"]]}
      />
    </section>
  );
}
