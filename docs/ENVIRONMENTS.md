# Môi trường

| Hạng mục | Dev | Staging | Production |
| --- | --- | --- | --- |
| APP_ENV | `dev` | `staging` | `production` |
| HTTP | Loopback cổng 8080 | HTTPS qua proxy riêng | HTTPS qua proxy chính thức |
| DB | Compose local, mật khẩu ngẫu nhiên | PostgreSQL riêng, TLS xác thực | PostgreSQL riêng, TLS xác thực và backup |
| Dữ liệu | Mẫu từ seed | Giả lập hoặc đã ẩn danh | Dữ liệu thật đã được phép |
| Cấu hình | `.env` local | Secret trên host staging | Secret trên host production |
| Phát hành | Tự chạy | Tự động từ main sau khi bật | Cùng digest, qua phê duyệt |

`DATABASE_URL` bắt buộc. Staging và production dùng `sslmode=verify-full`. Nếu DB dùng CA riêng, đặt `COMPOSE_OVERRIDE_FILE` trên runner thành đường dẫn tuyệt đối đến Compose override gắn CA chỉ đọc vào cả container web và migration. Chỉ tới đường dẫn trong container qua `sslrootcert` trong URI. Kiểm thử override ở staging trước khi dùng production. Với URI có ký tự đặc biệt, percent-encode thành phần tên người dùng và mật khẩu. Trong tệp runtime dành cho Compose, dùng cú pháp trích dẫn phù hợp để Compose không nội suy ký tự trong giá trị. Giữ metadata `APP_VERSION` và `COMMIT_SHA` lấy từ image. Mục đích và giá trị mẫu của các biến nằm trong `.env.example`.

Runner và thông tin truy cập phải độc lập giữa staging và production. Các máy dùng timezone rõ ràng, còn log ứng dụng dùng UTC.


## Bản kiểm thử khách hàng

Dùng `APP_ENV=staging`, PostgreSQL riêng và tên miền HTTPS hiện có của staging. Đặt `STAFF_ADMIN_PASSWORD` trong tệp runtime của backend để kích hoạt tài khoản `admin`. Khi cần kiểm thử phê duyệt nội dung, đặt thêm `STAFF_REVIEWER_PASSWORD` cho tài khoản `reviewer`. Tạo mật khẩu ngẫu nhiên riêng cho từng vai trò, từ 24 đến 128 ký tự, và chuyển qua kênh quản lý bí mật của đơn vị. Phát hành qua quy trình trong [Deployment](DEPLOYMENT.md).

- Cổng quản trị ở `/admin/login`. Đường dẫn `/admin` tự đưa khách chưa xác thực tới trang đăng nhập.
- Cổng cựu sinh viên ở `/account`. Người kiểm thử tự đăng ký hồ sơ bằng email, đăng nhập và theo dõi kết quả duyệt.
- Các phiên được lưu trong bộ nhớ tiến trình backend. Chạy một backend cho bản kiểm thử và yêu cầu người dùng đăng nhập lại sau khi triển khai hoặc khởi động lại.

Sau phát hành, kiểm tra `/ready` và thực hiện ca bàn giao tại [Handover](HANDOVER.md). Dùng dữ liệu kiểm thử hoặc dữ liệu đã ẩn danh. Môi trường dev cung cấp chức năng khôi phục mật khẩu qua hộp thư local.
