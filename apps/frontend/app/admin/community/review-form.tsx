import { Submission } from "../../components/submission";

export function ReviewForm({
  section,
  id,
  status,
}: {
  section: "roles" | "posts" | "collaborations";
  id: string;
  status: string;
}) {
  if (section === "roles" && status !== "pending" && status !== "approved")
    return null;
  if (section === "collaborations" && status === "closed") return null;
  const actions =
    section === "roles"
      ? status === "pending"
        ? [
            ["approve", "Duyệt"],
            ["reject", "Từ chối"],
          ]
        : [["end", "Kết thúc vai trò"]]
      : section === "posts"
        ? status === "visible"
          ? [["hide", "Ẩn bài"]]
          : [
              ["show", status === "pending" ? "Duyệt và hiển thị" : "Hiện lại"],
              ...(status === "pending" ? [["hide", "Ẩn bài"]] : []),
            ]
        : status === "pending"
          ? [["forward", "Ghi nhận chuyển xử lý"]]
          : [["close", "Kết thúc xử lý"]];
  return (
    <Submission
      path={`/api/admin/community/${section}/${id}`}
      method="PATCH"
      success="Đã cập nhật trạng thái."
    >
      {section === "collaborations" && status === "pending" && (
        <label>
          Khoa hoặc trường tiếp nhận{" "}
          <input name="unit" maxLength={160} required />
        </label>
      )}
      {section !== "posts" && (
        <label>
          Ghi chú cho người gửi (tùy chọn){" "}
          <textarea name="note" maxLength={1500} />
        </label>
      )}
      <div className="form-actions">
        {actions.map(([value, label]) => (
          <button
            key={value}
            name="action"
            value={value}
            className="button button-outline"
            type="submit"
          >
            {label}
          </button>
        ))}
      </div>
    </Submission>
  );
}
