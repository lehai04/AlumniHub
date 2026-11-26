import Link from "next/link";
import { notFound } from "next/navigation";
import { readSession } from "../../../../lib/backend";
import { privateRobots } from "../../../../lib/seo";
import { PasswordResetForm } from "./reset-form";

export const metadata = { title: "Quên mật khẩu", robots: privateRobots };

export default async function PasswordResetPage() {
  const session = await readSession();
  if (!session.passwordResetEnabled) notFound();
  return (
    <section className="page-section">
      <h1>Quên mật khẩu</h1>
      <PasswordResetForm />
      <Link href="/account">Về trang đăng nhập</Link>
    </section>
  );
}
