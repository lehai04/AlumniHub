import Link from "next/link";
import { redirect } from "next/navigation";
import { readStaffSession } from "../../lib/backend";
import { publicPages } from "../../lib/public-pages";
import { contentMenu, operationsMenu } from "./navigation";

export default async function AdminPage() {
  const { account } = await readStaffSession();
  const admin = account?.role === "admin";
  const reviewer = account?.role === "reviewer";
  const content = admin
    ? contentMenu
    : contentMenu.filter(({ href }) => href === "/admin/services");
  if (!admin && !reviewer) redirect("/admin/login");

  const groups = [
    { title: "Nội dung website", links: content },
    ...(admin ? [{ title: "Nghiệp vụ", links: operationsMenu }] : []),
  ];
  return (
    <section className="cms-dashboard">
      <header className="cms-dashboard-heading">
        <h1>Quản trị Alumni Hub</h1>
      </header>
      {groups.map(({ title, links }) => (
        <section className="cms-dashboard-group" key={title}>
          <h2>{title}</h2>
          <div className="cms-card-grid">
            {links.map(({ href, label, description }) => (
              <Link className="cms-card" key={href} href={href}>
                <span className="cms-card-heading">
                  <strong>{label}</strong>
                  <span aria-hidden="true">→</span>
                </span>
                <small>{description}</small>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {admin && (
        <section
          className="cms-dashboard-group cms-page-links"
          id="website-pages"
        >
          <h2>Các trang công khai</h2>
          <div>
            {Object.entries(publicPages).map(([page, { title }]) => (
              <Link key={page} href={`/admin/pages/${page}`}>
                {title} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
