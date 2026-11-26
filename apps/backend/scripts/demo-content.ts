import { readFileSync } from "node:fs";
import type { Pool } from "pg";

const news = [
  [
    "ket-noi-the-he",
    "Ngày hội kết nối các thế hệ cựu sinh viên Văn Lang",
    "Gặp lại bạn học, chia sẻ hành trình nghề nghiệp và cùng xây dựng mạng lưới Alumni.",
  ],
  [
    "doanh-nghiep-dong-hanh",
    "Doanh nghiệp đồng hành cùng cộng đồng Alumni",
    "Không gian trao đổi giữa cựu sinh viên, nhà tuyển dụng và các đơn vị đào tạo.",
  ],
  [
    "hanh-trinh-khoi-nghiep",
    "Hành trình khởi nghiệp từ giảng đường",
    "Những câu chuyện minh họa về bước đầu xây dựng sản phẩm, tìm cộng sự và phát triển đội ngũ.",
  ],
  [
    "hoi-thao-chuyen-doi-so",
    "Hội thảo chuyển đổi số trong công việc",
    "Cựu sinh viên cùng tìm hiểu cách ứng dụng công nghệ trong hoạt động của doanh nghiệp.",
  ],
  [
    "the-thao-ket-noi",
    "Kết nối cộng đồng qua hoạt động thể thao",
    "Tinh thần đồng đội được tiếp nối qua những buổi giao lưu của các khoa và khóa học.",
  ],
  [
    "mentor-dong-hanh",
    "Mentor đồng hành cùng sinh viên năm cuối",
    "Chương trình minh họa kết nối kinh nghiệm thực tế với định hướng học tập và việc làm.",
  ],
  [
    "cau-chuyen-nghe-nghiep",
    "Câu chuyện nghề nghiệp: từ trải nghiệm đến lựa chọn",
    "Các góc nhìn về kỹ năng, cơ hội và những thay đổi trên hành trình phát triển nghề nghiệp.",
  ],
  [
    "tro-ve-van-lang",
    "Trở về Văn Lang: gặp lại thầy cô và bạn bè",
    "Một dịp lưu giữ kỷ niệm và chia sẻ những dấu mốc mới sau ngày tốt nghiệp.",
  ],
  [
    "hoc-tap-suot-doi",
    "Học tập suốt đời cùng cộng đồng cựu sinh viên",
    "Những hoạt động trao đổi kiến thức và mở rộng kỹ năng dành cho cộng đồng Alumni.",
  ],
  [
    "hop-tac-quoc-te",
    "Mở rộng kết nối và hợp tác quốc tế",
    "Góc nhìn minh họa về giao lưu, chia sẻ chuyên môn và xây dựng quan hệ hợp tác.",
  ],
  [
    "tinh-nguyen-cong-dong",
    "Cùng cựu sinh viên lan tỏa hoạt động cộng đồng",
    "Những ý tưởng kết nối nguồn lực và đóng góp cho các hoạt động xã hội.",
  ],
  [
    "thiet-ke-sang-tao",
    "Không gian sáng tạo của cựu sinh viên",
    "Các nhóm Alumni chia sẻ dự án và trải nghiệm làm việc trong lĩnh vực thiết kế.",
  ],
  [
    "ky-nang-phong-van",
    "Chuẩn bị cho buổi phỏng vấn đầu tiên",
    "Buổi chia sẻ minh họa về hồ sơ ứng tuyển, cách trình bày kinh nghiệm và trao đổi với nhà tuyển dụng.",
  ],
  [
    "cau-lac-bo-alumni",
    "Câu lạc bộ Alumni: kết nối theo sở thích",
    "Các hoạt động giao lưu giúp thành viên tìm được những người bạn có chung mối quan tâm.",
  ],
  [
    "chia-se-chuyen-mon",
    "Chia sẻ chuyên môn giữa các thế hệ",
    "Những buổi trò chuyện quy mô nhỏ dành cho người muốn học hỏi kinh nghiệm từ cộng đồng.",
  ],
  [
    "ban-tin-thang",
    "Bản tin Alumni: những hoạt động đáng chú ý",
    "Tổng hợp các chủ đề kết nối, học tập, nghề nghiệp và giao lưu trong bộ dữ liệu demo.",
  ],
] as const;

const events = [
  ["ngay-hoi-alumni", "Ngày hội Alumni: kết nối và trở về", 2],
  ["hoi-thao-nghe-nghiep", "Hội thảo định hướng nghề nghiệp", 3],
  ["sports-carnival", "VLU Alumni Sports Carnival", 4],
  ["mentor-meetup", "Mentor Meetup: đồng hành cùng thế hệ mới", 5],
  ["hoi-nghi-doanh-nghiep", "Hội nghị kết nối doanh nghiệp Alumni", 6],
  ["workshop-khoi-nghiep", "Workshop xây dựng ý tưởng khởi nghiệp", 8],
  ["seminar-cong-nghe", "Seminar công nghệ và chuyển đổi số", 10],
  ["giao-luu-sang-tao", "Giao lưu cộng đồng sáng tạo", 14],
  ["hoi-thao-ky-nang", "Hội thảo kỹ năng giao tiếp trong công việc", 18],
  ["ket-noi-lien-khoa", "Gặp gỡ Alumni liên khoa — đã đóng đăng ký", 22],
  ["ngay-hoi-viec-lam", "Ngày hội việc làm và cơ hội hợp tác", 35],
  ["ky-niem-tro-ve", "Nhìn lại buổi gặp mặt cựu sinh viên", -2],
] as const;

