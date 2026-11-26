import { type Level, levels } from "./config.ts";

// Ghi mỗi sự kiện thành một dòng JSON để dễ lọc nhật ký của ứng dụng và container.
export function createLogger(minimum: Level) {
  return (
    level: Level,
    event: string,
    fields: Record<string, string | number> = {},
  ) => {
    if (levels.indexOf(level) < levels.indexOf(minimum)) return;
    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...fields,
    });
    if (level === "error" || level === "warn") console.error(message);
    else console.log(message);
  };
}
