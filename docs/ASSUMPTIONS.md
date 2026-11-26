# Giả định

- Phạm vi hiện tại gồm nền vận hành và module sự kiện. Đăng nhập thật và tích hợp VHub sẽ theo yêu cầu được chốt riêng.
- Chưa có mã hoặc tài liệu kiến trúc VGG trong workspace. Cấu trúc triển khai dựa trên mô hình frontend, backend và các ràng buộc đã mô tả trong yêu cầu.
- Workspace hiện có prototype, báo cáo, Next.js chưa hoàn thiện và schema Prisma tham khảo. Alumni Hub nằm trong thư mục độc lập. Khi tạo repo Git, dùng chính thư mục này làm root.
- Dùng Node.js 24, TypeScript, PostgreSQL 17, npm và Docker Compose trên máy Linux x86-64. Môi trường thực tế có thể thay đổi sau khi CNTT xác nhận.
- Staging và production có máy hoặc miền tin cậy riêng, reverse proxy HTTPS và PostgreSQL ngoài Compose. Quy trình dựa trên một replica. Cần chấp nhận gián đoạn ngắn khi thay container.
- Dùng GitHub Actions và GHCR. Quyền phê duyệt production phụ thuộc cấu hình và gói GitHub. Chỉ bật production khi thực thi được required reviewers.
- Chưa xác định đơn vị maintain, tên miền, chỉ tiêu sẵn sàng, RPO/RTO, chính sách lưu log và thời hạn giữ backup. Chủ hệ thống cần xác nhận trước khi dùng dữ liệu thật.
- Chưa cấp giấy phép phân phối. Mã nguồn đặt ở chế độ private đến khi chủ sở hữu quyết định.
