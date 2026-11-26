const errors: Record<string, string> = {
  invalid_profile_avatar:
    "Ảnh đại diện chưa hợp lệ. Chọn ảnh JPG, PNG hoặc WebP khác.",
  backend_unavailable:
    "Dịch vụ đang tạm thời không khả dụng. Vui lòng thử lại sau.",
  internal_error: "Máy chủ gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.",
  authentication_required: "Phiên đã hết hoặc bạn chưa đăng nhập.",
  forbidden: "Tài khoản này không có quyền thực hiện thao tác.",
  already_registered: "Tài khoản của bạn đã đăng ký sự kiện này.",
  registration_closed: "Sự kiện đã đóng đăng ký.",
  registration_deadline_passed: "Đã hết hạn đăng ký sự kiện.",
  event_full: "Sự kiện không còn đủ chỗ cho nhóm của bạn.",
  capacity_below_registrations: "Sức chứa mới thấp hơn số người đã đăng ký.",
  invalid_guests: "Nhập số nguyên không âm cho số người đi cùng.",
  invalid_guest_limit:
    "Giới hạn người đi cùng phải là số nguyên từ 0 đến sức chứa trừ 1.",
  guest_limit_exceeded: "Số người đi cùng vượt giới hạn của sự kiện.",
  reregistration_self_only:
    "Sau khi hủy, bạn chỉ có thể đăng ký lại cho bản thân.",
  cancellation_deadline_passed: "Đã hết hạn hủy đăng ký sự kiện.",
  registration_not_found:
    "Lượt đăng ký đã thay đổi. Tải lại trang để xem trạng thái mới nhất.",
  invalid_event: "Kiểm tra tiêu đề, địa điểm, thời gian và sức chứa.",
  invalid_slug: "Mã sự kiện chỉ gồm chữ thường, số và dấu gạch nối.",
  slug_taken: "Mã sự kiện đã tồn tại.",
  login_rate_limited:
    "Có quá nhiều lượt đăng nhập. Vui lòng thử lại sau một phút.",
  invalid_credentials: "Tên tài khoản hoặc mật khẩu chưa đúng.",
  invalid_community_fields: "Kiểm tra các trường bắt buộc và giới hạn ký tự.",
  invalid_evidence: "Nhập liên kết minh chứng HTTPS hợp lệ.",
  invalid_nominee: "Nhập mã Alumni của một cựu sinh viên khác đã được cấp thẻ.",
  active_role_request: "Vai trò này đang chờ duyệt hoặc còn hiệu lực.",
  community_transition:
    "Yêu cầu đã đổi trạng thái. Tải lại trang để xem tình trạng mới nhất.",
  invalid_career_fields: "Kiểm tra dữ liệu bắt buộc và định dạng đã nhập.",
  already_applied: "Bạn đã nộp hồ sơ cho tin này.",
  own_job: "Bạn không thể ứng tuyển vào tin tuyển dụng của mình.",
  job_closed: "Tin này đã đóng nhận ứng tuyển.",
  cv_not_found: "Không tìm thấy CV thuộc kho của bạn.",
  invalid_application: "Kiểm tra các trường bắt buộc và định dạng thông tin.",
  invalid_article: "Nhập tiêu đề và nội dung hợp lệ cho bản tin.",
  application_exists:
    "Email hoặc mã định danh đã được sử dụng trong một hồ sơ.",
  graduation_verification_required: "Cần xác nhận đã đối chiếu tốt nghiệp.",
};

export async function mutate(
  path: string,
  method: string,
  body: Record<string, unknown> = {},
) {
  try {
    const result = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await result.json();
    if (result.ok) return null;
    return (
      errors[payload.error] ?? "Thao tác chưa thành công. Vui lòng thử lại."
    );
  } catch {
    return "Không kết nối được với máy chủ. Vui lòng thử lại.";
  }
}
