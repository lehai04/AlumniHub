import Link from "next/link";
import { notFound } from "next/navigation";
import { readBackend, readStaffSession } from "../../../../lib/backend";
import {
  isPublicPage,
  publicPageFields,
  publicPages,
} from "../../../../lib/public-pages";
import { HomepageEditor } from "../../homepage/homepage-editor";

export default async function AdminPublicPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (!isPublicPage(page)) notFound();
  const { account } = await readStaffSession();
  if (account?.role !== "admin")
    return (
      <section className="page-section">
        <h1>{publicPages[page].title}</h1>
        <Link href="/admin/login">Đăng nhập Admin Alumni</Link>
      </section>
    );
  const endpoint = `/api/admin/pages/${page}`;
  const response = await readBackend(endpoint, true);
  if (!response.ok) throw new Error("Cannot load page draft");
  return (
    <section className="page-section">
      <Link href="/admin#website-pages">← Các trang công khai</Link>
      <h1>{publicPages[page].title}</h1>
      <p>
        Chỉnh phần giới thiệu, ảnh và link. Công bố để cập nhật trang công khai.
      </p>
      <HomepageEditor
        initial={await response.json()}
        endpoint={endpoint}
        publicPath={`/${page}`}
        fields={publicPageFields(page)}
        images={[["hero", "Ảnh trang", null, "image"]]}
      />
    </section>
  );
}
