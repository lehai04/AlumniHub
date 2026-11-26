import { cookies } from "next/headers";
import { cache } from "react";
import type { ItemAssets } from "./item-content";

export type Event = ItemAssets & {
  slug: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  capacity: number;
  guest_limit: number;
  published_at: string | null;
  registration_closed_at: string | null;
  registration_deadline_passed: boolean;
  cancellation_deadline_passed: boolean;
  registered_people: number;
};
export function registrationStatus(event: Event) {
  if (event.registration_closed_at) return "Đã đóng đăng ký";
  if (event.registration_deadline_passed) return "Đã hết hạn đăng ký";
  return event.registered_people >= event.capacity
    ? "Đã hết chỗ"
    : "Đang nhận đăng ký";
}
export type Session = {
  account: {
    id: string;
    role: "admin" | "alumni" | "applicant" | "reviewer";
  } | null;
  localLogin: boolean;
  passwordResetEnabled: boolean;
  registrationEnabled: boolean;
};

export function backendRequest(path: string, init?: RequestInit) {
  const base = process.env.BACKEND_URL ?? "http://127.0.0.1:8081";
  return fetch(`${base}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    ...init,
  });
}

export async function readBackend(path: string, authenticated = false) {
  const staff = path.startsWith("/api/admin/") || path === "/api/local/mailbox";
  const token = authenticated
    ? (await cookies()).get(staff ? "alumni_staff_session" : "alumni_session")
    : undefined;
  return backendRequest(
    path,
    token ? { headers: { cookie: `${token.name}=${token.value}` } } : undefined,
  );
}

export const readSession = cache(async (): Promise<Session> => {
  const response = await readBackend("/api/session", true);
  if (!response.ok) throw new Error("Session endpoint unavailable");
  return response.json();
});

type StaffSession = {
  account: { id: string; role: "admin" | "reviewer" } | null;
  loginEnabled: boolean;
  passwordResetEnabled: boolean;
};

export const readStaffSession = cache(async (): Promise<StaffSession> => {
  const response = await readBackend("/api/admin/session", true);
  if (!response.ok) throw new Error("Staff session endpoint unavailable");
  return response.json();
});

export async function readCareer<T>(path: string): Promise<T> {
  const response = await readBackend(`/api/career/${path}`, true);
  if (!response.ok) throw new Error("Career Hub endpoint unavailable");
  return response.json();
}

export function eventDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
}
