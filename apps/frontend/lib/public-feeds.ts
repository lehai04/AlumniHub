import { cache } from "react";
import { type Event, readBackend } from "./backend";
import type { NewsItem } from "./news";

// Dùng chung dữ liệu trong một lượt render, kể cả khi metadata cũng cần đọc.
export const readNews = cache(async (): Promise<NewsItem[]> => {
  const response = await readBackend("/api/news");
  if (!response.ok) throw new Error("News endpoint unavailable");
  return response.json();
});

export const readEvents = cache(async (): Promise<Event[]> => {
  const response = await readBackend("/api/events");
  if (!response.ok) throw new Error("Events endpoint unavailable");
  return response.json();
});
