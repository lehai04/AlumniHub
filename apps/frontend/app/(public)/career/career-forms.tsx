"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  type Cv,
  type Job,
  type Profile,
  workModes,
} from "../../../lib/career";
import {
  type ProfileSection,
  profileTextFields,
} from "../../../lib/career-profile";
import { mutate } from "../../../lib/mutations";

const profileFields = [
  ["fullName", "Họ tên", "text", 120],
  ["specialty", "Chuyên ngành", "text", 120],
  ["cohort", "Khóa", "text", 30],
  ["birthDate", "Ngày sinh", "date", 10],
  ["phone", "Số điện thoại", "tel", 15],
  ["email", "Email", "email", 254],
  ["jobTitle", "Vị trí công việc", "text", 120],
  ["location", "Địa chỉ / Tỉnh thành", "text", 160],
  ["linkedin", "LinkedIn (HTTPS)", "url", 300],
] as const;

function useSubmission() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(
    request: () => Promise<string | null>,
    success: string,
    after?: () => void,
  ) {
    setBusy(true);
    const failure = await request();
    setMessage(failure ?? success);
    setBusy(false);
    if (!failure) {
      after?.();
      router.refresh();
    }
  }
  return { message, busy, run };
}

export function ProfileForm({
  profile,
  looking,
  section = "all",
  onSaved,
  onPreviewSave,
}: Profile & {
  section?: ProfileSection;
  onSaved?: () => void;
  onPreviewSave?: (value: Profile) => void;
}) {
  const { busy, message, run } = useSubmission();
  const showLooking = section === "all" || section === "preferences";
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = { ...profile, ...Object.fromEntries(data) } as Record<
      string,
      string
    >;
    const nextLooking = showLooking ? data.has("looking") : looking;
    if (onPreviewSave) {
      onPreviewSave({ profile: values, looking: nextLooking });
      onSaved?.();
      return;
    }
    void run(
      () =>
        mutate("/api/career/profile", "PATCH", {
          ...values,
          looking: nextLooking,
        }),
      "Đã lưu hồ sơ nghề nghiệp.",
      onSaved,
    );
  }
  return (
    <form className="event-form" onSubmit={save}>
      {(section === "all" || section === "general") &&
        profileFields.map(([name, label, type, max]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              type={type}
              defaultValue={profile[name]}
              maxLength={max}
              required={
                name === "fullName" || name === "email" || name === "phone"
              }
              pattern={name === "phone" ? "[0-9]{9,15}" : undefined}
            />
          </label>
        ))}
      {profileTextFields
        .filter(([name]) => section === "all" || section === name)
        .map(([name, label, max]) => (
          <label key={name}>
            {label}
            <textarea
              name={name}
              defaultValue={profile[name] ?? ""}
              maxLength={max}
              rows={5}
            />
          </label>
        ))}
      {showLooking && (
        <>
          <label className="career-check">
            <input name="looking" type="checkbox" defaultChecked={looking} />{" "}
            Đang tìm việc
          </label>
          <p>
            Khi bật, người có tin đang tuyển xem được họ tên, chuyên ngành,
            khóa, giới thiệu, kinh nghiệm và chứng chỉ.
          </p>
        </>
      )}
      <button className="button button-primary" disabled={busy} type="submit">
        {onPreviewSave ? "Lưu bản xem trước" : "Lưu hồ sơ"}
      </button>
      <output aria-live="polite">{message}</output>
    </form>
  );
}

async function uploadPdf(path: string, method: "POST" | "PUT", data: FormData) {
  const file = data.get("file");
  const name = String(data.get("name") ?? "").trim();
  if (!(file instanceof File) || !file.size || !name)
    return "Chọn tệp PDF và nhập tên CV.";
  if (file.size > 5 * 1024 * 1024) return "CV vượt quá 5 MB.";
  try {
    const response = await fetch(path, {
      method,
      body: file,
      headers: {
        "Content-Type": "application/pdf",
        "X-CV-Name": encodeURIComponent(name),
      },
    });
    if (response.ok) return null;
    const { error } = await response.json();
    if (error === "cv_limit") return "Kho CV đã có đủ 5 tệp.";
    if (error === "pdf_required") return "Chọn tệp PDF hợp lệ.";
    return "Không lưu được CV. Vui lòng thử lại.";
  } catch {
    return "Không kết nối được với máy chủ.";
  }
}

