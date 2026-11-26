# Bàn giao

Alumni Hub gồm frontend Next.js, backend Node.js HTTP, PostgreSQL, Docker Compose và GitHub Actions. Người nhận chạy [README](../README.md), sau đó đọc [triển khai](DEPLOYMENT.md) và [runbook](RUNBOOK.md).

| Tài khoản hoặc dịch vụ | Trách nhiệm | Vị trí thông tin truy cập |
| --- | --- | --- |
| GitHub repo | Quyền PR, nhánh main, cấu hình môi trường, reviewer | GitHub organization |
| GHCR | CI ghi image, runner đọc image | GitHub Packages và credential helper của runner |
| Runner staging/production | Kéo image, chạy Compose và migration trên host riêng | Quản lý tài khoản Linux của CNTT |
| PostgreSQL | Kết nối DB, cấp quyền, backup và phục hồi | Secret store, cấp vào runtime env hoặc PostgreSQL service/password file |
| DNS/TLS/reverse proxy | Tên miền, gia hạn chứng chỉ và định tuyến HTTPS | Hệ thống quản lý tên miền/chứng chỉ của Trường |
| Giám sát và backup | Kiểm tra endpoint, tập trung log, retention và diễn tập | Nền tảng vận hành của CNTT |

Trước bàn giao, chỉ định maintainer kỹ thuật, người trực vận hành và reviewer production. Xác nhận tên miền, người sở hữu secret, lịch quay vòng, lịch backup, RPO/RTO và kênh báo sự cố. Chạy thử phát hành staging, khôi phục DB biệt lập và rollback về digest cũ.

Bản kiểm thử khách hàng dùng cấu hình staging và hai đường dẫn `/admin/login` và `/account`. Cấp mật khẩu quản trị qua kênh riêng và dùng hồ sơ kiểm thử được phép. Đăng nhập cả hai cổng trên cùng trình duyệt, duyệt hồ sơ từ cổng quản trị, tải lại trang CSV để thấy mã Alumni và thử đăng xuất lần lượt. Kiểm tra thêm quyền người duyệt nếu môi trường có cấu hình vai trò này. Xem [cấu hình staging](ENVIRONMENTS.md).

Môi trường kiểm thử hiện dùng một tài khoản cấu hình cho mỗi vai trò quản trị, phiên trong bộ nhớ của một backend và chưa có gửi email khôi phục mật khẩu. Tích hợp tài khoản định danh của Trường và SMTP thuộc phạm vi chuẩn bị cho vận hành chính thức.
