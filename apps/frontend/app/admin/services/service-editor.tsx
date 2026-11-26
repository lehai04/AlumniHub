"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { type ServiceContent, serviceLabels } from "../../../lib/services";

const statuses = {
  draft: "Bản nháp",
  submitted: "Chờ Trường duyệt",
  published: "Đã công bố",
  withdrawn: "Đã gỡ",
};
const actionLabels = {
  submit: "Gửi Trường duyệt",
  return: "Trả về bản nháp",
  publish: "Duyệt và công bố",
  withdraw: "Gỡ nội dung",
};
type Action = keyof typeof actionLabels;

function vietnamTime(value?: string | null) {
  return value
    ? new Date(Date.parse(value) + 7 * 3600_000).toISOString().slice(0, 16)
    : "";
}

export function ServiceEditor({
  entry,
  role,
}: {
  entry?: ServiceContent;
  role: "admin" | "reviewer";
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const editable = role === "admin" && entry?.status !== "published";
  const actions: Action[] = [];
  if (role === "admin" && entry?.status === "draft") actions.push("submit");
  if (role === "reviewer" && entry?.status === "submitted")
    actions.push("return", "publish");
  if (role === "reviewer" && entry?.status === "published")
    actions.push("withdraw");
  const path = entry
    ? `/api/admin/services/${entry.id}`
    : "/api/admin/services";

  async function send(method: string, data: unknown, action?: Action) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(action ? `${path}/${action}` : path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        setMessage(
          response.status === 409
            ? "Nội dung đã thay đổi. Hãy tải lại trang."
            : "Không lưu được. Kiểm tra dữ liệu và thời gian hiệu lực.",
        );
        return false;
      }
      setMessage("Đã cập nhật.");
      router.refresh();
      return true;
    } catch {
      setMessage("Không kết nối được. Vui lòng thử lại.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const saved = await send(entry ? "PATCH" : "POST", {
      revision: entry?.revision,
      category: fields.get("category"),
      title: fields.get("title"),
      body: fields.get("body"),
      startsAt: `${fields.get("startsAt")}:00+07:00`,
      endsAt: fields.get("endsAt") ? `${fields.get("endsAt")}:00+07:00` : null,
    });
    if (saved && !entry) form.reset();
  }

  return (
    <section className="info-card">
      <h2>{entry?.title ?? "Thêm bản nháp"}</h2>
      {entry && (
        <p>
          {serviceLabels[entry.category]} · {statuses[entry.status]}
        </p>
      )}
      {editable ? (
        <form className="event-form" onSubmit={save}>
          <label>
            Nhóm
            <select name="category" defaultValue={entry?.category}>
              <option value="benefits">Ưu đãi Alumni</option>
              <option value="library">Thư viện</option>
            </select>
          </label>
          <label>
            Tiêu đề
            <input
              name="title"
              maxLength={160}
              required
              defaultValue={entry?.title}
            />
          </label>
          <label>
            Nội dung
            <textarea
              name="body"
              maxLength={6500}
              required
              defaultValue={entry?.body}
            />
          </label>
          <label>
            Bắt đầu (giờ Việt Nam)
            <input
              type="datetime-local"
              name="startsAt"
              required
              defaultValue={vietnamTime(entry?.starts_at)}
            />
          </label>
          <label>
            Kết thúc (giờ Việt Nam)
            <input
              type="datetime-local"
              name="endsAt"
              defaultValue={vietnamTime(entry?.ends_at)}
            />
          </label>
          <button type="submit" className="button" disabled={pending}>
            Lưu bản nháp
          </button>
        </form>
      ) : (
        entry && (
          <>
            <p style={{ whiteSpace: "pre-wrap" }}>{entry.body}</p>
            <p>
              Hiệu lực (giờ Việt Nam){" "}
              {vietnamTime(entry.starts_at).replace("T", " ")} đến{" "}
              {entry.ends_at
                ? vietnamTime(entry.ends_at).replace("T", " ")
                : "khi gỡ"}
            </p>
          </>
        )
      )}
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          className="button"
          disabled={pending}
          onClick={() =>
            void send("POST", { revision: entry?.revision }, action)
          }
        >
          {actionLabels[action]}
        </button>
      ))}
      <output aria-live="polite">{message}</output>
    </section>
  );
}

export function Mailbox() {
  const [message, setMessage] = useState("");
  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch("/api/local/mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: new FormData(event.currentTarget).get("email"),
        }),
      });
      setMessage(
        response.ok
          ? `Mã xác thực: ${(await response.json()).code}`
          : "Chưa có mã còn hiệu lực.",
      );
    } catch {
      setMessage("Không kết nối được hộp thư local.");
    }
  }
  return (
    <section className="info-card">
      <h2>Hộp thư giả lập local</h2>
      <form className="event-form" onSubmit={lookup}>
        <label>
          Email thử nghiệm
          <input type="email" name="email" required maxLength={254} />
        </label>
        <button type="submit" className="button">
          Xem email gần nhất
        </button>
        <output aria-live="polite">{message}</output>
      </form>
    </section>
  );
}
