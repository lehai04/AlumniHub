import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readBackend } from "../../../../../lib/backend";
import type { Candidate } from "../../../../../lib/career";
import { privateRobots } from "../../../../../lib/seo";

export const metadata = { title: "Hồ sơ ứng viên", robots: privateRobots };

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) notFound();
  const response = await readBackend(`/api/career/candidates/${id}`, true);
  if (response.status === 401 || response.status === 403) redirect("/career");
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Candidate endpoint unavailable");
  const { profile }: { profile: Candidate } = await response.json();
  return (
    <section className="page-section career-copy">
      <Link href="/career?tab=recruit">← Ứng viên đang tìm việc</Link>
      <h1>{profile.fullName}</h1>
      <p>{[profile.specialty, profile.cohort].filter(Boolean).join(" · ")}</p>
      {profile.intro && (
        <>
          <h2>Giới thiệu</h2>
          <p className="event-description">{profile.intro}</p>
        </>
      )}
      {profile.experience && (
        <>
          <h2>Kinh nghiệm</h2>
          <p className="event-description">{profile.experience}</p>
        </>
      )}
      {profile.certificates && (
        <>
          <h2>Chứng chỉ</h2>
          <p className="event-description">{profile.certificates}</p>
        </>
      )}
    </section>
  );
}
