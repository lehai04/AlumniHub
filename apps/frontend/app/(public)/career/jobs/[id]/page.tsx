import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readBackend, readCareer } from "../../../../../lib/backend";
import { type Cv, type Job, workModes } from "../../../../../lib/career";
import { privateRobots } from "../../../../../lib/seo";
import { ApplyForm } from "../../career-forms";

export const metadata = { title: "Chi tiết việc làm", robots: privateRobots };

export default async function CareerJob({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) notFound();
  const response = await readBackend(`/api/career/jobs/${id}`, true);
  if (response.status === 401 || response.status === 403) redirect("/career");
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Job endpoint unavailable");
  const job: Job & { is_owner: boolean; has_applied: boolean } =
    await response.json();
  const available = !job.closed_at && !job.is_owner && !job.has_applied;
  const cvs = available ? await readCareer<Cv[]>("cvs") : [];
  return (
    <section className="page-section career-copy">
      <Link href="/career">← Tìm việc</Link>
      <h1>{job.title}</h1>
      <p>
        {job.company} · {job.location} · {workModes[job.mode]}
      </p>
      <p className="event-description">{job.description}</p>
      {job.closed_at && <p>Đã đóng nhận ứng tuyển.</p>}
      {job.is_owner && (
        <Link href={`/career/received/${id}`}>Xem hồ sơ ứng tuyển</Link>
      )}
      {job.has_applied && (
        <Link href="/career?tab=history">Đã ứng tuyển · Xem lịch sử</Link>
      )}
      {available &&
        (cvs.length ? (
          <ApplyForm id={id} cvs={cvs} />
        ) : (
          <Link href="/career?tab=cvs">Tải CV lên để ứng tuyển</Link>
        ))}
    </section>
  );
}
