# Quy ước dự án Alumni Hub

Áp dụng cho lập trình viên và trợ lý AI khi sửa mã trong `alumni-hub/`. Đọc [README](README.md) và [kiến trúc](docs/ARCHITECTURE.md) trước khi thay đổi cấu trúc hoặc luồng nghiệp vụ. Với quy trình PR, xem [CONTRIBUTING](CONTRIBUTING.md).

## Đặt mã đúng chỗ

| Thư mục | Trách nhiệm |
| --- | --- |
| `apps/frontend/app/` | Trang Next.js App Router. Website cựu sinh viên và khu vực `/admin` dùng chung ứng dụng. |
| `apps/frontend/lib/` | Gọi backend, kiểu dữ liệu và logic dùng chung của giao diện. |
| `apps/backend/src/` | API Node.js, xác thực, phân quyền, quy tắc nghiệp vụ và truy vấn PostgreSQL. |
| `db/migrations/` | Migration SQL đánh số theo thứ tự. |
| `apps/backend/tests/`, `scripts/` | Kiểm thử backend, smoke test và lệnh phát triển local. |
| `deploy/`, `.github/workflows/` | Compose triển khai, rollback và CI. |

Dùng npm workspaces và lockfile ở thư mục gốc. Tên tệp, biến và hàm dùng tiếng Anh. Chú thích và tài liệu dùng tiếng Việt, tập trung giải thích lý do hoặc quy tắc dễ hiểu sai. Tìm logic hiện có trước khi thêm module hay dependency. Fastify, Prisma, MinIO và CMS độc lập chỉ được xem xét khi có yêu cầu riêng.

## API, quyền và dữ liệu

- Frontend gọi API qua `/api/*`. Backend kiểm tra dữ liệu đầu vào, phiên và vai trò trước khi đọc dữ liệu quản trị hoặc ghi dữ liệu. Lấy danh tính từ phiên.
- Phiên thử nghiệm chỉ bật ở local với `APP_ENV=dev` và cấu hình cho phép. Dùng dữ liệu giả lập để kiểm thử. Giữ mật khẩu trong `.env` local và ngoài Git.
- Sự kiện công khai phải đã xuất bản. Mỗi tài khoản có tối đa một lượt đăng ký cho mỗi sự kiện. Giữ ràng buộc chống trùng ở PostgreSQL và kiểm tra sức chứa trong cùng giao dịch ghi đăng ký. Tổng số người bằng người đăng ký cộng số người đi cùng.
- Khi đổi cấu trúc cơ sở dữ liệu, thêm migration SQL mới. Migration đã áp dụng được kiểm tra bằng checksum. Chạy thử migration trên database local biệt lập và kiểm tra chạy lại.
- Giữ `/health` để kiểm tra tiến trình và `/ready` để kiểm tra ứng dụng đã sẵn sàng làm việc với cơ sở dữ liệu.

## Kiểm tra và bàn giao

1. Chạy `npm run lint`, `npm run typecheck`, `npm test` và `npm run build` với thay đổi mã. Trên Windows PowerShell có thể dùng `npm.cmd`.
2. Với thay đổi phối hợp frontend, API hoặc cơ sở dữ liệu, chạy `npm run test:smoke` trên stack local dành riêng cho thử nghiệm. Lệnh này tạo dữ liệu sự kiện và đăng ký mẫu.
3. Với thay đổi Docker hoặc CI, kiểm tra cấu hình Compose. Khi thay Dockerfile, build image local. Giữ reverse proxy hiện tại làm điểm kết thúc HTTPS.
4. Các thay đổi mặc định thực hiện trên mã nguồn và môi trường local. Deploy và migration lên database đang vận hành chỉ thực hiện khi có yêu cầu rõ ràng cho môi trường đó.
5. Cập nhật README nếu đổi cách chạy, cấu hình hoặc cấu trúc thư mục. Khi bàn giao, ghi rõ thay đổi, kiểm tra đã chạy và phần còn tồn đọng.
