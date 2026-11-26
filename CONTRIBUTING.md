# Đóng góp

Tạo nhánh từ `main`, đặt tên `feat/ten-tinh-nang`, `fix/ten-loi` hoặc `docs/chu-de`. Dùng Conventional Commits, ví dụ `feat(events): add registration` hoặc `fix(db): guard concurrent migrations`.

1. Chạy `npm run setup` sau khi clone. Khi tạo repo Git đầu tiên, đặt quyền executable cho hook bằng `git update-index --chmod=+x scripts/hooks/pre-commit` sau khi stage và trước khi commit.
2. Chạy `npm run format`, `npm run lint`, `npm test` và `npm run build`. Với thay đổi DB, chạy migration trên DB dev và kiểm tra lại lần chạy thứ hai.
3. Mở PR với mục tiêu, cách kiểm tra, tác động cấu hình/DB và cách rollback nếu có. Cập nhật mục Unreleased của CHANGELOG.
4. Yêu cầu một người review và pipeline xanh trước khi merge. Chặn push trực tiếp lên `main`. Các thay đổi release workflow cần maintainer hạ tầng review.

Đặt secret trong kho được cấp quyền. Kiểm tra diff và tệp mới trước khi PR.
