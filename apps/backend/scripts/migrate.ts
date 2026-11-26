import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { readConfig } from "../src/config.ts";
import { createLogger } from "../src/logger.ts";

async function migrate() {
  const config = readConfig(process.env);
  const log = createLogger(config.logLevel);
  const pool = new Pool({
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: 5000,
    statement_timeout: 120000,
    lock_timeout: 15000,
    max: 1,
  });
  try {
    const client = await pool.connect();
    try {
      const files = (await readdir("db/migrations"))
        .filter((file) => /^\d+_[a-z_]+\.sql$/.test(file))
        .sort();
      // Chạy migration trong một giao dịch và dùng khóa PostgreSQL để mỗi lần chỉ có một tiến trình cập nhật cấu trúc cơ sở dữ liệu.
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(68715001)");
      await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
        name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
      )`);
      for (const file of files) {
        const sql = await readFile(path.join("db/migrations", file), "utf8");
        // Chuẩn hóa ký tự xuống dòng để Windows và Linux tạo cùng mã kiểm tra.
        const checksum = createHash("sha256")
          .update(sql.replaceAll("\r\n", "\n"))
          .digest("hex");
        const applied = await client.query<{ checksum: string }>(
          "SELECT checksum FROM public.schema_migrations WHERE name = $1",
          [file],
        );
        // Bỏ qua migration đã áp dụng. Báo lỗi nếu nội dung SQL của migration đó đã bị sửa.
        if (applied.rows[0]) {
          if (applied.rows[0].checksum !== checksum)
            throw new Error("Migration checksum changed");
        } else {
          await client.query(sql);
          await client.query(
            "INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)",
            [file, checksum],
          );
        }
      }
      await client.query("COMMIT");
      log("info", "migrations_complete", { files: files.length });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

migrate().catch(() => {
  createLogger("error")("error", "migration_failed");
  process.exitCode = 1;
});
