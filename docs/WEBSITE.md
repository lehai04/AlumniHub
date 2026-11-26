# Cấu trúc website và quy tắc giao diện

## Sơ đồ trang

| Khu vực | Đường dẫn | Nội dung và điều hướng |
| --- | --- | --- |
| Trang chủ | `/` | Hero, hoạt động và sự kiện, dịch vụ, cơ hội nghề nghiệp, cộng đồng và thẻ |
| Tin tức | `/news`, `/news/[slug]` | Danh sách bài đã công bố và chi tiết bài có breadcrumb |
| Sự kiện | `/events`, `/events/[slug]` | Lịch, thông tin sự kiện, tình trạng đăng ký và đăng ký tham dự |
| Việc làm | `/career` | Giới thiệu công khai. Tài khoản đủ điều kiện vào các mục tìm việc, hồ sơ, CV, tuyển dụng và lịch sử |
| Cộng đồng | `/community` | Giới thiệu công khai. Thành viên truy cập bảng tin, vai trò Alumni và hợp tác |
| Dịch vụ | `/services` | Ưu đãi và thư viện, mỗi mục có liên kết trực tiếp |
| Thẻ Alumni | `/alumni-card` | Điều kiện nhận thẻ, hạng thẻ và đường dẫn mở tài khoản |
| Tài khoản CSV | `/account`, `/account/reset` | Đăng nhập, đăng ký hồ sơ, theo dõi xét duyệt và xem thẻ. Khôi phục mật khẩu theo cấu hình môi trường |
| Quản trị | `/admin/login`, `/admin/*` | Layout, phiên đăng nhập và điều hướng quản trị riêng. Các nhóm chính gồm nội dung website và nghiệp vụ |

Các URL hiện có được giữ để duy trì liên kết từ CMS và các hệ thống khác. Danh mục ở `lib/public-pages.ts` là nguồn chung cho thanh điều hướng, footer, trang biên tập nội dung và sitemap. Frontend công khai nằm trong `app/(public)`. Quản trị ở `app/admin`, các thành phần dùng chung ở `app/components`, API cùng origin ở `app/api`. Backend, migration và hệ thống phát hành nằm lần lượt ở `apps/backend`, `db/migrations` và `deploy`.

## Quy tắc VGG áp dụng

| Thành phần | Quy tắc Alumni Hub |
| --- | --- |
| Kiểu chữ | IBM Plex Sans cho nội dung, form và nút. Plus Jakarta Sans cho tiêu đề và menu. Dùng hai bản WOFF2 có giấy phép OFL đã được VGG triển khai thực tế và lưu cùng ứng dụng |
| Màu và khoảng cách | Đỏ Văn Lang `#D72134` cho hành động chính, xanh `#1F2251` và `#171D45` cho nhận diện và nền đậm, giấy `#F6F3F1` cho nền đọc. Dùng token trong `app/base.css` và bo 8 px cho thành phần có viền |
| Nhận diện | Dùng `BrandMark` với dấu chữ VLU hiện có và tên Alumni Hub. Kích thước chuẩn 44 × 44 px, giữ tỷ lệ và chừa khoảng trống 12 px với chữ. Dùng cùng dấu ở header, footer, tài khoản và quản trị. Khi có bộ logo Alumni được phê duyệt, cập nhật component và favicon cùng nhau |
| Hero | Mỗi trang một H1. Trang chủ dùng bố cục 5/7 với một ảnh, mô tả ngắn và một nút chính. CTA phụ hiển thị dưới dạng liên kết. Trang danh mục dùng cùng `PageIntro`, có thể thêm ảnh CMS. Nội dung và ảnh đã công bố qua CMS tiếp tục được sử dụng |
| Header | Desktop cao tối thiểu 88 px và bám đầu trang. Đường dẫn đang xem dùng gạch đỏ. Điện thoại có lưới điều hướng hai hàng và vùng bấm tối thiểu 44 px |
| Footer | Nền xanh đậm, nhận diện đứng riêng, nhóm liên kết khám phá và nhóm tài khoản/Nhà trường. Dùng chung tên mục với header |
| Trình bày nội dung | Dùng chia cột, đường phân cách và ảnh theo chủ đề. Chuyển thành một cột ở màn hình nhỏ. Giữ focus bàn phím, liên kết bỏ qua điều hướng và thông báo form |

