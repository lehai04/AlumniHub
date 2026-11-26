"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { workModes } from "../../../lib/career";
import {
  type CareerListing,
  industries,
  jobCategory,
  jobEmployment,
  normalizeCareerText,
} from "../../../lib/career-preview";
import { CareerIcon, CompanyMark } from "./career-icons";

type Search = { q: string; location: string; mode: string };
type Intro = {
  title: string;
  description: string;
  image?: string;
  alt: string;
  linkUrl?: string;
  linkLabel?: string;
};
const filters = [
  ["all", "Tất cả"],
  ["newest", "Mới nhất"],
  ["intern", "Thực tập"],
  ["part-time", "Bán thời gian"],
  ["alumni", "Từ cộng đồng Alumni"],
] as const;
const employmentLabels = {
  "full-time": "Toàn thời gian",
  intern: "Thực tập",
  "part-time": "Bán thời gian",
};

function subscribeSaved(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("alumni-career-saved", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("alumni-career-saved", callback);
  };
}

export function CareerLanding({
  jobs,
  intro,
  initialSearch,
  accountId,
  specialty = "",
  initialSavedOnly = false,
}: {
  jobs: CareerListing[];
  intro: Intro;
  initialSearch: Search;
  accountId?: string;
  specialty?: string;
  initialSavedOnly?: boolean;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [limit, setLimit] = useState(6);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<CareerListing | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const storageKey = `alumni-career-saved:v1:${accountId ?? "guest"}`;
  // Chỉ lưu ID trên trình duyệt, tách theo tài khoản; không lưu hồ sơ hay CV.
  const savedJson = useSyncExternalStore(
    subscribeSaved,
    () => {
      try {
        return localStorage.getItem(storageKey) ?? "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );
  let saved: string[] = [];
  try {
    const value: unknown = JSON.parse(savedJson);
    if (Array.isArray(value))
      saved = value.filter((id): id is string => typeof id === "string");
  } catch {
    /* Bỏ qua bộ nhớ cũ không còn đúng định dạng. */
  }

  useEffect(() => {
    if (!preview) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [preview]);

  function toggleSaved(job: CareerListing) {
    const exists = saved.includes(job.id);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          exists ? saved.filter((id) => id !== job.id) : [...saved, job.id],
        ),
      );
      window.dispatchEvent(new Event("alumni-career-saved"));
      setMessage(`${exists ? "Đã bỏ lưu" : "Đã lưu"} việc làm “${job.title}”.`);
    } catch {
      setMessage(
        "Trình duyệt chưa cho phép lưu. Vui lòng kiểm tra cài đặt bộ nhớ.",
      );
    }
  }
  function showResults() {
    document
      .getElementById("career-jobs")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSearch({
      q: String(data.get("q") ?? "").trim(),
      location: String(data.get("location") ?? ""),
      mode: search.mode,
    });
    setLimit(6);
    showResults();
  }
  function reset() {
    setSearch({ q: "", location: "", mode: "" });
    setCategory("");
    setFilter("all");
    setSavedOnly(false);
    setLimit(6);
  }

  const visible = jobs.filter((job) => {
    const text = normalizeCareerText(
      `${job.title} ${job.company} ${job.description} ${jobCategory(job)}`,
    );
    return (
      text.includes(normalizeCareerText(search.q)) &&
      (!search.location || job.location === search.location) &&
      (!search.mode || job.mode === search.mode) &&
      (!category || jobCategory(job) === category) &&
      (!savedOnly || saved.includes(job.id)) &&
      (filter === "all" ||
        filter === "newest" ||
        (filter === "alumni"
          ? !job.demo || job.brand === "vlu"
          : jobEmployment(job) === filter))
    );
  });
  if (filter === "newest")
    visible.sort(
      (a, b) =>
        Date.parse(b.published_at ?? "1970-01-01") -
        Date.parse(a.published_at ?? "1970-01-01"),
    );
  const demo = jobs.some((job) => job.demo);
  const active = Boolean(
    search.q ||
      search.location ||
      search.mode ||
      category ||
      savedOnly ||
      filter !== "all",
  );

  return (
    <div className="career-landing">
      <section className="career-hero" aria-labelledby="career-title">
        <Image
          className="career-campus"
          src={intro.image ?? "/assets/illustrations/career-campus.jpg"}
          alt={intro.alt || "Khuôn viên Trường Đại học Văn Lang"}
          fill
          sizes="100vw"
          preload
          unoptimized
        />
        <div className="career-hero-content">
          <h1 id="career-title">
            {intro.title === "Career Hub" ? "Cơ hội việc làm" : intro.title}
          </h1>
          <p>
            {intro.description ===
            "Tìm việc, ứng tuyển và đăng tuyển trong cộng đồng cựu sinh viên."
              ? "Kết nối cựu sinh viên Văn Lang với các doanh nghiệp uy tín, mở rộng cơ hội nghề nghiệp và phát triển sự nghiệp bền vững."
              : intro.description}
          </p>
          {intro.linkUrl && intro.linkLabel && (
            <a className="career-cms-link" href={intro.linkUrl}>
              {intro.linkLabel} →
            </a>
          )}
          <form
            action="/career"
            className="career-finder"
            onSubmit={find}
            key={`${search.q}:${search.location}`}
          >
            <label>
              <CareerIcon name="search" />
              <span className="career-sr-only">
                Vị trí tuyển dụng, tên công ty
              </span>
              <input
                name="q"
                defaultValue={search.q}
                placeholder="Vị trí tuyển dụng, tên công ty"
                maxLength={160}
              />
            </label>
            <label className="career-location">
              <CareerIcon name="pin" />
              <span className="career-sr-only">Địa điểm</span>
              <select name="location" defaultValue={search.location}>
                <option value="">Địa điểm</option>
                {[...new Set(jobs.map((job) => job.location))].map(
                  (location) => (
                    <option key={location}>{location}</option>
                  ),
                )}
              </select>
            </label>
            <button type="submit">
              <CareerIcon name="search" />
              Tìm việc ngay
            </button>
          </form>
          <div className="career-suggestions">
            <strong>Gợi ý tìm kiếm:</strong>
            {["Marketing", "Kế toán", "Thiết kế", "CNTT", "Nhân sự"].map(
              (label) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    setSearch({
                      ...search,
                      q: label === "CNTT" ? "Công nghệ thông tin" : label,
                    });
                    setCategory("");
                    setLimit(6);
                    showResults();
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <nav className="career-shortcuts" aria-label="Tiện ích việc làm">
        <button
          type="button"
          onClick={() => {
            if (!specialty) {
              setMessage(
                "Cập nhật chuyên ngành trong Hồ sơ của tôi để tìm việc phù hợp hơn.",
              );
            } else {
              setSearch({ q: specialty, location: "", mode: "" });
              setCategory("");
              setFilter("all");
              setSavedOnly(false);
            }
            showResults();
          }}
        >
          <span>
            <CareerIcon name="briefcase" />
          </span>
          <div>
            <strong>Việc làm phù hợp</strong>
            <small>Gợi ý theo hồ sơ của bạn</small>
          </div>
          <b>›</b>
        </button>
        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={() => {
            setSavedOnly(!savedOnly);
            setSearch({ q: "", location: "", mode: "" });
            setCategory("");
            setFilter("all");
            setLimit(6);
            showResults();
          }}
        >
          <span>
            <CareerIcon name="bookmark" />
          </span>
          <div>
            <strong>Việc làm đã lưu</strong>
            <small>Xem lại việc làm đã lưu</small>
          </div>
          <b>›</b>
        </button>
        <Link href="/career?tab=history">
          <span>
            <CareerIcon name="send" />
          </span>
          <div>
            <strong>Việc làm đã ứng tuyển</strong>
            <small>Theo dõi lịch sử ứng tuyển</small>
          </div>
          <b>›</b>
        </Link>
        <Link href="/career?tab=profile">
          <span>
            <CareerIcon name="user" />
          </span>
          <div>
            <strong>Hồ sơ của tôi</strong>
            <small>Cập nhật CV, thông tin cá nhân</small>
          </div>
          <b>›</b>
        </Link>
      </nav>

      <section
        className="career-featured"
        id="career-jobs"
        aria-labelledby="career-jobs-title"
      >
        <div className="career-section-heading">
          <h2 id="career-jobs-title">
            {savedOnly ? "Việc làm đã lưu" : "Việc làm nổi bật"}
          </h2>
          <nav className="career-filters" aria-label="Lọc việc làm">
            {filters.map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={filter === id}
                onClick={() => {
                  setFilter(id);
                  setLimit(6);
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        {(active || !demo) && (
          <div className="career-result-meta">
            <p>
              {visible.length} việc làm{category && ` · ${category}`}
              {search.q && ` · “${search.q}”`}
            </p>
            <label>
              Hình thức{" "}
              <select
                aria-label="Hình thức làm việc"
                value={search.mode}
                onChange={(event) => {
                  setSearch({ ...search, mode: event.target.value });
                  setLimit(6);
                }}
              >
                <option value="">Tất cả</option>
                {Object.entries(workModes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {active && (
              <button type="button" onClick={reset}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
        <output className="career-feedback" aria-live="polite">
          {message}
        </output>
        {savedOnly && (
          <p className="career-hint">
            Việc làm được lưu trên trình duyệt này, riêng theo tài khoản đang sử
            dụng.
          </p>
        )}
        <div className="career-job-grid">
          {visible.slice(0, limit).map((job) => (
            <article className="career-job-card" key={job.id}>
              <div className="career-job-top">
                <CompanyMark brand={job.brand} company={job.company} />
                <div>
                  <h3>
                    {job.demo ? (
                      <button type="button" onClick={() => setPreview(job)}>
                        {job.title}
                      </button>
                    ) : (
                      <Link href={`/career/jobs/${job.id}`}>{job.title}</Link>
                    )}
                  </h3>
                  <p>{job.company}</p>
                </div>
                <button
                  type="button"
                  className="career-save"
                  aria-label={`${saved.includes(job.id) ? "Bỏ lưu" : "Lưu"} ${job.title}`}
                  aria-pressed={saved.includes(job.id)}
                  onClick={() => toggleSaved(job)}
                >
                  <CareerIcon name="bookmark" />
                </button>
              </div>
              <div className="career-job-facts">
                <span className="career-salary">
                  <CareerIcon name="money" />
                  {job.salary ?? "Chưa cập nhật"}
                </span>
                <span>
                  <CareerIcon name="pin" />
                  {job.location}
                </span>
                <span>
                  <CareerIcon name="briefcase" />
                  {job.experience ?? "Xem chi tiết"}
                </span>
                <span>
                  <em>
                    {job.closed_at
                      ? "Đã đóng tuyển"
                      : job.demo || jobEmployment(job) !== "full-time"
                        ? employmentLabels[jobEmployment(job)]
                        : workModes[job.mode]}
                  </em>
                </span>
              </div>
            </article>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="career-empty">
            <CareerIcon name="search" />
            <h3>
              {savedOnly
                ? "Bạn chưa lưu việc làm phù hợp với bộ lọc"
                : "Chưa có việc làm phù hợp"}
            </h3>
            <p>Thử từ khóa khác hoặc khám phá thêm ngành nghề.</p>
            <button
              className="button button-outline"
              type="button"
              onClick={reset}
            >
              Xem tất cả việc làm
            </button>
          </div>
        )}
        {visible.length > limit && (
          <button
            type="button"
            className="career-more"
            onClick={() => setLimit(limit + 6)}
          >
            Xem thêm việc làm <CareerIcon name="arrow" />
          </button>
        )}
        {demo && (
          <p className="career-demo-note">
            Các tin và tên doanh nghiệp trên đây chỉ minh họa giao diện, không
            phải thông báo tuyển dụng hoặc xác nhận quan hệ đối tác.
          </p>
        )}
        {accountId && (
          <Link className="career-recruit-link" href="/career?tab=recruit">
            Bạn muốn tuyển dụng? Đăng tin từ cộng đồng Alumni →
          </Link>
        )}
      </section>

      <section
        className="career-industries"
        aria-labelledby="career-industries-title"
      >
        <h2 id="career-industries-title">Khám phá theo ngành nghề</h2>
        <div>
          {industries.map(([label, icon]) => (
            <button
              type="button"
              key={label}
              aria-pressed={category === label}
              onClick={() => {
                setCategory(category === label ? "" : label);
                setSearch({ q: "", location: "", mode: "" });
                setFilter("all");
                setSavedOnly(false);
                setLimit(6);
                showResults();
              }}
            >
              <CareerIcon name={icon} />
              <strong>{label}</strong>
            </button>
          ))}
        </div>
      </section>
      <section
        className="career-partners"
        aria-labelledby="career-partners-title"
      >
        <h2 id="career-partners-title">Doanh nghiệp đồng hành</h2>
        <p>
          Cùng VLU Alumni Hub kết nối và tạo thêm nhiều cơ hội nghề nghiệp cho
          cộng đồng cựu sinh viên.
        </p>
        <div>
          {[
            ["fpt", "FPT"],
            ["vng", "VNG"],
            ["pnj", "PNJ"],
            ["kpmg", "KPMG"],
            ["grab", "Grab"],
            ["unilever", "Unilever"],
          ].map(([brand, company]) => (
            <button
              type="button"
              key={brand}
              aria-label={`Tìm việc tại ${company}`}
              onClick={() => {
                reset();
                setSearch({ q: company, location: "", mode: "" });
                showResults();
              }}
            >
              <CompanyMark brand={brand} company={company} />
            </button>
          ))}
        </div>
        <small>
          Tên doanh nghiệp minh họa; danh sách đối tác chính thức sẽ được cập
          nhật khi xác nhận.
        </small>
      </section>

      <dialog
        ref={dialog}
        className="career-preview-dialog"
        aria-labelledby="career-preview-title"
        onClose={() => setPreview(null)}
      >
        {preview && (
          <>
            <header>
              <CompanyMark brand={preview.brand} company={preview.company} />
              <div>
                <p>Tin minh họa</p>
                <h2 id="career-preview-title">{preview.title}</h2>
                <span>{preview.company}</span>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết việc làm"
                onClick={() => dialog.current?.close()}
              >
                <CareerIcon name="close" />
              </button>
            </header>
            <p className="career-preview-copy">{preview.description}</p>
            <div className="career-preview-actions">
              <button
                className="button button-outline"
                type="button"
                onClick={() => toggleSaved(preview)}
              >
                {saved.includes(preview.id)
                  ? "Bỏ lưu việc làm"
                  : "Lưu việc làm"}
              </button>
              <Link
                className="button button-primary"
                href={accountId ? "/career?tab=recruit" : "/account"}
              >
                {accountId
                  ? "Đăng tin tuyển dụng thật"
                  : "Đăng nhập để sử dụng Career Hub"}
              </Link>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
