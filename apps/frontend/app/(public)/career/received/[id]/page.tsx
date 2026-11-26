import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eventDate, readBackend } from "../../../../../lib/backend";
import type { Application } from "../../../../../lib/career";
import { privateRobots } from "../../../../../lib/seo";

export const metadata = { title: "Hồ sơ ứng tuyển", robots: privateRobots };

export default async function Received({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) notFound();
  const response = await readBackend(
    `/api/career/own-jobs/${id}/applications`,
    true,
  );
  if (response.status === 401 || response.status === 403) redirect("/career");
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Applications endpoint unavailable");
  const {
    title,
    applications,
  }: { title: string; applications: Application[] } = await response.json();
  return (
    <section className="page-section career-copy">
      <Link href="/career?tab=recruit">← Tuyển dụng</Link>
      <h1>Hồ sơ ứng tuyển</h1>
      <p>{title}</p>
      <div className="event-list">
        {applications.length === 0 && <p>Chưa có ứng viên nộp hồ sơ.</p>}
        {applications.map((item) => (
          <article className="info-card" key={item.id}>
            <h2>{item.candidate.fullName}</h2>
            <p>
              {[item.candidate.specialty, item.candidate.cohort]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.candidate.intro && <p>{item.candidate.intro}</p>}
            {item.candidate.experience && (
              <p>Kinh nghiệm: {item.candidate.experience}</p>
            )}
            {item.candidate.certificates && (
              <p>Chứng chỉ: {item.candidate.certificates}</p>
            )}
            <p>Đã nộp {eventDate(item.submitted_at)}</p>
            <a href={`/api/career/applications/${item.id}/cv`} download>
              {item.cv_name} (bản đã nộp)
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