Tham chiếu nội bộ của VGG gồm `docs/UI_DESIGN_SYSTEM.md`, `docs/design-system.md` và `frontend/src/app/typography.css`. Các quy tắc kiểu chữ theo cấu hình VGG đang chạy, nơi hai font OFL được phân phối cùng mã nguồn. Tài sản logo VGG có tên Viện Sau đại học nên dấu chữ Alumni được dùng cho bản này.

## Danh sách Tin tức và Sự kiện

Trang chủ, Tin tức, Sự kiện và hai trang chi tiết dùng bố cục mới theo ảnh tham chiếu. Trang chủ có logo Văn Lang, lối tắt, hoạt động trong 7 ngày tới, tin tức và bốn thẻ nghề nghiệp biên tập qua CMS. Các trang còn lại dùng thành phần và nhận diện Alumni Hub hiện có. Ảnh và nội dung đã công bố trong CMS luôn được ưu tiên; khi bài chưa có ảnh, giao diện dùng ảnh minh họa lưu trong dự án. Xem [hướng dẫn thay ảnh](THAY-ANH.md).

Tin tức hiển thị bài đầu ở ô lớn và bốn bài kế tiếp ở cột bên; **Xem tất cả tin tức** dẫn đến `/news?view=all`, mỗi trang gồm sáu bài. Chi tiết tin có ảnh lớn và ba tin gần đây, không lặp bài đang xem. Sự kiện hỗ trợ tìm theo tiêu đề, mô tả hoặc địa điểm; **Lịch sự kiện** nhóm theo tháng tại múi giờ Việt Nam. **Hội nghị** hiện lọc theo tên chứa hội nghị, hội thảo, conference hoặc seminar vì chưa có trường phân loại. **Sự kiện của tôi** yêu cầu tài khoản Alumni và gọi `/api/events?registered=true`; backend lấy chủ đăng ký từ phiên đăng nhập. Nút **Đăng ký** ở chi tiết mở hộp chọn số người đi cùng; backend tiếp tục kiểm tra hạn đăng ký, sức chứa và quyền hủy như trước.

## SEO khi phát hành

- Tách title, description, Open Graph và Twitter card theo URL. Bài tin và sự kiện lấy dữ liệu đã công bố. Canonical dùng tên miền HTTPS cấu hình trên web.
- Chi tiết tin tức và sự kiện có breadcrumb hiển thị và dữ liệu `BreadcrumbList`. Bài tin có thêm dữ liệu `Article`.
- Tài khoản, quản trị, trang nghiệp vụ Career Hub và tab có tham số của Career Hub/Cộng đồng dùng `noindex`. Quyền đọc dữ liệu vẫn được backend kiểm tra.
- `/sitemap.xml` chỉ liệt kê các trang đích công khai và chi tiết đã công bố. `/robots.txt` khai báo sitemap khi bật lập chỉ mục. Bot có thể đọc chỉ thị `noindex`, kể cả khi sitemap tắt.
- Đặt `PUBLIC_SITE_URL` là origin HTTPS của môi trường, ví dụ `https://alumni.example.org`. Chỉ đặt `PUBLIC_INDEXING_ENABLED=true` sau khi tên miền chính thức được xác nhận. Staging tự động giữ `false` và cần được giới hạn bằng proxy của môi trường.
- Với GitHub Actions, đặt `PUBLIC_SITE_URL` trong mỗi GitHub Environment. Biến `PUBLIC_INDEXING_ENABLED` chỉ được lấy từ Environment production. Khi phát hành thủ công, export hai biến trước khi chạy lệnh deploy/rollback. Một origin thiếu hoặc sai định dạng giữ website ở chế độ `noindex`.

Hướng dẫn chính thức về [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) và [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
