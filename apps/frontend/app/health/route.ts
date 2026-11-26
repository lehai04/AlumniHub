import { backendRequest } from "../../lib/backend";

export async function GET() {
  try {
    const response = await backendRequest("/health");
    if (response.ok) return Response.json(await response.json());
  } catch {
    // Chỉ báo trạng thái backend, không trả chi tiết lỗi kết nối cho trình duyệt.
  }
  return Response.json({ status: "unavailable" }, { status: 503 });
}
