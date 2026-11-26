import { topicNames } from "../../../lib/community";
import { Submission } from "../../components/submission";

export function PostForm() {
  return (
    <Submission
      path="/api/community/posts"
      success="Đã gửi bài, chờ Admin kiểm duyệt."
    >
      <label>
        Chủ đề{" "}
        <select name="topic">
          {Object.entries(topicNames).map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nội dung <textarea name="body" maxLength={2000} required />
      </label>
      <button className="button button-primary" type="submit">
        Gửi bài
      </button>
    </Submission>
  );
}

export function RoleForm({
  requestedRole,
}: {
  requestedRole: "engagement" | "ambassador";
}) {
  return (
    <Submission
      path="/api/community/roles"
      success="Đã gửi hồ sơ, chờ Admin xét duyệt."
    >
      <input name="role" type="hidden" value={requestedRole} />
      {requestedRole === "ambassador" && (
        <label>
          Mã Alumni của người được đề cử
          <input
            name="targetCode"
            placeholder="ALN ddmmyy 000001"
            maxLength={32}
            required
          />
        </label>
      )}
      <label>
        Lý do <textarea name="reason" maxLength={2000} required />
      </label>
      <label>
        Liên kết minh chứng (HTTPS){" "}
        <input
          name="evidence"
          type="url"
          placeholder="https://"
          maxLength={1000}
          required
        />
      </label>
      <button className="button button-primary" type="submit">
        {requestedRole === "ambassador" ? "Gửi đề cử" : "Gửi đề nghị"}
      </button>
    </Submission>
  );
}

export function CollaborationForm() {
  return (
    <Submission
      path="/api/community/collaborations"
      success="Đã gửi đề xuất. Trạng thái: Chờ tiếp nhận."
    >
      <label>
        Nhu cầu hợp tác hoặc đặt hàng{" "}
        <textarea name="need" maxLength={3000} required />
      </label>
      <label>
        Email liên hệ{" "}
        <input name="email" type="email" maxLength={254} required />
      </label>
      <label>
        Khoa hoặc trường mong muốn (tùy chọn){" "}
        <input name="unit" maxLength={160} />
      </label>
      <button className="button button-primary" type="submit">
        Gửi đề xuất
      </button>
    </Submission>
  );
}
