# Triển khai

## Dev

1. Cài Node.js 24, npm 11 và Docker Compose. Khởi động Docker.
2. Trong thư mục repo chạy `npm run setup`, tùy chọn `npm run local:accounts`, rồi `npm run dev`. Kiểm tra frontend cổng 8080 và backend cổng 8081.
3. Để chạy cả ứng dụng trong container, dừng dev rồi chạy `docker compose up --build --wait`. Seed tùy chọn bằng `npm run db:seed`.

## Chuẩn bị staging và production

1. Cấp máy Linux riêng cho mỗi môi trường. Cài Docker/Compose, Bash, `flock` và reverse proxy. Cấu hình TLS và chuyển tiếp vào `127.0.0.1:8080`. Giới hạn truy cập staging và cổng DB bằng firewall.
2. Tạo database riêng, một DB role cho migration có quyền tạo bảng trong schema `public` và một DB role runtime có quyền `CONNECT`/ `USAGE` cần thiết. Trước migration đầu tiên, cấp quyền đọc bảng do migration role tạo cho runtime, ví dụ `ALTER DEFAULT PRIVILEGES FOR ROLE alumni_migrator IN SCHEMA public GRANT SELECT ON TABLES TO alumni_runtime;`. Dùng tài khoản hoặc nhóm có đúng quyền khi chạy lệnh. Runner dùng credential kéo GHCR theo quyền đọc qua credential helper của đơn vị.
3. Cấp `/etc/alumni-hub/runtime.env` và `/etc/alumni-hub/migration.env` từ kho secret CNTT với quyền đọc giới hạn. Cả hai đặt `APP_ENV` theo môi trường và `DATABASE_URL` dùng TLS xác thực với đúng DB role. Chỉ container migration nhận credential DDL. Tạo `/var/lib/alumni-hub/releases` có quyền ghi cho runner.
4. Đăng ký hai runner Linux riêng với label `alumni-staging` và `alumni-production`. Giới hạn runner cho repo này và chỉ dùng cho workflow phát hành đáng tin cậy. Quyền Docker tương đương quyền quản trị trên host.
5. Trong GitHub, tạo GitHub Environments `staging` và `production`. Chỉ cho `main` triển khai. Ở production bật **Required reviewers** và **Prevent self-review**. Xác nhận gói GitHub hỗ trợ các quy tắc này. Sau đó mới bật repo variable `ENABLE_PRODUCTION=true`. Bật `ENABLE_STAGING=true` để staging chạy tự động. Kiểm tra một lần rằng job production thực sự chờ review.
6. Cấu hình backup, kiểm tra cảnh báo và thử khôi phục vào database biệt lập.

## Staging

Merge PR đã duyệt vào `main`. Pipeline kiểm tra, đẩy image lên GHCR, chạy migration và kiểm tra readiness trên staging. Xác nhận commit trên `/health` khớp commit phát hành. Trước khi mời khách hàng, cấu hình tài khoản quản trị theo [hướng dẫn môi trường](ENVIRONMENTS.md) và chạy ca bàn giao qua tên miền HTTPS của staging.

DB role runtime của staging cần quyền ghi vào các bảng nghiệp vụ và quyền `USAGE` trên sequence `public.alumni_card_number` để cấp mã thẻ. Sau migration, DBA cấp `SELECT`, `INSERT`, `UPDATE` và `DELETE` trên các bảng nghiệp vụ mà runtime sử dụng. Giữ `schema_migrations` ở quyền đọc và chạy migration bằng role riêng. Xác minh quyền bằng ca đăng ký hồ sơ, duyệt và cấp thẻ trên staging.

## Production

Backend chỉ kết nối qua mạng nội bộ Compose. Reverse proxy hiện tại tiếp tục trỏ tới dịch vụ web trên loopback cổng 8080. Hai container chạy cùng image và xác nhận backend sẵn sàng trước khi web nhận lưu lượng. Compose ép tắt tài khoản thử nghiệm ở môi trường triển khai.

Trước khi duyệt job production, kiểm tra staging đã xanh, digest đúng, backup gần nhất hợp lệ và migration tương thích với image trước. Reviewer có thẩm quyền duyệt job production trong GitHub. Job kéo chính digest staging, chạy migration và chờ readiness.

Sau triển khai, gọi `/health` và `/ready` qua tên miền production, xác nhận commit, kiểm tra log và tỷ lệ lỗi. Khi readiness thất bại, script thử khôi phục image khỏe gần nhất. Nếu hậu kiểm thất bại, thực hiện [rollback](ROLLBACK.md).

Cấu hình tên miền và chính sách lập chỉ mục theo [hướng dẫn website](WEBSITE.md#seo-khi-phát-hành). Kiểm tra URL canonical, `/robots.txt` và `/sitemap.xml` sau mỗi lần thay đổi tên miền hoặc chế độ SEO.

## Chạy thủ công trên host

Chỉ chạy trên host tương ứng, sau khi thực hiện cùng quy trình phê duyệt. Dùng digest lấy từ lần phát hành đã kiểm tra.

```bash
export COMPOSE_PROJECT_NAME=alumni-staging
export RUNTIME_ENV_FILE=/etc/alumni-hub/runtime.env
export MIGRATION_ENV_FILE=/etc/alumni-hub/migration.env
export RELEASE_STATE_DIR=/var/lib/alumni-hub/releases
bash deploy/deploy.sh 'ghcr.io/owner/alumni-hub@sha256:<digest>'
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/ready
```

Tham số image phải có SHA-256 đầy đủ. Giữ thư mục release state bền vững qua các lần chạy. Dùng cùng project name cho mọi thao tác của môi trường. Khi chạy lại với cùng digest, migration đã áp dụng được bỏ qua và Compose giữ container nếu cấu hình như cũ.