const images = [
  "illustrations/alumni-community.jpg",
  "illustrations/alumni-speaker.jpg",
  "illustrations/alumni-sports.jpg",
  "illustrations/career-office.jpg",
];
const notice =
  "Dữ liệu demo local, không phải thông báo chính thức của Nhà trường.";

export async function seedDemoContent(pool: Pool, now = new Date()) {
  const artwork = images.map((image) => ({
    type: "image/jpeg",
    data: readFileSync(`apps/frontend/public/assets/${image}`).toString(
      "base64",
    ),
  }));
  const document = (index: number, title: string) =>
    JSON.stringify({
      hero: artwork[index % artwork.length],
      content: {
        imageAlt: `Ảnh minh họa: ${title}`,
        linkLabel: "Website Văn Lang",
        linkUrl: "https://www.vlu.edu.vn/",
      },
    });
  const client = await pool.connect();
  const added = { news: 0, events: 0 };
  try {
    await client.query("BEGIN");
    // Khóa cùng bộ demo khi hai người chạy seed đồng thời; không UPDATE dữ liệu cũ.
    await client.query("SELECT pg_advisory_xact_lock(741926)");
    for (const [index, [slug, title, summary]] of news.entries()) {
      const body = [
        notice,
        summary,
        "Điểm nhấn chương trình\nCộng đồng cùng trao đổi trải nghiệm, lắng nghe câu chuyện của khách mời và tìm kiếm cơ hội hợp tác phù hợp.",
        "Kết nối sau chương trình\nNgười tham dự có thể tiếp tục theo dõi các hoạt động, chia sẻ ý tưởng và đề xuất chủ đề cho những buổi gặp tiếp theo.",
        "Thông tin dành cho bạn\nBài viết có nội dung dài, ảnh minh họa và liên kết để xem đầy đủ bố cục trang chi tiết, tin gần đây và điều hướng trở về danh sách. Nội dung mẫu có thể chỉnh sửa hoặc gỡ trong Quản trị tin tức.",
      ].join("\n\n");
      const result = await client.query(
        `INSERT INTO public.news_articles (slug,title,summary,body,cover,published_at,draft,published,revision)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$7::jsonb,1) ON CONFLICT (slug) DO NOTHING`,
        [
          `demo-news-${slug}`,
          `[Demo] ${title}`,
          summary,
          body,
          index % 2 ? "event" : "community",
          new Date(now.getTime() - index * 86_400_000),
          document(index, title),
        ],
      );
      added.news += result.rowCount ?? 0;
    }
    for (const [index, [slug, title, days]] of events.entries()) {
      const startsAt = new Date(now.getTime() + days * 86_400_000);
      startsAt.setUTCHours(2, 0, 0, 0); // 09:00 theo giờ Việt Nam.
      const description = [
        notice,
        title,
        "NỘI DUNG CHƯƠNG TRÌNH\n09:00 — Đón tiếp và kết nối thành viên.\n09:30 — Chia sẻ từ khách mời.\n10:30 — Thảo luận và giao lưu.\n11:30 — Tổng kết, chụp ảnh lưu niệm.",
        "ĐỐI TƯỢNG THAM DỰ\nCựu sinh viên có thẻ Alumni và khách đi cùng trong giới hạn của sự kiện. Dùng tài khoản thử nghiệm để xem hộp thoại đăng ký.",
        "LƯU Ý\nThời gian và địa điểm là dữ liệu minh họa. Đây là sự kiện demo để kiểm tra bố cục, lịch sự kiện, tìm kiếm và các trạng thái đăng ký.",
      ].join("\n\n");
      const result = await client.query(
        `INSERT INTO public.events (slug,title,description,location,starts_at,capacity,guest_limit,published_at,registration_closed_at,draft,published,revision)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$10::jsonb,1) ON CONFLICT (slug) DO NOTHING`,
        [
          `demo-event-${slug}`,
          `[Demo] ${title}`,
          description,
          index % 2
            ? "Hội trường Văn Lang · Demo"
            : "Cơ sở chính Văn Lang · Demo",
          startsAt,
          100 + index * 25,
          (index % 3) + 1,
          now,
          index === 9 ? now : null,
          document(index + 1, title),
        ],
      );
      added.events += result.rowCount ?? 0;
    }
    await client.query("COMMIT");
    return added;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
