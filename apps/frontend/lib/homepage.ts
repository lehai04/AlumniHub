export const homepageFields = {
  heroEyebrow: [
    "Dòng giới thiệu đầu trang",
    "Cộng đồng cựu sinh viên Văn Lang",
  ],
  heroTitle: ["Tiêu đề đầu trang", "CỘNG ĐỒNG ALUMNI VLU"],
  heroDescription: [
    "Mô tả đầu trang",
    "Gặp lại bạn bè, kết nối doanh nghiệp và tận hưởng các dịch vụ dành riêng cho Cựu Sinh viên.",
  ],
  heroEvent: ["Nút khám phá", "Khám phá thêm"],
  heroCommunity: ["Nút cộng đồng", "Kết nối cộng đồng"],
  servicesTitle: ["Tiêu đề dịch vụ", "Dịch vụ cựu sinh viên"],
  vhubTitle: ["Tên dịch vụ VHub", "Thủ tục hành chính"],
  vhubDescription: ["Mô tả VHub", "Tra cứu và thực hiện thủ tục trên VHub."],
  studyTitle: ["Tên dịch vụ Sau đại học", "Sau đại học"],
  studyDescription: [
    "Mô tả Sau đại học",
    "Tìm hiểu chương trình và thông tin tuyển sinh.",
  ],
  libraryTitle: ["Tên dịch vụ thư viện", "Thư viện số"],
  libraryDescription: [
    "Mô tả thư viện",
    "Tra cứu tài liệu trên cổng thư viện Văn Lang.",
  ],
  benefitsTitle: ["Tên dịch vụ ưu đãi", "Ưu đãi Alumni"],
  benefitsDescription: [
    "Mô tả ưu đãi",
    "Xem thông tin ưu đãi và quyền thư viện.",
  ],
  eventSection: ["Tiêu đề mục sự kiện", "Sự kiện trong tuần"],
  eventTitle: ["Tiêu đề thẻ sự kiện", "Gặp lại cộng đồng Văn Lang"],
  eventDescription: [
    "Mô tả thẻ sự kiện",
    "Xem các sự kiện đã công bố và đăng ký tham dự bằng tài khoản cựu sinh viên.",
  ],
  eventLink: ["Nhãn mở sự kiện", "Xem sự kiện →"],
  eventAlt: ["Mô tả ảnh sự kiện", "Ảnh minh họa hoạt động kết nối"],
  careersSection: ["Tiêu đề mục nghề nghiệp", "Cơ hội nghề nghiệp"],
  careersTitle: ["Tiêu đề thẻ nghề nghiệp", "Việc làm mới nhất"],
  career1Title: ["Cơ hội 1 · tiêu đề", "Việc làm toàn thời gian"],
  career1Description: [
    "Cơ hội 1 · mô tả",
    "Khám phá cơ hội trong cộng đồng Alumni",
  ],
  career1Url: ["Cơ hội 1 · đường dẫn", "/career"],
  career2Title: ["Cơ hội 2 · tiêu đề", "Việc làm bán thời gian"],
  career2Description: ["Cơ hội 2 · mô tả", "Kết nối với nhà tuyển dụng"],
  career2Url: ["Cơ hội 2 · đường dẫn", "/career"],
  career3Title: ["Cơ hội 3 · tiêu đề", "Tuyển dụng nhân sự"],
  career3Description: [
    "Cơ hội 3 · mô tả",
    "Đăng cơ hội dành cho cựu sinh viên",
  ],
  career3Url: ["Cơ hội 3 · đường dẫn", "/career?tab=recruit"],
  career4Title: ["Cơ hội 4 · tiêu đề", "EJob Văn Lang"],
  career4Description: [
    "Cơ hội 4 · mô tả",
    "Tham khảo cổng việc làm của Nhà trường",
  ],
  career4Url: [
    "Cơ hội 4 · đường dẫn",
    "https://ejob.vlu.edu.vn/cong-dang-nhap",
  ],
  careersDescription: [
    "Mô tả nghề nghiệp",
    "Tra cứu cơ hội tuyển dụng tại cổng EJob của Văn Lang.",
  ],
  careersLink: ["Nhãn mở EJob", "Mở cổng EJob ↗"],
  communitySection: ["Tiêu đề mục cộng đồng", "Cộng đồng và hợp tác"],
  communityTitle: ["Tiêu đề bảng tin", "Bảng tin cộng đồng"],
  communityDescription: [
    "Mô tả bảng tin",
    "Giới thiệu bản thân và chia sẻ cơ hội với cựu sinh viên Văn Lang.",
  ],
  communityLink: ["Nhãn mở bảng tin", "Mở bảng tin"],
  partnerTitle: ["Tiêu đề hợp tác", "Hợp tác với khoa, trường"],
  partnerDescription: [
    "Mô tả hợp tác",
    "Gửi đề xuất hợp tác hoặc đặt hàng chuyên môn cho Admin Alumni tiếp nhận.",
  ],
  partnerLink: ["Nhãn gửi hợp tác", "Gửi đề xuất hợp tác"],
  cardTitle: ["Tiêu đề thẻ Alumni", "Thẻ Alumni"],
  cardDescription: [
    "Mô tả thẻ Alumni",
    "Xem thẻ của bạn, đề nghị Gắn kết hoặc đề cử Đại sứ.",
  ],
  cardLink: ["Nhãn mở tài khoản", "Mở tài khoản và thẻ"],
  cardAbout: ["Nhãn giới thiệu thẻ", "Giới thiệu thẻ Alumni"],
  privilegesTitle: [
    "Tiêu đề mục ưu đãi và thư viện",
    "Ưu đãi và quyền thư viện",
  ],
  privilegesLink: [
    "Nhãn mở thông tin ưu đãi và thư viện",
    "Xem ưu đãi và thông tin thư viện đang hiệu lực",
  ],
  privilegesDescription: [
    "Ghi chú ưu đãi và thư viện",
    "Nhà trường sẽ xác nhận chính sách ưu đãi và quyền sử dụng thư viện dành cho cựu sinh viên.",
  ],
} as const;

export type Homepage = {
  revision: number;
  content: Record<string, string>;
  hero: boolean;
  event: boolean;
  career1?: boolean;
  career2?: boolean;
  career3?: boolean;
  career4?: boolean;
};

export const careerSlots = [
  "career1",
  "career2",
  "career3",
  "career4",
] as const;
export type HomepageImage = "hero" | "event" | (typeof careerSlots)[number];

// Ảnh mặc định tập trung tại đây; ảnh Admin công bố sẽ được ưu tiên.
export const homepageImageDefaults: Record<HomepageImage, string> = {
  hero: "/assets/illustrations/alumni-sports.jpg",
  event: "/assets/illustrations/alumni-sports.jpg",
  career1: "/assets/illustrations/career-office.jpg",
  career2: "/assets/alumni-event.jpg",
  career3: "/assets/figma/news-banner.png",
  career4: "/assets/illustrations/alumni-community.jpg",
};

export function homepageImage(home: Homepage, slot: HomepageImage) {
  return home[slot]
    ? `/api/homepage/images/${slot}?v=${home.revision}`
    : homepageImageDefaults[slot];
}
