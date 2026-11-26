# Cây thư mục Alumni Hub

Chỉ chạy và sửa ứng dụng trong `alumni-hub/`. Bộ prototype cũ nằm ở `../reference/legacy/`, không trộn dependency hoặc cấu hình của bộ cũ với ứng dụng này.

```text
alumni-hub/
├── apps/
│   ├── backend/
│   │   ├── src/          # API, xác thực, nghiệp vụ và PostgreSQL
│   │   ├── scripts/      # Migration runner, seed và dữ liệu demo
│   │   ├── tests/        # Kiểm thử backend
│   │   └── config/       # Cấu hình TypeScript
│   └── frontend/
│       ├── app/
│       │   ├── (public)/ # Website, tin tức, sự kiện, tài khoản
│       │   ├── admin/    # Các màn quản trị
│       │   ├── api/      # Chuyển tiếp API cùng origin
│       │   └── components/ # Logo, ô mật khẩu và thành phần dùng chung
│       ├── lib/          # Kiểu dữ liệu, gọi API và cấu hình nội dung
│       └── public/       # Logo, ảnh và phông chữ
├── db/migrations/        # SQL bất biến; thêm migration mới khi đổi schema
├── scripts/              # Chạy local, kiểm tra, dọn bản build và công cụ phát triển
├── docs/                 # Hướng dẫn chạy, demo, vận hành và thay ảnh
├── deploy/               # Cấu hình triển khai
├── artifacts/            # Ảnh/video đã xuất để xem trước, không đóng gói ứng dụng
└── package.json          # Lệnh và dependency cho hai workspaces
```

## Đã dọn

- Chuyển 21 mục tham chiếu ở gốc vào `reference/legacy/`, đối chiếu mã băm 102 tệp, không ghi đè đích.
- Xóa `dist/` cũ ở gốc ứng dụng vì backend hiện build vào `apps/backend/dist/`.
- Xóa cache Python của prototype, khung hình thô và ảnh kiểm tra trung gian của video. Giữ ảnh giao diện và MP4 đã gửi.
- Xóa favicon PNG chữ VLU cũ sau khi kiểm tra không còn tham chiếu; favicon hiện tại là SVG huy hiệu VLU.
- Thay ảnh mũi tên carousel bằng SVG trong component, bỏ ảnh mũi tên không còn sử dụng.
- Giữ dependency, migration, tài nguyên thiết kế, mã nguồn, tài liệu và thư mục build của các tiến trình đang chạy.

Chi tiết: `../reference/legacy-manifest.json` ghi vị trí cũ và SHA-256 của từng tệp; `../reference/removed-generated-files.json` ghi các mục đã xóa. Năm tệp cache Python trong manifest chuyển chỗ đã được dọn sau khi đối chiếu.

## Quy tắc tiếp tục

Không sửa bằng cách chép đè cả thư mục. Khi chuyển file, dừng nếu đích đã tồn tại và kiểm tra tham chiếu trước/sau. Dùng lại component, không tạo bản sao của trang chỉ để trình diễn. Nội dung demo được thêm vào database dev bằng slug riêng và `ON CONFLICT DO NOTHING`; không thay nội dung thật bằng dữ liệu cứng ở frontend.
