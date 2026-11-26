# Kiểm tra chức năng ngày 26/11/2026

## Kết quả

Đã đạt lint, typecheck, 8 bài test backend, build cả hai workspace và 13 nhóm smoke test đầy đủ trên Next.js → API Node.js → PostgreSQL biệt lập. `npm audit` báo 0 lỗ hổng sau khi cập nhật dependency. Các máy chủ đang dùng ở cổng 8080, 8081 và 8082 vẫn hoạt động; các trang công khai và `/ready` được kiểm tra trả HTTP 200.

| Nhóm | Nội dung đã kiểm tra |
| --- | --- |
| Tài khoản và thẻ | Đăng ký MSSV/CCCD, chặn trùng, đăng nhập, phân quyền hồ sơ chờ duyệt, đối chiếu tốt nghiệp, cấp thẻ không trùng khi duyệt đồng thời. |
| Khôi phục mật khẩu local | Mã dùng một lần, hết hạn, giới hạn gửi/thử, hủy phiên cũ, không tiết lộ tài khoản qua email lạ. |
| Sự kiện | Nháp/sửa/công bố/đóng, sức chứa, người đi cùng, mốc đăng ký 12 giờ và hủy 24 giờ, chống trùng, hoàn chỗ, đăng ký lại, danh sách và xuất Excel. |
| Tin tức | Nháp, sửa, công bố, gỡ, công bố lại; quyền đọc nội dung chưa công bố. |
| CMS | Trang chủ, sáu trang công khai, từng bài tin/sự kiện; ảnh, link, bản nháp, bản công bố và tách quyền. |
| Career Hub | Hồ sơ nghề nghiệp, bật/tắt tìm việc, quyền tuyển dụng, đăng tin/đóng tin, CV riêng tư, đổi tên, bản chụp khi nộp và lịch sử ứng tuyển. |
| Cộng đồng | Đề nghị/đề cử vai trò, kiểm duyệt bài, đề xuất hợp tác và quyền truy cập riêng tư. |
| Ưu đãi và Thư viện | Soạn, gửi duyệt, trả lại, công bố, gỡ và ẩn khi hết hiệu lực. |
| SEO và điều hướng | Canonical, sitemap, robots, metadata, breadcrumb, noindex trang riêng và tách bố cục Admin. |

Đã thao tác thêm trên trình duyệt bằng dữ liệu giả trong database thử: đăng ký hai bước → đăng nhập → Admin duyệt → nhận thẻ; đăng ký sự kiện kèm một người, đối chiếu Admin hiện 1 lượt/2 người, hủy và hoàn đủ 2 chỗ. Trên khung điện thoại 390 × 844, đã kiểm tra đăng xuất, bố cục đăng nhập/đăng ký, chặn định dạng sai và quay lại bước trước vẫn giữ dữ liệu. Kiểm tra API và trang HTML trong smoke test không thay thế nghiệm thu mọi trình duyệt và thiết bị.

## Thay đổi trong đợt này

- Cập nhật đúng bản vá `fflate` từ 0.8.2 lên 0.8.3; giữ nguyên logic xuất Excel và kiểm tra lại file Unicode, số người, chống công thức. [Thông báo bản vá của GitHub](https://github.com/advisories/GHSA-px8p-9vwx-vf98).
- Thêm `npm run check` để chạy đầy đủ các bước trên PostgreSQL tạm, tự chọn cổng và tạo mật khẩu riêng. Migration và seed chạy hai lần. Lệnh tự dọn stack thử sau khi chạy xong hoặc khi có lỗi kiểm tra.
- Không thay đổi migration, giao diện hoặc quy tắc nghiệp vụ hiện có trong đợt này; không thay bằng mã mới toàn bộ các module đang chạy.

## Giữ dữ liệu hiện có

Đã ghi số lượng và mã băm của 18 bảng trước khi kiểm tra. Các thao tác ghi của bài thử chỉ chạy trên database tạm, không dùng `.env` đang vận hành. Trong lúc rà soát có một tài khoản mới phát sinh ở database đang dùng; tài khoản đó được giữ nguyên, không xóa để ép số lượng khớp bản chụp đầu. Các bảng còn lại giữ nguyên mã băm. Không seed lại, reset hoặc xóa dữ liệu đang dùng.

Log kiểm tra và bản sao package/lockfile trước khi vá nằm trong `artifacts/full-audit/` (thư mục local được bỏ qua khỏi Git).

## Phần cần tích hợp hoặc nội dung chính thức

Các luồng local nêu trên đã chạy được. Những phần sau chưa được xem là đã hoạt động với hệ thống thật:

- Gửi email khôi phục qua SMTP của Trường: hiện dùng hộp thư giả lập local. Cần thông số máy chủ, tài khoản gửi và nghiệm thu gửi/nhận thực tế.
- Tạo/gửi/xác thực vé QR: Alumni Hub xuất Excel; bộ phận tạo vé thực hiện bằng hệ thống ngoài theo quy trình đã có.
- VHub/SSO và mã vạch thư viện: hiện có liên kết, chưa có kết nối đăng nhập chung hoặc xác thực mã vạch.
- Thông báo từ chối hồ sơ, thời gian xét duyệt, nội dung pháp lý/liên hệ/hướng dẫn chính thức và một số quy tắc vai trò còn chờ quyết định như trong `VER01-AC-AUDIT.md`.

Không tự tạo thông số tích hợp hoặc công bố chính sách chưa được cung cấp. Đợt kiểm tra này không triển khai production.
