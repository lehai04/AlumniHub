# Thay ảnh giao diện Alumni Hub

Ảnh tải lên và **Công bố** trong CMS được ưu tiên hơn ảnh mặc định trong mã nguồn. Ảnh minh họa không thay đổi tiêu đề, thời gian, địa điểm hay số chỗ của dữ liệu thật. Mỗi ảnh CMS nhận JPG, PNG hoặc WebP tối đa 2 MB.

| Vị trí trên giao diện | Thay trong CMS | Ảnh mặc định khi chưa tải lên |
| --- | --- | --- |
| Logo Văn Lang trên tất cả trang, đăng nhập/đăng ký và quản trị | Thay trực tiếp tệp, giữ nguyên tên | `public/assets/van-lang-logo.png` — hiển thị qua thành phần chung `app/components/brand-mark.tsx` |
| Huy hiệu VLU trên tab trình duyệt | Thay trực tiếp tệp | `public/assets/favicon.svg` — dùng huy hiệu lấy từ cùng logo bạn cung cấp |
| Banner collage trang chủ | `/admin/homepage` → **Ảnh đầu trang** | `public/assets/illustrations/alumni-sports.jpg` |
| Ảnh lớn mục sự kiện trang chủ | Ưu tiên ảnh từng sự kiện; nếu chưa có, dùng `/admin/homepage` → **Ảnh mục sự kiện** | `public/assets/illustrations/alumni-sports.jpg` |
| Bốn thẻ cơ hội nghề nghiệp | `/admin/homepage` → **Ảnh cơ hội nghề nghiệp 1–4**; các trường **Cơ hội 1–4** chỉnh tiêu đề, mô tả và đường dẫn | Tập trung trong `lib/homepage.ts`, biến `homepageImageDefaults` |
| Banner trang Tin tức, gồm cả danh sách phân trang | `/admin/pages/news` → **Chọn ảnh** | `public/assets/figma/news-banner.png` |
| Banner danh sách Sự kiện | `/admin/pages/events` → **Chọn ảnh** | `public/assets/figma/events-banner.png` |
| Banner trang Việc làm | `/admin/pages/career` → **Chọn ảnh**, lưu rồi công bố | `public/assets/illustrations/career-campus.jpg` |
| Ảnh tin ở trang chủ, tin nổi bật, danh sách, chi tiết và tin gần đây | `/admin/news` → **Chỉnh nội dung, ảnh và link bài tin** | `lib/news.ts`, hàm `newsImage` và danh mục `covers` |
| Ảnh sự kiện ở trang chủ, danh sách, đề xuất và chi tiết | `/admin/events` → **Chỉnh nội dung, ảnh và link sự kiện** | `public/assets/illustrations/alumni-sports.jpg` hoặc `alumni-community.jpg` |

Các đường dẫn tệp trong bảng tính từ `apps/frontend/`. Thẻ nghề nghiệp là nội dung giới thiệu do Admin biên tập; danh sách tin tuyển dụng có quyền truy cập riêng vẫn ở Career Hub.

## Cách lưu

1. Đăng nhập quản trị và mở đúng màn trong bảng.
2. Chọn ảnh, chỉnh mô tả ảnh nếu có rồi bấm **Lưu bản nháp**.
3. Bấm **Công bố**, sau đó tải lại trang công khai.

Nếu sửa ảnh mặc định bằng tệp trên máy, giữ nguyên tên và build lại ứng dụng. Logo nên là PNG nền trong suốt, giữ đúng tỷ lệ; banner nên rộng ít nhất 1440 px, thẻ tin và nghề nghiệp nên rộng ít nhất 800 px. Ảnh poster sự kiện hiển thị đầy đủ nội dung, không cắt theo khung của banner danh sách.

## Nguồn ảnh minh họa

- `alumni-sports.jpg`, `alumni-speaker.jpg`, `alumni-community.jpg`: VLU Alumni Association trong bài [Hội thao Cựu sinh viên 2024](https://www.vlu.edu.vn/news/hoi-thao-cuu-sinh-vien-2024-ket-noi-the-he-kien-tao-tuong-lai) trên website Văn Lang.
- `career-office.jpg`: [ảnh văn phòng của phyo min trên Unsplash](https://unsplash.com/photos/two-men-working-on-computers-in-an-office-VBCHfGtH79s).
- `career-campus.jpg`: ảnh khuôn viên từ [website chính thức Văn Lang](https://www.vlu.edu.vn/news/thong-bao-tuyen-sinh-lien-thong-trinh-do-cao-dang-len-dai-hoc-nam-2025-1).
- Thư mục `assets/figma/`: ảnh đã tải từ thiết kế Figma bạn cung cấp; logo lấy từ ảnh bạn gửi trong chat.

Tất cả ảnh mặc định đang dùng đều được lưu trong dự án, không phụ thuộc URL ảnh tạm của Figma.
