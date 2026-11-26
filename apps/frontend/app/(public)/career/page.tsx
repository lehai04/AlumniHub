import Link from "next/link";
import { eventDate, readCareer, readSession } from "../../../lib/backend";
import type { Candidate, Cv, History, Job, Profile } from "../../../lib/career";
import { previewJobs } from "../../../lib/career-preview";
import { previewProfile } from "../../../lib/career-profile";
import { readPageIntro } from "../../../lib/public-content";
import { sectionMetadata } from "../../../lib/seo";
import { PageIntro } from "../page-intro";
import { CvForm, JobForm } from "./career-forms";
import { CareerLanding } from "./career-landing";
import { CareerProfile } from "./career-profile";

const tabs = [
  ["jobs", "Tìm việc"],
  ["profile", "Hồ sơ nghề nghiệp"],
  ["cvs", "Kho CV"],
  ["recruit", "Tuyển dụng"],
  ["history", "Lịch sử ứng tuyển"],
] as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab, topic } = await searchParams;
  return sectionMetadata("career", tab !== undefined || topic !== undefined);
}

export default async function CareerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, session] = await Promise.all([searchParams, readSession()]);
  const member =
    session.account?.role === "alumni" &&
    !session.account.id.startsWith("local:");
  const tab = tabs.find(([id]) => id === params.tab)?.[0] ?? "jobs";
  if (tab === "jobs") {
    // Khách chỉ xem tin minh họa; quyền đọc tin thật và ứng tuyển vẫn do backend kiểm tra.
    const [intro, jobs, profile] = await Promise.all([
      readPageIntro("career"),
      member ? readCareer<Job[]>("jobs") : Promise.resolve([]),
      member ? readCareer<Profile>("profile") : Promise.resolve(null),
    ]);
    return (
      <CareerLanding
        key={session.account?.id ?? "guest"}
        intro={intro}
        jobs={jobs.length ? jobs : previewJobs}
        accountId={member ? session.account?.id : undefined}
        specialty={profile?.profile.specialty}
        initialSavedOnly={params.saved === "1"}
        initialSearch={{
          q: typeof params.q === "string" ? params.q : "",
          location: typeof params.location === "string" ? params.location : "",
          mode: typeof params.mode === "string" ? params.mode : "",
        }}
      />
    );
  }
  if (tab === "profile" && (member || params.preview === "1")) {
    const [data, cvs] = member
      ? await Promise.all([
          readCareer<Profile>("profile"),
          readCareer<Cv[]>("cvs"),
        ])
      : [previewProfile, []];
    return <CareerProfile data={data} cvs={cvs} preview={!member} />;
  }
  if (!member) {
    return (
      <section className="page-section">
        <PageIntro page="career" />
        <p>
          Đăng nhập bằng tài khoản cựu sinh viên đã được cấp thẻ Alumni để sử
          dụng Career Hub.
        </p>
        <Link className="button button-primary" href="/account">
          Mở trang tài khoản
        </Link>
        {tab === "profile" && (
          <p>
            <Link href="/career?tab=profile&preview=1">
              Xem giao diện hồ sơ mẫu →
            </Link>
          </p>
        )}
      </section>
    );
  }
  return (
    <section className="page-section">
      <PageIntro page="career" />
      <nav aria-label="Điều hướng Career Hub" className="section-tabs">
        {tabs.map(([id, label]) => (
          <Link
            className={`button ${id === tab ? "button-primary" : "button-outline"}`}
            aria-current={id === tab ? "page" : undefined}
            href={id === "jobs" ? "/career" : `/career?tab=${id}`}
            key={id}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "cvs" && <CvSection />}
      {tab === "recruit" && <RecruitSection />}
      {tab === "history" && <HistorySection />}
    </section>
  );
}

async function CvSection() {
  const cvs = await readCareer<Cv[]>("cvs");
  return (
    <>
      <h2>Kho CV</h2>
      <p>{cvs.length}/5 tệp PDF · Tối đa 5 MB mỗi tệp.</p>
      <CvForm full={cvs.length >= 5} />
      <div className="event-list">
        {cvs.map((cv) => (
          <details className="info-card" key={cv.id}>
            <summary>{cv.name}</summary>
            <a href={`/api/career/cvs/${cv.id}`} download>
              Tải CV
            </a>
            <CvForm cv={cv} key={cv.name} />
          </details>
        ))}
      </div>
    </>
  );
}

async function RecruitSection() {
  const [jobs, candidates] = await Promise.all([
    readCareer<Job[]>("own-jobs"),
    readCareer<{ id: string; profile: Candidate }[]>("candidates"),
  ]);
  return (
    <>
      <h2>Soạn tin tuyển dụng</h2>
      <JobForm />
      <h2>Tin của tôi</h2>
      <div className="event-list">
        {jobs.length === 0 && <p>Bạn chưa tạo tin tuyển dụng.</p>}
        {jobs.map((job) => (
          <details className="info-card" key={job.id}>
            <summary>
              {job.title} ·{" "}
              {job.closed_at
                ? "Đã đóng"
                : job.published_at
                  ? "Đang tuyển"
                  : "Bản nháp"}
            </summary>
            <Link href={`/career/received/${job.id}`}>Xem hồ sơ ứng tuyển</Link>
            <JobForm key={JSON.stringify(job)} job={job} />
          </details>
        ))}
      </div>
      <h2>Ứng viên đang tìm việc</h2>
      <p>
        Hồ sơ rút gọn hiển thị khi bạn có tin đang tuyển và ứng viên bật chế độ
        tìm việc.
      </p>
      <div className="event-list">
        {candidates.length === 0 && <p>Chưa có hồ sơ phù hợp để hiển thị.</p>}
        {candidates.map(({ id, profile }) => (
          <article className="info-card career-copy" key={id}>
            <h3>
              <Link href={`/career/candidates/${id}`}>{profile.fullName}</Link>
            </h3>
            <p>
              {[profile.specialty, profile.cohort].filter(Boolean).join(" · ")}
            </p>
            {profile.intro && <p>{profile.intro}</p>}
            {profile.experience && <p>Kinh nghiệm: {profile.experience}</p>}
            {profile.certificates && <p>Chứng chỉ: {profile.certificates}</p>}
          </article>
        ))}
      </div>
    </>
  );
}

async function HistorySection() {
  const history = await readCareer<History[]>("applications");
  return (
    <>
      <h2>Lịch sử ứng tuyển</h2>
      <div className="event-list">
        {history.length === 0 && <p>Bạn chưa nộp hồ sơ ứng tuyển.</p>}
        {history.map((item) => (
          <article className="info-card" key={item.id}>
            <h3>
              <Link href={`/career/jobs/${item.job_id}`}>{item.title}</Link>
            </h3>
            <p>
              {item.company} · Đã nộp {eventDate(item.submitted_at)}
            </p>
            <a href={`/api/career/applications/${item.id}/cv`} download>
              {item.cv_name} (bản đã nộp)
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