export function CvForm({ cv, full = false }: { cv?: Cv; full?: boolean }) {
  const { busy, message, run } = useSubmission();
  const path = cv ? `/api/career/cvs/${cv.id}` : "/api/career/cvs";
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    const replace = file instanceof File && file.size > 0;
    void run(
      () =>
        cv && !replace
          ? mutate(path, "PATCH", { name: data.get("name") })
          : uploadPdf(path, cv ? "PUT" : "POST", data),
      "Đã lưu CV.",
      cv ? undefined : () => form.reset(),
    );
  }
  return (
    <form className="event-form" onSubmit={save}>
      <label>
        Tên CV{" "}
        <input name="name" defaultValue={cv?.name} maxLength={120} required />
      </label>
      <label>
        {cv ? "Thay tệp PDF (tùy chọn)" : "Tệp PDF"}{" "}
        <input
          type="file"
          name="file"
          accept=".pdf,application/pdf"
          required={!cv}
        />
      </label>
      <div className="form-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={busy || full}
        >
          {cv ? "Lưu thay đổi CV" : "Tải CV lên"}
        </button>
        {cv && (
          <button
            className="button button-outline"
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm("Xóa CV khỏi kho? Các bản đã nộp vẫn được giữ.")
              )
                void run(() => mutate(path, "DELETE"), "Đã xóa CV.");
            }}
          >
            Xóa CV
          </button>
        )}
      </div>
      <output aria-live="polite">{message}</output>
    </form>
  );
}

export function JobForm({ job }: { job?: Job }) {
  const { busy, message, run } = useSubmission();
  const path = job ? `/api/career/own-jobs/${job.id}` : "/api/career/own-jobs";
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    void run(
      () => mutate(path, job ? "PATCH" : "POST", data),
      "Đã lưu tin tuyển dụng.",
      job ? undefined : () => form.reset(),
    );
  }
  return (
    <form className="event-form" onSubmit={save}>
      <label>
        Vị trí tuyển dụng{" "}
        <input
          name="title"
          defaultValue={job?.title}
          required
          maxLength={160}
        />
      </label>
      <label>
        Công ty{" "}
        <input
          name="company"
          defaultValue={job?.company}
          required
          maxLength={160}
        />
      </label>
      <label>
        Địa điểm{" "}
        <input
          name="location"
          defaultValue={job?.location}
          required
          maxLength={160}
        />
      </label>
      <label>
        Hình thức{" "}
        <select name="mode" defaultValue={job?.mode ?? "onsite"}>
          {Object.entries(workModes).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mô tả và yêu cầu{" "}
        <textarea
          name="description"
          defaultValue={job?.description}
          required
          maxLength={6000}
        />
      </label>
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={busy}>
          {job ? "Lưu chỉnh sửa" : "Tạo bản nháp"}
        </button>
        {job && !job.published_at && (
          <button
            className="button button-outline"
            type="button"
            disabled={busy}
            onClick={() =>
              run(() => mutate(`${path}/publish`, "POST"), "Đã công bố tin.")
            }
          >
            Công bố tin
          </button>
        )}
        {job?.published_at && !job.closed_at && (
          <button
            className="button button-outline"
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Đóng nhận ứng tuyển cho tin này?"))
                void run(
                  () => mutate(`${path}/close`, "POST"),
                  "Đã đóng nhận ứng tuyển.",
                );
            }}
          >
            Đóng nhận ứng tuyển
          </button>
        )}
      </div>
      <output aria-live="polite">{message}</output>
    </form>
  );
}

export function ApplyForm({ id, cvs }: { id: string; cvs: Cv[] }) {
  const { busy, message, run } = useSubmission();
  return (
    <form
      className="event-form"
      onSubmit={(event) => {
        event.preventDefault();
        const cvId = new FormData(event.currentTarget).get("cvId");
        void run(
          () => mutate(`/api/career/jobs/${id}/apply`, "POST", { cvId }),
          "Đã nộp hồ sơ ứng tuyển.",
        );
      }}
    >
      <label>
        CV dùng để ứng tuyển{" "}
        <select name="cvId" required>
          <option value="">Chọn CV</option>
          {cvs.map((cv) => (
            <option key={cv.id} value={cv.id}>
              {cv.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        Chủ tin sẽ xem được bản CV này và phần thông tin nghề nghiệp tại thời
        điểm nộp.
      </p>
      <button className="button button-primary" type="submit" disabled={busy}>
        Nộp hồ sơ
      </button>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
