import { Pool } from "pg";

// Dùng lại kết nối PostgreSQL cho nhiều yêu cầu và giới hạn thời gian chờ khi kiểm tra.
export function createPool(connectionString: string) {
  return new Pool({
    connectionString,
    connectionTimeoutMillis: 2000,
    query_timeout: 3000,
    max: 5,
  });
}

// Chỉ báo sẵn sàng khi database đã có các cột mà phiên bản hiện tại cần đọc.
export async function checkReadiness(pool: Pool) {
  const result = await pool.query(
    "SELECT 1 FROM public.schema_migrations WHERE name = $1",
    ["014_alumni_cohort.sql"],
  );
  return result.rowCount === 1;
}
