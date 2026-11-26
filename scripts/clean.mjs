import { rmSync } from "node:fs";

// Xóa kết quả build và báo cáo kiểm thử được tạo trong thư mục dự án.
for (const directory of [
  "dist",
  "coverage",
  "apps/backend/dist",
  "apps/frontend/.next",
  "apps/frontend/tsconfig.tsbuildinfo",
]) {
  rmSync(directory, { recursive: true, force: true });
}
