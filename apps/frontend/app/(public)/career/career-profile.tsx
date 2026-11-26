"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Cv, Profile } from "../../../lib/career";
import {
  type ProfileSection,
  profileSections,
  profileTextFields,
} from "../../../lib/career-profile";
import { mutate } from "../../../lib/mutations";
import { CvForm, ProfileForm } from "./career-forms";
import { CareerIcon } from "./career-icons";
import "./career-profile.css";

type Editor = ProfileSection | "cvs";
const basicFields = [
  ["birthDate", "Ngày sinh", "calendar"],
  ["phone", "Số điện thoại", "phone"],
  ["email", "Email", "mail"],
  ["location", "Địa chỉ", "pin"],
  ["linkedin", "LinkedIn", "link"],
  ["cohort", "Khóa", "cap"],
] as const;

export function CareerProfile({
  data,
  cvs,
  preview = false,
}: {
  data: Profile;
  cvs: Cv[];
  preview?: boolean;
}) {
  const router = useRouter();
  const [sample, setSample] = useState(data);
  const current = preview ? sample : data;
  const p = current.profile;
  const [tab, setTab] = useState<ProfileSection>("general");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [selectedId, setSelectedId] = useState(cvs[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const selected = cvs.find((cv) => cv.id === selectedId) ?? cvs[0];
  const completion = [
    ["Thông tin cá nhân", Boolean(p.fullName && p.email && p.phone), "general"],
    ["Kinh nghiệm làm việc", Boolean(p.experience?.trim()), "experience"],
    ["Học vấn", Boolean(p.education?.trim()), "education"],
    ["Kỹ năng", Boolean(p.skills?.trim()), "skills"],
    [
      "Dự án & Hoạt động",
      Boolean(p.projects?.trim() || p.activities?.trim()),
      "projects",
    ],
  ] as const;
  const percent = completion.filter(([, done]) => done).length * 20;
  const editorLabel =
    editor === "cvs"
      ? "Quản lý CV"
      : editor === "all"
        ? "Chỉnh sửa hồ sơ"
        : editor === "preferences"
          ? "Chế độ tìm việc"
          : (profileTextFields.find(([id]) => id === editor)?.[1] ??
            "Thông tin cơ bản");

  useEffect(() => {
    if (!editor) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editor]);

  async function updateAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (
      file.size > 2 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setMessage("Chọn ảnh JPG, PNG hoặc WebP tối đa 2 MB.");
      return;
    }
    setUploading(true);
    try {
      // Nén ảnh về 160 px để hồ sơ nhẹ; dữ liệu ảnh chỉ đọc qua phiên của chủ hồ sơ.
      const image = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 160;
      const context = canvas.getContext("2d");
      if (!context) {
        image.close();
        throw new Error();
      }
      const size = Math.min(image.width, image.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 160, 160);
      context.drawImage(
        image,
        (image.width - size) / 2,
        (image.height - size) / 2,
        size,
        size,
        0,
        0,
        160,
        160,
      );
      image.close();
      const avatar = canvas.toDataURL("image/jpeg", 0.8);
      if (avatar.length > 44000) throw new Error();
      if (preview) setSample({ ...current, profile: { ...p, avatar } });
      else {
        const failure = await mutate("/api/career/profile", "PATCH", {
          ...p,
          avatar,
          looking: current.looking,
        });
        if (failure) {
          setMessage(failure);
          return;
        }
        router.refresh();
      }
      setMessage(
        preview
          ? "Đã đổi ảnh trong bản xem trước; không ghi vào tài khoản."
          : "Đã cập nhật ảnh đại diện.",
      );
    } catch {
      setMessage("Không đọc được ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      setUploading(false);
    }
  }
  function saved() {
    dialog.current?.close();
    setMessage(
      preview
        ? "Đã cập nhật bản xem trước; dữ liệu mẫu không được lưu vào tài khoản."
        : "Đã lưu hồ sơ nghề nghiệp.",
    );
  }

  return (
    <div className="career-profile-page">
      <header className="profile-banner">
        <Image
          src="/assets/illustrations/career-campus.jpg"
          alt=""
          fill
          sizes="100vw"
          preload
          unoptimized
        />
        <div>
          <h1>Hồ sơ nghề nghiệp</h1>
          <p>
            Quản lý thông tin cá nhân, kinh nghiệm, kỹ năng và CV để ứng tuyển
            việc làm hiệu quả.
          </p>
        </div>
      </header>
      <div className="profile-workspace">
        <nav className="profile-sidebar" aria-label="Khu vực nghề nghiệp">
          <Link href="/career">
            <CareerIcon name="home" />
            Tổng quan
          </Link>
          <button
            type="button"
            aria-current={tab !== "preferences" ? "page" : undefined}
            onClick={() => setTab("general")}
          >
            <CareerIcon name="file" />
            Hồ sơ nghề nghiệp
          </button>
          <Link href="/career?saved=1">
            <CareerIcon name="bookmark" />
            Việc làm đã lưu
          </Link>
          <Link href="/career?tab=history">
            <CareerIcon name="send" />
            Việc làm đã ứng tuyển
          </Link>
          <button
            type="button"
            aria-current={tab === "preferences" ? "page" : undefined}
            onClick={() => setTab("preferences")}
          >
            <CareerIcon name="bell" />
            Chế độ tìm việc
          </button>
        </nav>
        <div className="profile-main">
          {preview && (
            <p className="profile-preview-note">
              Bạn đang xem hồ sơ minh họa.{" "}
              <Link href="/account">Đăng nhập</Link> để quản lý hồ sơ và CV của
              mình.
            </p>
          )}
          <section className="profile-summary" aria-label="Tóm tắt hồ sơ">
            <div className="profile-avatar">
              {p.avatar ? (
                <Image
                  src={p.avatar}
                  alt={`Ảnh đại diện của ${p.fullName}`}
                  width={144}
                  height={144}
                  unoptimized
                />
              ) : (
                <span role="img" aria-label="Chưa có ảnh đại diện">
                  {(p.fullName || "Alumni")
                    .trim()
                    .split(/\s+/)
                    .slice(-2)
                    .map((word) => word[0])
                    .join("")}
                </span>
              )}
              <button
                type="button"
                disabled={uploading}
                aria-label="Thay ảnh đại diện"
                onClick={() => avatarInput.current?.click()}
              >
                <CareerIcon name="camera" />
              </button>
              <input
                className="profile-hidden"
                ref={avatarInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Chọn ảnh đại diện"
                onChange={updateAvatar}
              />
            </div>
            <div className="profile-identity">
              <h2>{p.fullName || "Hồ sơ của tôi"}</h2>
              <p>
                {p.specialty
                  ? `Cựu sinh viên Khoa ${p.specialty}`
                  : "Cựu sinh viên Đại học Văn Lang"}
              </p>
              <div>
                <span>
                  <CareerIcon name="calendar" />
                  {p.jobTitle || "Chưa cập nhật công việc"}
                </span>
                <span>
                  <CareerIcon name="pin" />
                  {p.location || "Chưa cập nhật địa chỉ"}
                </span>
                <span>
                  <CareerIcon name="mail" />
                  {p.email || "Chưa cập nhật email"}
                </span>
              </div>
            </div>
            <div className="profile-summary-actions">
              {selected ? (
                <a
                  className="button button-outline"
                  href={`/api/career/cvs/${selected.id}?inline=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CareerIcon name="eye" />
                  Xem CV
                </a>
              ) : (
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => setEditor("cvs")}
                >
                  <CareerIcon name="eye" />
                  Xem CV
                </button>
              )}
              <button
                className="button button-primary"
                type="button"
                onClick={() => setEditor("all")}
              >
                <CareerIcon name="pen" />
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </section>
          <output className="profile-feedback" aria-live="polite">
            {uploading ? "Đang lưu ảnh đại diện…" : message}
          </output>
          <div className="profile-columns">
            <div className="profile-details">
              <nav className="profile-section-tabs" aria-label="Các mục hồ sơ">
                {profileSections.map(([id, label, icon]) => (
                  <button
                    type="button"
                    key={id}
                    aria-current={tab === id ? "page" : undefined}
                    onClick={() => setTab(id)}
                  >
                    <CareerIcon name={icon} />
                    {label}
                  </button>
                ))}
              </nav>
              {tab === "general" ? (
                <>
                  <section className="profile-panel">
                    <header>
                      <h3>
                        <CareerIcon name="user" />
                        Giới thiệu bản thân
                      </h3>
                      <button type="button" onClick={() => setEditor("intro")}>
                        <CareerIcon name="pen" />
                        Chỉnh sửa
                      </button>
                    </header>
                    <p className="profile-copy">
                      {p.intro ||
                        "Thêm một đoạn giới thiệu để nhà tuyển dụng hiểu hơn về bạn."}
                    </p>
                  </section>
                  <section className="profile-panel">
                    <header>
                      <h3>
                        <CareerIcon name="info" />
                        Thông tin cơ bản
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditor("general")}
                      >
                        <CareerIcon name="pen" />
                        Chỉnh sửa
                      </button>
                    </header>
                    <dl className="profile-basic-grid">
                      {basicFields.map(([key, label, icon]) => (
                        <div key={key}>
                          <dt>
                            <CareerIcon name={icon} />
                            {label}
                          </dt>
                          <dd>
                            {key === "linkedin" && p[key] ? (
                              <a
                                href={p[key]}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {p[key].replace(/^https:\/\/(www\.)?/, "")} ↗
                              </a>
                            ) : key === "birthDate" && p[key] ? (
                              p[key].split("-").reverse().join("/")
                            ) : (
                              p[key] || "Chưa cập nhật"
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </>
              ) : tab === "preferences" ? (
                <section className="profile-panel">
                  <header>
                    <h3>
                      <CareerIcon name="bell" />
                      Chế độ tìm việc
                    </h3>
                  </header>
                  <p className="profile-copy">
                    Bật tìm việc để người có tin đang tuyển xem hồ sơ nghề
                    nghiệp rút gọn. Thông tin liên hệ và CV vẫn được giữ riêng
                    tư.
                  </p>
                  <ProfileForm
                    {...current}
                    section="preferences"
                    onPreviewSave={preview ? setSample : undefined}
                  />
                </section>
              ) : (
                <section className="profile-panel">
                  <header>
                    <h3>
                      <CareerIcon
                        name={
                          profileSections.find(([id]) => id === tab)?.[2] ??
                          "file"
                        }
                      />
                      {profileSections.find(([id]) => id === tab)?.[1]}
                    </h3>
                    <button type="button" onClick={() => setEditor(tab)}>
                      <CareerIcon name="pen" />
                      Chỉnh sửa
                    </button>
                  </header>
                  <p className="profile-copy">
                    {p[tab] ||
                      "Chưa có nội dung. Chọn Chỉnh sửa để bổ sung mục này."}
                  </p>
                  {tab === "education" && (
                    <div className="profile-certificates">
                      <h4>Chứng chỉ</h4>
                      <p className="profile-copy">
                        {p.certificates || "Chưa cập nhật chứng chỉ."}
                      </p>
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={() => setEditor("all")}
                      >
                        Cập nhật chứng chỉ
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
            <aside
              className="profile-aside"
              aria-label="Hoàn thiện hồ sơ và CV"
            >
              <section className="profile-panel profile-completion">
                <h3>
                  <CareerIcon name="chart" />
                  Mức độ hoàn thiện hồ sơ
                </h3>
                <div className="profile-progress-content">
                  <div
                    className="profile-progress"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={
                      { "--profile-progress": `${percent}%` } as CSSProperties
                    }
                    aria-label={`Hồ sơ hoàn thiện ${percent}%`}
                  >
                    <strong>{percent}%</strong>
                  </div>
                  <ul>
                    {completion.map(([label, done, section]) => (
                      <li key={label}>
                        <button type="button" onClick={() => setTab(section)}>
                          <span data-done={done}>
                            {done && <CareerIcon name="check" />}
                          </span>
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="profile-progress-tip">
                  <CareerIcon name="info" />
                  {percent === 100
                    ? "Hồ sơ đã đầy đủ. Hãy cập nhật khi có kinh nghiệm hoặc kỹ năng mới."
                    : "Hoàn thiện 100% để nhà tuyển dụng hiểu rõ hơn về bạn."}
                </p>
              </section>
              <section className="profile-panel profile-cv">
                <h3>
                  <CareerIcon name="file" />
                  CV của bạn
                </h3>
                <p>Quản lý CV để ứng tuyển nhanh chóng</p>
                {selected ? (
                  <>
                    <label className="profile-cv-picker">
                      <CareerIcon name="file" />
                      <span className="profile-hidden">Chọn CV</span>
                      <select
                        aria-label="Chọn CV"
                        value={selected.id}
                        onChange={(event) => setSelectedId(event.target.value)}
                      >
                        {cvs.map((cv) => (
                          <option value={cv.id} key={cv.id}>
                            {cv.name}
                          </option>
                        ))}
                      </select>
                      <small>PDF · {cvs.length}/5 tệp</small>
                    </label>
                    <div className="profile-cv-actions">
                      <a
                        className="button button-outline"
                        href={`/api/career/cvs/${selected.id}`}
                        download
                      >
                        <CareerIcon name="download" />
                        Tải xuống
                      </a>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => setEditor("cvs")}
                      >
                        <CareerIcon name="upload" />
                        Cập nhật CV
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="profile-cv-empty">
                    <CareerIcon name="file" />
                    <p>Bạn chưa tải CV lên.</p>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => setEditor("cvs")}
                    >
                      <CareerIcon name="upload" />
                      Tải CV lên
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
      <dialog
        className="profile-editor-dialog"
        ref={dialog}
        aria-labelledby="profile-editor-title"
        onClose={() => setEditor(null)}
      >
        <header>
          <h2 id="profile-editor-title">{editorLabel}</h2>
          <button
            type="button"
            aria-label="Đóng chỉnh sửa hồ sơ"
            onClick={() => dialog.current?.close()}
          >
            <CareerIcon name="close" />
          </button>
        </header>
        {editor === "cvs" ? (
          preview ? (
            <div className="profile-preview-cv">
              <p>
                Đây là hồ sơ minh họa. Đăng nhập bằng tài khoản đã cấp thẻ để
                tải lên, xem và quản lý CV riêng tư.
              </p>
              <Link className="button button-primary" href="/account">
                Mở trang tài khoản
              </Link>
            </div>
          ) : (
            <>
              <p>
                Tối đa 5 tệp PDF, mỗi tệp 5 MB. Bản CV đã ứng tuyển vẫn được giữ
                nguyên.
              </p>
              {selected && (
                <div className="profile-cv-editor">
                  <h3>Chỉnh sửa CV đang chọn</h3>
                  <CvForm
                    key={`${selected.id}:${selected.name}`}
                    cv={selected}
                  />
                </div>
              )}
              <div className="profile-cv-editor">
                <h3>Thêm CV mới</h3>
                <CvForm full={cvs.length >= 5} />
              </div>
            </>
          )
        ) : (
          editor && (
            <ProfileForm
              key={editor}
              {...current}
              section={editor}
              onSaved={saved}
              onPreviewSave={preview ? setSample : undefined}
            />
          )
        )}
      </dialog>
    </div>
  );
}
