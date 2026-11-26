"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { mutate } from "../../../lib/mutations";
import { type Article, covers } from "../../../lib/news";

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const path = article ? `/api/admin/news/${article.slug}` : "/api/admin/news";
  const published = Boolean(article?.published_at && !article.withdrawn_at);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = Object.fromEntries(new FormData(form));
    setPending(true);
    const failure = await mutate(path, "POST", {
      ...input,
      cover: input.cover || null,
    });
    setPending(false);
    setMessage(failure ?? "Đã lưu tin.");
    if (!failure) {
      form.reset();
      router.refresh();
    }
  }

  async function changeVisibility() {
    if (
      published &&
      !window.confirm(
        "Gỡ tin khỏi trang công khai? Tin vẫn còn trong quản trị.",
      )
    )
      return;
    setPending(true);
    const failure = await mutate(`${path}/withdraw`, "POST");
    setPending(false);
    setMessage(failure ?? "Đã gỡ tin.");
    if (!failure) router.refresh();
  }

  if (article) {
    return published ? (
      <div className="form-actions">
        <button
          type="button"
          className="button button-outline"
          onClick={changeVisibility}
          disabled={pending}
        >
          Gỡ công bố
        </button>
        <output aria-live="polite">{message}</output>
      </div>
    ) : null;
  }

  return (
    <form className="event-form" onSubmit={save}>
      <label>
        Mã đường dẫn
        <input
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          maxLength={80}
          placeholder="hoat-dong-alumni"
          required
        />
      </label>
      <label>
        Tiêu đề <input name="title" maxLength={160} required />
      </label>
      <label>
        Tóm tắt <textarea name="summary" maxLength={280} />
      </label>
      <label>
        Nội dung <textarea name="body" rows={8} maxLength={6500} required />
      </label>
      <label>
        Ảnh đại diện
        <select name="cover" defaultValue="">
          <option value="">Không dùng ảnh</option>
          {Object.entries(covers).map(([key, cover]) => (
            <option key={key} value={key}>
              {cover.label}
            </option>
          ))}
        </select>
      </label>
      <div className="form-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={pending}
        >
          Tạo bản nháp
        </button>
      </div>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
