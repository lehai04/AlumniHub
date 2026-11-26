export const publicPages = {
  news: {
    label: "Tin tức",
    title: "Tin tức Alumni",
    description: "Cập nhật từ Nhà trường và cộng đồng cựu sinh viên Văn Lang.",
    image: "/assets/figma/news-banner.png",
  },
  events: {
    label: "Sự kiện",
    title: "Sự kiện cựu sinh viên",
    description: "Xem lịch hoạt động, địa điểm và tình trạng đăng ký.",
    image: "/assets/figma/events-banner.png",
  },
  career: {
    label: "Việc làm",
    title: "Career Hub",
    description:
      "Tìm việc, ứng tuyển và đăng tuyển trong cộng đồng cựu sinh viên.",
  },
  community: {
    label: "Cộng đồng",
    title: "Cộng đồng Alumni",
    description:
      "Chia sẻ cơ hội, tham gia các vai trò Alumni và kết nối với khoa, trường.",
  },
  services: {
    label: "Dịch vụ",
    title: "Ưu đãi và Thư viện",
    description:
      "Tra cứu ưu đãi Alumni và quyền sử dụng thư viện của Trường Đại học Văn Lang.",
  },
  "alumni-card": {
    label: "Thẻ Alumni",
    title: "Giới thiệu thẻ Alumni",
    description: "Thẻ điện tử dành cho cựu sinh viên Trường Đại học Văn Lang.",
  },
} as const;

export type PublicPage = keyof typeof publicPages;

export const publicNavigation = Object.entries(publicPages).map(
  ([page, { label }]) => ({ href: `/${page}`, label }),
);

export function isPublicPage(page: string): page is PublicPage {
  return Object.hasOwn(publicPages, page);
}

export function publicPageFields(page: PublicPage) {
  const { title, description } = publicPages[page];
  return {
    title: ["Tiêu đề trang", title],
    description: ["Nội dung giới thiệu", description],
    imageAlt: ["Mô tả ảnh", ""],
    linkLabel: ["Chữ hiển thị của link", ""],
    linkUrl: ["Địa chỉ link nội bộ hoặc HTTP/HTTPS", ""],
  } as const;
}
