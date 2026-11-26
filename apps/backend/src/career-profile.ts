import { ApiError } from "./events.ts";

export const extraProfileFields = {
  jobTitle: 120,
  location: 160,
  linkedin: 300,
  education: 2500,
  skills: 1500,
  projects: 2500,
  activities: 2000,
} as const;

// Chỉ nhận ảnh JPEG nhỏ đã nén; không nhận URL bên ngoài hoặc SVG thực thi mã.
export function profileExtras(input: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const [key, max] of Object.entries(extraProfileFields)) {
    if (!Object.hasOwn(input, key)) continue;
    const value = input[key];
    if (typeof value !== "string" || value.trim().length > max)
      throw new ApiError(400, "invalid_career_fields");
    result[key] = value.trim();
  }
  if (result.linkedin) {
    try {
      const url = new URL(result.linkedin);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        !/^(www\.)?linkedin\.com$/.test(url.hostname)
      )
        throw new Error();
    } catch {
      throw new ApiError(400, "invalid_career_fields");
    }
  }
  if (Object.hasOwn(input, "avatar")) {
    const value = input.avatar;
    if (value === "") result.avatar = "";
    else {
      if (
        typeof value !== "string" ||
        value.length > 44000 ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
      )
        throw new ApiError(400, "invalid_profile_avatar");
      const bytes = Buffer.from(
        value.slice("data:image/jpeg;base64,".length),
        "base64",
      );
      if (
        bytes.length > 32768 ||
        bytes.length < 4 ||
        bytes[0] !== 0xff ||
        bytes[1] !== 0xd8 ||
        bytes[2] !== 0xff ||
        !bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9]))
      )
        throw new ApiError(400, "invalid_profile_avatar");
      result.avatar = value;
    }
  }
  return result;
}
