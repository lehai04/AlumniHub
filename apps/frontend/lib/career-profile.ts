export const profileSections = [
  ["general", "Thông tin chung", "user"],
  ["experience", "Kinh nghiệm", "briefcase"],
  ["education", "Học vấn", "cap"],
  ["skills", "Kỹ năng", "layers"],
  ["projects", "Dự án", "folder"],
  ["activities", "Hoạt động", "star"],
] as const;
export type ProfileSection =
  | (typeof profileSections)[number][0]
  | "intro"
  | "preferences"
  | "all";
export const profileTextFields = [
  ["intro", "Giới thiệu bản thân", 1500],
  ["experience", "Kinh nghiệm làm việc", 2500],
  ["education", "Học vấn", 2500],
  ["skills", "Kỹ năng", 1500],
  ["projects", "Dự án", 2500],
  ["activities", "Hoạt động", 2000],
  ["certificates", "Chứng chỉ", 1500],
] as const;

// Dữ liệu chỉ dành cho đường dẫn xem trước, không ghi vào hồ sơ người dùng.
export const previewProfile = {
  looking: false,
  profile: {
    fullName: "Lê Hải Anh",
    specialty: "Công nghệ Thông tin",
    cohort: "K26",
    jobTitle: "Lập trình viên",
    location: "TP. Hồ Chí Minh",
    email: "lehaianh@example.test",
    phone: "0900000123",
    birthDate: "2002-08-05",
    linkedin: "https://www.linkedin.com/in/example",
    intro:
      "Lập trình viên với hơn 2 năm kinh nghiệm phát triển web, có khả năng làm việc nhóm, tư duy giải quyết vấn đề và mong muốn phát triển chuyên sâu trong lĩnh vực sản phẩm số.",
    experience:
      "Lập trình viên Front-end\nPhát triển giao diện web, phối hợp cùng nhóm thiết kế và tối ưu trải nghiệm người dùng.",
    education: "Đại học Văn Lang\nChuyên ngành Công nghệ Thông tin.",
    skills: "React, TypeScript, HTML/CSS, Làm việc nhóm, Giải quyết vấn đề",
    projects: "",
    activities: "",
    certificates: "",
  },
};
