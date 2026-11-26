# Giao diện Việc làm

Mở `/career` để xem thiết kế theo ảnh mẫu: banner khuôn viên, tìm kiếm, bốn tiện ích, việc làm nổi bật, ngành nghề và doanh nghiệp. Có bố cục ba cột trên máy tính, hai cột trên tablet và một cột trên điện thoại. Các nút hỗ trợ hover, bàn phím và giảm chuyển động theo cài đặt thiết bị.

## Chức năng

- Tìm theo tên vị trí/công ty, hỗ trợ tiếng Việt không dấu; lọc địa điểm, hình thức, thực tập, bán thời gian và ngành nghề. Có nút xóa bộ lọc, trạng thái rỗng và xem thêm từng sáu tin.
- Lưu/bỏ lưu tin bằng biểu tượng đánh dấu. Danh sách giữ trên trình duyệt này, tách theo ID tài khoản hoặc khách; chưa đồng bộ giữa nhiều thiết bị. Không lưu hồ sơ cá nhân hay CV vào localStorage.
- Tin thật được lấy qua API hiện có khi tài khoản đã được cấp thẻ. Chi tiết và ứng tuyển tiếp tục dùng `/career/jobs/[id]`; hồ sơ, kho CV, tuyển dụng và lịch sử giữ nguyên chức năng và quyền truy cập.
- Khách và tài khoản chưa có tin để hiển thị được xem chín tin minh họa. Bấm tiêu đề mở hộp thoại chi tiết, Escape hoặc nút đóng sẽ đóng hộp thoại. Tin mẫu không tạo lượt ứng tuyển và không được ghi vào database.
- Mục việc phù hợp tìm theo chuyên ngành trong hồ sơ. Nếu chưa có chuyên ngành, giao diện hướng dẫn cập nhật hồ sơ. Các tên doanh nghiệp đang minh họa, không xác nhận quan hệ đối tác.

## Chỉnh nội dung và hình ảnh

| Thành phần | Vị trí |
| --- | --- |
| Tiêu đề, mô tả, ảnh và liên kết banner | CMS `/admin/pages/career`, lưu nháp rồi công bố |
| Ảnh banner mặc định | `apps/frontend/public/assets/illustrations/career-campus.jpg` |
| Chín tin minh họa và danh sách ngành | `apps/frontend/lib/career-preview.ts` |
| Biểu tượng và cách hiển thị tên doanh nghiệp | `apps/frontend/app/(public)/career/career-icons.tsx` |
| Bố cục và tương tác trang tìm việc | `apps/frontend/app/(public)/career/career-landing.tsx` |
| Kiểu dáng và breakpoint | `apps/frontend/app/(public)/career/career.css` |

Ảnh khuôn viên lấy từ [website Văn Lang](https://www.vlu.edu.vn/news/thong-bao-tuyen-sinh-lien-thong-trinh-do-cao-dang-len-dai-hoc-nam-2025-1). Logo VLU dùng cùng tệp logo đã thống nhất toàn website. Tên các doanh nghiệp khác được trình bày bằng chữ và màu để minh họa; có thể thay bằng tài sản nhận diện được cung cấp sau.

Thay đổi này không thêm dependency, không sửa migration và không ghi đè dữ liệu tuyển dụng. Bản sao trang và CSS trước khi sửa nằm trong `artifacts/career-design/before/`. Chạy `npm.cmd run check` để kiểm tra tự động trên database tạm.

## Đã kiểm tra

Ngày 26/11/2026: `npm.cmd run check` đạt lint, typecheck, 8 test backend, build, audit và 13 nhóm smoke test (gồm Career Hub và CMS trang Việc làm). Trên trình duyệt đã thử lưu/bỏ lưu và giữ sau khi tải lại, mở/đóng chi tiết, lọc thực tập, tìm `ke toan` không dấu trả đúng hai tin mẫu, xem thêm từ 6 lên 9 tin. Đã đối chiếu bố cục máy tính và điện thoại 390 px; trang không tràn ngang. Log nằm ở `artifacts/career-design/check.log`.
