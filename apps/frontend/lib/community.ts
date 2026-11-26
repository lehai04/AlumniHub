export const communityTabs = [
  ["posts", "Bảng tin cộng đồng"],
  ["roles", "Gắn kết và Đại sứ"],
  ["collaborations", "Hợp tác với khoa, trường"],
] as const;

export const roleNames = { ambassador: "Đại sứ", engagement: "Gắn kết" };
export const topicNames = {
  intro: "Giới thiệu và kết nối",
  career: "Cơ hội nghề nghiệp",
};
export const communityStatus: Record<string, string> = {
  pending: "Chờ xử lý",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  visible: "Đang hiển thị",
  hidden: "Đã ẩn",
  forwarded: "Đã chuyển",
  closed: "Đã kết thúc",
};

type Item = { id: string; status: string; created_at: string };
export type RoleRequest = Item & {
  role: keyof typeof roleNames;
  reason: string;
  evidence_url: string;
  target_name: string;
  target_code: string;
  requester_name: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision_note: string | null;
  ended_at: string | null;
  ended_by: string | null;
  end_note: string | null;
};
export type CommunityPost = Item & {
  body: string;
  topic: keyof typeof topicNames;
  author_name: string;
};
export type Collaboration = Item & {
  need: string;
  contact_email: string;
  requested_unit: string;
  assigned_unit: string | null;
  handling_note: string | null;
  sender_name: string;
};
