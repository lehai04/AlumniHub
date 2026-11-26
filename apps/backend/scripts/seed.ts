import { readConfig } from "../src/config.ts";
import { createPool } from "../src/database.ts";
import { createLogger } from "../src/logger.ts";
import { seedDemoContent } from "./demo-content.ts";

// Chỉ thêm nội dung mẫu ở dev; chạy lại không nhân bản hay ghi đè nội dung đã sửa.
async function seed() {
  if (process.env.APP_ENV !== "dev")
    throw new Error("Seed is available only in dev");
  const config = readConfig(process.env);
  const pool = createPool(config.databaseUrl);
  try {
    await pool.query(
      "INSERT INTO public.events (slug, title, starts_at, capacity, location, published_at) VALUES ($1,$2,$3,$4,$5,now()) ON CONFLICT (slug) DO NOTHING",
      [
        "demo-alumni-meetup",
        "Demo Alumni Meetup",
        "2030-01-15T03:00:00Z",
        50,
        "Văn Lang (dữ liệu mẫu)",
      ],
    );
    await pool.query(
      `INSERT INTO public.news_articles (slug, title, summary, body, cover, published_at)
       VALUES ($1, $2, $3, $4, $5, now()) ON CONFLICT (slug) DO NOTHING`,
      [
        "tin-mau-alumni",
        "[Tin mẫu local] Làm quen với mục Tin tức Alumni",
        "Bài minh họa dùng để kiểm thử cách đọc, chỉnh sửa và gỡ tin.",
        "Đây là dữ liệu giả lập cho môi trường phát triển. Admin có thể sửa hoặc gỡ bài này để kiểm tra thay đổi trên trang Tin tức.",
        "community",
      ],
    );
    const added = await seedDemoContent(pool);
    createLogger(config.logLevel)("info", "seed_complete", added);
  } finally {
    await pool.end();
  }
}

seed().catch(() => {
  createLogger("error")("error", "seed_failed");
  process.exitCode = 1;
});
