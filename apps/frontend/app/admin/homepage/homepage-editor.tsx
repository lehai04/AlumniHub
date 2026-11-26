"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import {
  careerSlots,
  type Homepage,
  type HomepageImage,
  homepageFields,
  homepageImageDefaults,
} from "../../../lib/homepage";

const images = [
  ["hero", "Ảnh đầu trang", homepageImageDefaults.hero, "images/hero"],
  ["event", "Ảnh mục sự kiện", homepageImageDefaults.event, "images/event"],
  ...careerSlots.map(
    (slot, index) =>
      [
        slot,
        `Ảnh cơ hội nghề nghiệp ${index + 1}`,
        homepageImageDefaults[slot],
        `images/${slot}`,
      ] as const,
  ),
] as const;

type EditorImage = readonly [HomepageImage, string, string | null, string];

export function HomepageEditor({
  initial,
  endpoint = "/api/admin/homepage",
  publicPath = "/",
  fields = homepageFields,
  images: editableImages = images,
}: {
  initial: Homepage;
  endpoint?: string;
  publicPath?: string;
  fields?: Record<string, readonly [string, string, number?]>;
  images?: readonly EditorImage[];
}) {
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function update(
    path: string,
    method: string,
    type?: string,
    body?: BodyInit,
  ): Promise<Homepage> {
    const response = await fetch(path, {
      method,
      headers: type ? { "content-type": type } : undefined,
      body,
    });
    if (!response.ok) {
      if (response.status === 409)
        throw new Error(
          "Bản nháp vừa thay đổi. Tải lại trang trước khi chỉnh tiếp.",
        );
      if (response.status === 413 || response.status === 415)
        throw new Error("Chọn ảnh JPG, PNG hoặc WebP tối đa 2 MB.");
      if (
        response.status === 400 &&
        (await response.json()).error === "invalid_page_link"
      )
        throw new Error(
          "Nhập cả chữ hiển thị và địa chỉ link hợp lệ, hoặc để trống cả hai.",
        );
      throw new Error("Không lưu được. Kiểm tra dữ liệu và quyền đăng nhập.");
    }
    const updated: Homepage = await response.json();
    setDraft(updated);
    return updated;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const content = Object.fromEntries(
      Object.keys(fields).map((key) => [key, data.get(key)]),
    );
    setPending(true);
    setMessage("");
    try {
      let latest = await update(
        endpoint,
        "PATCH",
        "application/json",
        JSON.stringify({ content, revision: draft.revision }),
      );
      for (const [slot, , , route] of editableImages) {
        const file = data.get(slot);
        if (file instanceof File && file.size > 0) {
          latest = await update(
            `${endpoint}/${route}?revision=${latest.revision}`,
            "PUT",
            file.type,
            file,
          );
          const input = form.elements.namedItem(slot);
          if (input instanceof HTMLInputElement) input.value = "";
        }
      }
      setDirty(false);
      setMessage("Đã lưu bản nháp.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Thao tác chưa thành công.",
      );
    } finally {
      setPending(false);
    }
  }

  async function removeImage(route: string) {
    setPending(true);
    setMessage("");
    try {
      await update(`${endpoint}/${route}?revision=${draft.revision}`, "DELETE");
      setMessage("Đã gỡ ảnh khỏi bản nháp. Công bố để cập nhật website.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa gỡ được ảnh.");
    } finally {
      setPending(false);
    }
  }

  async function publish() {
    setPending(true);
    setMessage("");
    try {
      await update(
        `${endpoint}/publish`,
        "POST",
        "application/json",
        JSON.stringify({ revision: draft.revision }),
      );
      setMessage("Đã công bố. Mở trang công khai để xem nội dung mới.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Công bố chưa thành công.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="event-form"
      onSubmit={save}
      onChange={() => setDirty(true)}
    >
      <fieldset disabled={pending} className="event-form">
        <legend>Nội dung</legend>
        {Object.entries(fields).map(([key, [label, fallback, limit]]) => (
          <label key={key}>
            {label}
            <textarea
              name={key}
              defaultValue={draft.content[key] ?? fallback}
              maxLength={limit ?? 500}
              rows={key === "body" ? 10 : 2}
            />
          </label>
        ))}
      </fieldset>
      <fieldset disabled={pending} className="event-form">
        <legend>Hình ảnh</legend>
        {editableImages.map(([slot, label, fallback, route]) => (
          <div key={slot}>
            {(draft[slot] || fallback) && (
              <Image
                src={
                  draft[slot]
                    ? `${endpoint}/${route}?r=${draft.revision}`
                    : (fallback ?? "")
                }
                alt={`Xem trước ${label}`}
                width={320}
                height={180}
                unoptimized
              />
            )}
            <label>
              {label} (JPG, PNG, WebP tối đa 2 MB)
              <input
                type="file"
                name={slot}
                accept="image/jpeg,image/png,image/webp"
              />
            </label>
            {draft[slot] && (
              <button
                type="button"
                className="button"
                onClick={() => void removeImage(route)}
              >
                Gỡ ảnh khỏi bản nháp
              </button>
            )}
          </div>
        ))}
      </fieldset>
      <div className="form-actions">
        <button type="submit" className="button" disabled={pending || !dirty}>
          Lưu bản nháp
        </button>
        <Link href={publicPath}>Xem trang công khai</Link>
        <button
          type="button"
          className="button button-primary"
          disabled={pending || dirty}
          onClick={() => void publish()}
        >
          Công bố
        </button>
      </div>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
