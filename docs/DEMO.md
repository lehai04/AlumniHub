# Xem đầy đủ demo Tin tức và Sự kiện

Sau khi chạy website bằng `npm.cmd run dev`, mở terminal khác tại `alumni-hub/`:

```powershell
npm.cmd run demo:seed
```

Với stack Compose dùng `npm.cmd run db:seed`. Hai lệnh dùng cùng seed và chỉ chạy khi `APP_ENV=dev`. Ảnh có sẵn trong dự án được đưa vào bản nháp và bản công bố của từng nội dung, nên vẫn sửa được qua CMS.

Bộ demo thêm **16 bài tin và 12 sự kiện**, bên cạnh hai mẫu cũ. Slug bắt đầu bằng `demo-news-` hoặc `demo-event-`, tiêu đề có `[Demo]`, nội dung ghi rõ là dữ liệu giả lập. Lệnh chạy lại không nhân bản, không ghi đè sửa đổi, không công bố lại nội dung đã bị Admin gỡ và không thay đổi lượt đăng ký hiện có. Tất cả nội dung mới được thêm trong một giao dịch.

| Màn | Thành phần có thể xem |
| --- | --- |
| `/` | Ảnh lớn + bốn thẻ sự kiện tuần này; ảnh lớn + bốn tin nổi bật |
| `/news` | Tin chính, bốn tin bên cạnh, banner, liên kết xem tất cả |
| `/news?view=all&page=1` | Lưới sáu thẻ, nút đọc chi tiết, phân trang |
| `/news?view=all&page=2` | Trang tiếp theo của danh sách |
| `/news/demo-news-ket-noi-the-he` | Nội dung dài, ảnh, tin gần đây, breadcrumb, liên kết |
| `/events` | Lưới sự kiện, tìm kiếm, tab điều hướng, carousel đề xuất |
| `/events?view=conferences` | Nhiều hội nghị, hội thảo và seminar mẫu |
| `/events?view=calendar` | Nhóm sự kiện theo tháng |
| `/events/demo-event-ngay-hoi-alumni` | Poster, địa điểm, giờ, vé còn lại, nội dung và thông tin sự kiện |
| `/events/demo-event-ket-noi-lien-khoa` | Trạng thái đóng đăng ký |
| `/events/demo-event-ky-niem-tro-ve` | Sự kiện đã diễn ra |

Đăng nhập bằng tài khoản CSV thử nghiệm đã có thẻ để xem hộp thoại đăng ký và chọn người đi cùng. Khi chưa đăng nhập hoặc đang chờ duyệt, giao diện tiếp tục dùng đúng quy tắc phân quyền, không giả lập quyền chỉ để mở form.

Ngày sự kiện được tính tương đối từ **lần seed đầu tiên**: năm sự kiện trong bảy ngày tới, một số sự kiện tháng sau và một sự kiện quá khứ. Seed giữ nguyên ngày của bản ghi đã có để bảo toàn chỉnh sửa. Khi demo đã cũ, đổi ngày qua `/admin/events` hoặc tạo bộ dữ liệu trong database dev riêng; không xóa hay ghi đè toàn bộ dữ liệu.

Mẫu do Admin sửa/gỡ vẫn được giữ đúng trạng thái sau lần nạp tiếp theo. Muốn đổi nội dung mẫu trong mã cho các database mới, sửa `apps/backend/scripts/demo-content.ts`.
