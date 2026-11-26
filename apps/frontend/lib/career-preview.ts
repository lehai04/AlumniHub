import type { Job } from "./career";

export type CareerListing = Job & {
  salary?: string;
  experience?: string;
  category?: string;
  employment?: "full-time" | "intern" | "part-time";
  brand?: string;
  demo?: boolean;
};

// Tin minh họa tách khỏi PostgreSQL, không tạo nhà tuyển dụng hoặc lượt ứng tuyển giả.
const samples = [
  [
    "Chuyên viên Truyền thông Nội bộ",
    "Đại học Văn Lang (VLU)",
    "vlu",
    "12 – 18 triệu/tháng",
    "1 – 3 năm",
    "Marketing",
    "full-time",
  ],
  [
    "Lập trình viên Front-end",
    "Công ty Cổ phần FPT",
    "fpt",
    "15 – 30 triệu/tháng",
    "1 – 3 năm",
    "Công nghệ thông tin",
    "full-time",
  ],
  [
    "Nhân viên Marketing (Digital)",
    "Công ty Cổ phần VNG",
    "vng",
    "Thỏa thuận",
    "1 – 2 năm",
    "Marketing",
    "full-time",
  ],
  [
    "Chuyên viên Phân tích Tài chính",
    "Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận (PNJ)",
    "pnj",
    "14 – 22 triệu/tháng",
    "2 – 4 năm",
    "Tài chính – Kế toán",
    "full-time",
  ],
  [
    "Thực tập sinh Phân tích Dữ liệu",
    "Grab Việt Nam",
    "grab",
    "6 – 8 triệu/tháng",
    "Sinh viên năm cuối",
    "Công nghệ thông tin",
    "intern",
  ],
  [
    "Trợ lý Kiểm toán",
    "KPMG Việt Nam",
    "kpmg",
    "Thỏa thuận",
    "0 – 1 năm",
    "Tài chính – Kế toán",
    "full-time",
  ],
  [
    "Chuyên viên Kinh doanh",
    "Công ty Cổ phần FPT",
    "fpt",
    "10 – 20 triệu/tháng",
    "0 – 2 năm",
    "Kinh doanh",
    "full-time",
  ],
  [
    "Nhân viên Thiết kế Sáng tạo",
    "Công ty Cổ phần VNG",
    "vng",
    "Thỏa thuận",
    "1 – 2 năm",
    "Thiết kế",
    "part-time",
  ],
  [
    "Trợ giảng tiếng Anh",
    "Cộng đồng Alumni Văn Lang",
    "vlu",
    "Thỏa thuận",
    "Không yêu cầu",
    "Giáo dục",
    "part-time",
  ],
] as const;

export const previewJobs: CareerListing[] = samples.map(
  (
    [title, company, brand, salary, experience, category, employment],
    index,
  ) => ({
    id: `preview-${index + 1}`,
    title,
    company,
    brand,
    salary,
    experience,
    category,
    employment,
    location: "TP. Hồ Chí Minh",
    mode: "onsite",
    published_at: null,
    closed_at: null,
    demo: true,
    description: `Vị trí minh họa giao diện: ${title}.\n\nCông việc: phối hợp cùng đội ngũ chuyên môn, triển khai các dự án và đóng góp ý tưởng cải tiến.\n\nYêu cầu: kiến thức phù hợp với vị trí, tinh thần chủ động và khả năng làm việc nhóm.\n\nĐây là nội dung demo, không phải thông báo tuyển dụng của ${company}.`,
  }),
);

export const industries = [
  ["Kinh doanh", "chart"],
  ["Marketing", "megaphone"],
  ["Công nghệ thông tin", "monitor"],
  ["Tài chính – Kế toán", "coins"],
  ["Giáo dục", "cap"],
  ["Thiết kế", "pen"],
  ["Kỹ thuật", "gear"],
  ["Khác", "grid"],
] as const;

export const normalizeCareerText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

// Chỉ suy ra nhãn hiển thị; không tự đặt mức lương/kinh nghiệm cho tin thật.
export function jobCategory(job: CareerListing) {
  if (job.category) return job.category;
  const text = normalizeCareerText(`${job.title} ${job.description}`);
  const keywords = [
    ["kinh doanh|sales", "Kinh doanh"],
    ["marketing|truyen thong", "Marketing"],
    ["lap trinh|developer|front.end|cong nghe|du lieu", "Công nghệ thông tin"],
    ["tai chinh|ke toan|kiem toan", "Tài chính – Kế toán"],
    ["giao duc|giao vien|tro giang", "Giáo dục"],
    ["thiet ke|design", "Thiết kế"],
    ["ky thuat|engineer", "Kỹ thuật"],
  ];
  return (
    keywords.find(([pattern]) => new RegExp(pattern).test(text))?.[1] ?? "Khác"
  );
}

export function jobEmployment(job: CareerListing) {
  if (job.employment) return job.employment;
  const title = normalizeCareerText(job.title);
  return /thuc tap|intern/.test(title)
    ? "intern"
    : /ban thoi gian|part.time/.test(title)
      ? "part-time"
      : "full-time";
}
