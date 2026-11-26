# Alumni Hub

Cổng cựu sinh viên Văn Lang và khu quản trị dùng chung frontend Next.js. Backend Node.js cung cấp API và lưu dữ liệu trong PostgreSQL. Module sự kiện kiểm chứng luồng từ tạo bản nháp đến đăng ký tham dự.

[Sơ đồ trang, quy tắc giao diện VGG và cấu hình SEO](docs/WEBSITE.md).

[Hướng dẫn thay ảnh, logo, banner và các thẻ nghề nghiệp](docs/THAY-ANH.md).

[Giao diện Việc làm: chức năng, tin minh họa và nơi chỉnh nội dung](docs/CAREER-DESIGN.md).

[Cây thư mục và nguyên tắc dọn file](docs/PROJECT-STRUCTURE.md) · [Bộ nội dung demo Tin tức và Sự kiện](docs/DEMO.md).

## Kiểm tra toàn bộ chức năng an toàn

Mở Docker Desktop rồi chạy `npm.cmd run check` (macOS/Linux dùng `npm run check`). Lệnh chạy lint, typecheck, test, build, audit và toàn bộ smoke test, gồm CMS ảnh/link và SEO. PostgreSQL thử dùng bộ nhớ tạm, cổng và mật khẩu riêng; không đọc `.env`, không ghi vào database đang dùng. Migration và seed được chạy hai lần để kiểm tra tính lặp lại. Sau khi kiểm tra, lệnh dừng stack thử và xóa database tạm.

[Kết quả rà soát chức năng ngày 26/11/2026](docs/FUNCTIONAL-CHECK-2026-11-26.md).

## Chạy local

Mở Docker Desktop. Trong VS Code, dùng hai Terminal tại thư mục `alumni-hub`.

- Terminal thứ nhất chạy `npm run dev`, mở website ở http://localhost:8080.
- Khi Terminal thứ nhất đã sẵn sàng, Terminal thứ hai chạy `npm run admin`, mở Quản trị ở http://localhost:8082/admin.

Trên PowerShell có thể dùng `npm.cmd`. Hai giao diện dùng chung backend và PostgreSQL. Giữ Terminal website chạy trong khi dùng Admin. Cổng website, backend và Admin lần lượt lấy từ `HTTP_PORT`, `BACKEND_PORT`, `ADMIN_PORT` trong `.env`. Nếu cổng đã có phiên preview cũ, dừng phiên đó trước. Admin có thư mục build dev riêng để hai phiên Next.js chạy đồng thời.

Cài Node.js 24, npm 11 và Docker có Compose. Từ thư mục `alumni-hub/`, mở Docker Desktop rồi chạy:

```powershell
npm.cmd run setup
npm.cmd run local:accounts
npm.cmd run dev
```

Trên macOS/Linux dùng `npm` thay cho `npm.cmd`. Setup cài dependency theo một lockfile và chỉ tạo `.env` khi chưa có. `local:accounts` tạo các mật khẩu ngẫu nhiên cho Admin Alumni, CSV thử nghiệm và người duyệt của Trường trong `.env`. Kiểm tra `LOCAL_AUTH_ENABLED=true` nếu trước đó bạn đã đặt biến này là `false`. Xem mật khẩu trực tiếp trong tệp local và giữ tệp ngoài Git.

| Đường dẫn | Công dụng |
| --- | --- |
| [localhost:8080](http://localhost:8080/) | Trang chủ |
| [localhost:8080/events](http://localhost:8080/events) | Sự kiện đã xuất bản |
| [localhost:8080/news](http://localhost:8080/news) | Tin tức đã công bố |
| [localhost:8080/career](http://localhost:8080/career) | Hồ sơ nghề nghiệp, tìm việc, kho CV, tuyển dụng và lịch sử ứng tuyển |
| [localhost:8080/community](http://localhost:8080/community) | Bảng tin, Gắn kết, đề cử Đại sứ và hợp tác |
| [localhost:8080/admin/community](http://localhost:8080/admin/community) | Xét duyệt vai trò, kiểm duyệt bài và xử lý đề xuất hợp tác |
| [localhost:8080/admin/news](http://localhost:8080/admin/news) | Soạn, sửa, công bố và gỡ tin |
| [localhost:8080/admin/events](http://localhost:8080/admin/events) | Quản trị sự kiện |
| [localhost:8080/admin/login](http://localhost:8080/admin/login) | Đăng nhập quản trị viên và người duyệt của Trường |
| [localhost:8080/account](http://localhost:8080/account) | Đăng ký, đăng nhập, theo dõi hồ sơ và xem thẻ Alumni |
| [localhost:8080/admin/applications](http://localhost:8080/admin/applications) | Xét duyệt hồ sơ và cấp thẻ |
| [localhost:8081/health](http://localhost:8081/health) | Phiên bản và trạng thái tiến trình backend |
| [localhost:8081/ready](http://localhost:8081/ready) | Kết nối PostgreSQL và trạng thái migration |

Dev chạy riêng Next.js và backend có chế độ tự nạp lại mã. PostgreSQL chạy trong Compose. Dừng phiên dev cũ nếu đang giữ cổng 8080. Để chạy cả ba dịch vụ bằng Docker, dừng `npm run dev` rồi dùng:

```powershell
docker compose up --build --wait
npm.cmd run db:seed
docker compose down
```

`db:seed` tùy chọn và chạy lại an toàn. `docker compose down` giữ volume PostgreSQL. Có thể đổi `HTTP_PORT` và `BACKEND_PORT` trong `.env`. Nếu đổi cổng DB, cập nhật cả `DEV_DB_PORT` và cổng của `DATABASE_URL`. Trong Compose, backend và migration dùng dịch vụ `db` nội bộ.

## Website và khu Quản trị

`npm.cmd run dev` khởi động cả website và khu Quản trị trong cùng ứng dụng. Mở [website](http://localhost:8080/) và [Quản trị Alumni Hub](http://localhost:8080/admin) ở hai tab. Các chức năng CMS nằm trong mục **Nội dung website** của khu Quản trị. Đăng nhập quản trị tại [Cổng Quản trị](http://localhost:8080/admin/login) với tên `admin` và mật khẩu `LOCAL_ADMIN_PASSWORD`. Người duyệt dùng tên `reviewer` và `LOCAL_REVIEWER_PASSWORD`. Cựu sinh viên đăng nhập bằng email tại [Tài khoản Alumni](http://localhost:8080/account).

Trong CMS, vào [Nội dung và ảnh trang chủ](http://localhost:8080/admin/homepage). Chỉnh tiêu đề, mô tả hoặc chọn ảnh JPG, PNG hay WebP tối đa 2 MB cho banner và thẻ sự kiện. Chọn **Lưu bản nháp** để lưu nội dung và tải ảnh. Chọn **Công bố** rồi mở lại trang chủ để xem phiên bản mới. Bản nháp và bản công bố cùng được lưu trong PostgreSQL.

CMS dẫn tới các màn quản trị Tin tức, Sự kiện, Hồ sơ, Cộng đồng và Ưu đãi/Thư viện hiện có. Trang chủ giữ bố cục và liên kết nghiệp vụ trong mã nguồn.

Trong [CMS → Nội dung các trang](http://localhost:8080/admin), chọn Tin tức, Sự kiện, Career Hub, Cộng đồng, Ưu đãi và Thư viện hoặc Giới thiệu thẻ Alumni. Mỗi trang có bản nháp và bản công bố riêng cho tiêu đề, phần giới thiệu, ảnh, mô tả ảnh và một nút liên kết. Link nhận đường dẫn nội bộ hoặc địa chỉ HTTP/HTTPS. Có thể gỡ ảnh trong bản nháp hoặc để trống cả chữ và địa chỉ link để bỏ nút, rồi bấm **Công bố**.

Nội dung từng tin bài, sự kiện, đề xuất cộng đồng và chính sách ưu đãi tiếp tục được quản lý trong các màn nghiệp vụ tương ứng.

Chỉ đặt `SMOKE_HOMEPAGE=1` khi chạy smoke test trên cơ sở dữ liệu dùng một lần, vì ca thử sẽ công bố tiêu đề và ảnh giả lập.

## Thử luồng sự kiện

1. Tại **Đăng nhập quản trị**, nhập `admin` và dùng `LOCAL_ADMIN_PASSWORD`.
2. Tại **Quản trị → Sự kiện**, tạo bản nháp, đặt sức chứa và số người đi cùng tối đa cho mỗi CSV. Mở **Chỉnh nội dung, ảnh và link sự kiện** để biên tập rồi chọn **Công bố**. Giới hạn mặc định là 0 và tối đa bằng sức chứa trừ một.
3. Ở tab khác, mở [Tài khoản cựu sinh viên local](http://localhost:8080/account?view=local) và dùng `LOCAL_ALUMNI_PASSWORD`. Mở chi tiết sự kiện và nhập số người đi cùng nếu sự kiện cho phép. Hệ thống chỉ thu số lượng. Tổng dự gồm người đăng ký và người đi cùng.
4. Trên chi tiết sự kiện, chọn **Hủy đăng ký** nếu còn ít nhất 24 giờ. Hệ thống trả lại toàn bộ chỗ của nhóm. CSV có thể đăng ký lại cho bản thân khi còn ít nhất 12 giờ, còn chỗ và Admin chưa đóng đăng ký.
5. Vẫn đăng ký được tại đúng mốc 12 giờ và hủy được tại đúng mốc 24 giờ. Nếu gọi API đăng ký lần nữa khi vẫn có một lượt và dữ liệu hợp lệ, backend trả HTTP 409.

Migration 009 đặt giới hạn mặc định 0 cho các sự kiện hiện có và giữ các lượt đã đăng ký. Giới hạn mới áp dụng cho lượt đăng ký sau khi lưu cấu hình.
Migration 010 bắt đầu lưu dấu hủy theo tài khoản và sự kiện. Các lượt đã hủy trước migration này không có dữ liệu để khôi phục dấu hủy.

### Bàn giao danh sách tạo vé

Admin mở **Quản trị → Sự kiện → Danh sách đăng ký** rồi chọn **Xuất Excel**. File `.xlsx` chứa các lượt đăng ký còn hiệu lực tại thời điểm xuất, kèm thông tin sự kiện, họ tên, mã Alumni, email đăng ký, thời điểm đăng ký, số người đi cùng và tổng số người. Giờ trong file dùng múi giờ Việt Nam. Tài khoản giả lập local không có địa chỉ email.

Admin chuyển file cho bộ phận tạo vé theo kênh nội bộ. Bộ phận tạo vé tạo QR và gửi đến email đăng ký bằng hệ thống ngoài. Nếu có thay đổi sau lần bàn giao, Admin xuất lại danh sách để bộ phận tạo vé đối chiếu.

## Thử luồng cấp thẻ Alumni

1. Trên trang **Tài khoản**, gửi hồ sơ với dữ liệu giả lập và đăng nhập bằng email vừa đăng ký. Mục **Thẻ của tôi** hiển thị **Chờ duyệt**. Tài khoản đang chờ chưa có quyền đăng ký sự kiện.
2. Ở tab khác trong cùng trình duyệt, mở **Đăng nhập quản trị** và đăng nhập bằng `admin` với mật khẩu đã cấp cho môi trường tương ứng. Vào **Xét duyệt hồ sơ Alumni** để xem hồ sơ. Với hồ sơ chỉ có CCCD, Admin đối chiếu ngoài hệ thống, rồi tích xác nhận đã xác minh tốt nghiệp và bấm **Duyệt và cấp thẻ**.
3. Tải lại trang tài khoản CSV. Mã có dạng `ALN ddmmyy 000001`, với ngày cấp theo giờ Việt Nam và sáu số cuối tăng toàn hệ thống. Duyệt lại cùng hồ sơ trả về thẻ đã cấp.

Đăng ký bằng email và xử lý hồ sơ bật trên dev và staging. Hai cổng có cookie và phiên độc lập. Phiên hết hạn sau 8 giờ hoặc khi backend khởi động lại. Tài khoản mẫu trên dev cần `LOCAL_AUTH_ENABLED=true`. Cấu hình bản cho khách hàng kiểm thử được mô tả trong [hướng dẫn môi trường](docs/ENVIRONMENTS.md).

## Giao diện đăng nhập và đăng ký

Mở `/account` để đăng nhập, `/account?view=register` để đăng ký. Đăng ký gồm hai bước: thông tin cá nhân, sau đó khoa, khóa học, email và mật khẩu. Email tiếp tục là tên đăng nhập của hệ thống. Chuyển giữa hai form hoặc quay lại bước trước giữ dữ liệu đang nhập.

Hiệu ứng mảng đỏ chéo và các ô nhập được viết bằng CSS trong `apps/frontend/app/(public)/account/account.css`; chỉnh nhịp bằng các biến `--auth-*` trong `.auth-stage`. Trên điện thoại, mảng đỏ chuyển lên đầu để đủ chỗ cho form. Thiết lập giảm chuyển động của thiết bị sẽ tắt hiệu ứng. Logo dùng chung tại `apps/frontend/public/assets/van-lang-logo.png`.

Migration `014_alumni_cohort.sql` thêm khóa học, giữ hồ sơ cũ với giá trị trống. Lệnh `npm.cmd run dev` áp dụng migration khi khởi động; môi trường triển khai cần chạy migration trước khi dùng phiên bản mới.

Nếu thêm migration khi phiên dev cũ vẫn đang chạy, khởi động lại `npm.cmd run dev` hoặc chạy `node --env-file=.env apps/backend/scripts/migrate.ts` trước khi thử form mới. `/ready` phải trả 200; lệnh seed chỉ thêm dữ liệu mẫu, không thay thế bước migration.

## Thử khôi phục mật khẩu

1. Tạo tài khoản CSV bằng email giả lập. Tại trang **Tài khoản**, chọn **Quên mật khẩu?**, nhập email và gửi yêu cầu.
2. Đăng nhập Admin ở cửa sổ riêng. Tại **Quản trị Ưu đãi và Thư viện**, tra email ở mục **Hộp thư giả lập local**.
3. Nhập mã gồm 6 số và mật khẩu mới. Mã dùng một lần, hết hạn sau 10 phút, có tối đa 5 lượt thử. Có thể yêu cầu mã mới sau 60 giây. Đổi mật khẩu thành công kết thúc các phiên cũ của tài khoản.

Hộp thư nằm trong bộ nhớ backend và chỉ dành cho kiểm thử local với tài khoản mẫu. Nếu khởi động lại backend, hãy yêu cầu mã mới sau thời gian chờ. SMTP của Trường sẽ được cấu hình ở đợt sau.

## Thử quản trị Ưu đãi và Thư viện

1. Admin Alumni đăng nhập bằng `LOCAL_ADMIN_PASSWORD`, vào [Quản trị Ưu đãi và Thư viện](http://localhost:8080/admin/services), lưu bản nháp rồi chọn **Gửi Trường duyệt**.
2. Người duyệt đăng nhập bằng `LOCAL_REVIEWER_PASSWORD`, xem nội dung và thời gian hiệu lực rồi chọn **Duyệt và công bố** hoặc **Trả về bản nháp**.
3. Kiểm tra [trang công khai](http://localhost:8080/services). Nội dung có hiệu lực từ mốc bắt đầu và ẩn từ mốc kết thúc hoặc khi người duyệt gỡ. Để sửa nội dung đã công bố, người duyệt gỡ trước, Admin sửa rồi gửi duyệt lại.

## Thử luồng Tin tức

Đăng nhập Admin local và mở **Quản trị tin tức**. Tạo bản nháp rồi mở **Chỉnh nội dung, ảnh và link bài tin** ở từng bài. Có thể sửa tiêu đề, tóm tắt, nội dung, tải ảnh JPG/PNG/WebP tối đa 2 MB và thêm link. Chọn **Lưu bản nháp** rồi **Công bố**. Với bài đã công bố, website tiếp tục hiển thị bản cũ trong lúc biên tập. **Gỡ công bố** ẩn bài và ảnh trên website.

Màn biên tập sự kiện dùng cùng quy trình cho tiêu đề, mô tả, ảnh và link. Thời gian, địa điểm, sức chứa và đóng đăng ký được xử lý ở form cấu hình sự kiện. Khi gỡ ảnh tải lên của bài tin rồi công bố, ảnh minh họa chọn lúc tạo bài sẽ hiện lại nếu có.

Để nạp bộ demo gồm 16 bài tin và 12 sự kiện mới sau khi chạy migration, dùng `npm.cmd run db:seed` với stack Compose hoặc `npm.cmd run demo:seed` khi chạy `npm.cmd run dev`. Hai mẫu cũ vẫn được giữ. Seed chỉ chạy ở môi trường dev, chỉ thêm bản ghi chưa có; giữ nội dung, trạng thái và ảnh đã được Admin chỉnh sửa trên lần chạy sau. Xem [các màn demo](docs/DEMO.md).

## Thử Career Hub

Dùng hai tài khoản CSV giả lập đã được Admin cấp thẻ. Một tài khoản tạo và công bố tin ở tab **Tuyển dụng**. Tài khoản còn lại lưu hồ sơ nghề nghiệp, chọn PDF từ **Kho CV**, mở tin trong **Tìm việc** và nộp hồ sơ. Xem lại bản đã nộp trong **Lịch sử ứng tuyển**.

Kho lưu riêng tư tối đa 5 PDF, mỗi tệp tối đa 5 MB trong PostgreSQL. Bản đã nộp là bản chụp giữ nguyên khi người dùng đổi tên, thay hoặc xóa CV gốc. Chỉ ứng viên và chủ tin tải được bản đã nộp. CSV có tin đang tuyển mới xem được hồ sơ rút gọn của ứng viên đang bật Tìm việc. Hồ sơ rút gọn không gồm ngày sinh, email, số điện thoại hay CV. Ver01 chỉ ghi trạng thái đã nộp.

## Thử luồng Cộng đồng

Dùng CSV đã được cấp thẻ để gửi bài, đề nghị Gắn kết, đề cử một CSV khác bằng mã Alumni hoặc gửi đề xuất hợp tác. Vai trò yêu cầu lý do và liên kết minh chứng HTTPS. Admin Alumni dùng **Quản trị cộng đồng** để xét thủ công, duyệt và ẩn/hiện bài, hoặc ghi nhận chuyển đề xuất và kết thúc xử lý.

Bảng tin hiển thị cho CSV có thẻ. Bài mới chờ kiểm duyệt. Người gửi và Admin xem được đề xuất hợp tác. Thao tác chuyển ghi nhận đơn vị xử lý trong hệ thống. Việc trao đổi với đơn vị tiếp nhận do Admin thực hiện qua kênh công tác hiện có.

Nếu có nhiều vai trò còn hiệu lực, thẻ hiển thị theo thứ tự Đại sứ, Gắn kết, Thành viên. Kết thúc vai trò chỉ đổi hạng hiển thị, mã Alumni của chủ thẻ được giữ nguyên.

## Cấu trúc npm workspaces

```text
alumni-hub/
├── apps/
│   ├── backend/            # HTTP API, nghiệp vụ, kết nối PostgreSQL và kiểm thử
│   └── frontend/           # Next.js App Router, React và tài nguyên giao diện
│       ├── app/(public)/   # Layout công khai, trang nội dung và tài khoản CSV
│       ├── app/admin/      # Layout và nghiệp vụ quản trị
│       ├── app/components/ # Thành phần giao diện dùng chung
│       └── app/api/        # API cùng origin chuyển tiếp tới backend
├── db/migrations/          # SQL theo thứ tự, giữ nguyên migration đã áp dụng
├── scripts/                # Setup, dev, Git hook và smoke test
├── deploy/                 # Compose triển khai, rollback và backup
└── .github/workflows/      # Kiểm tra, đóng gói và phát hành
```

Trình duyệt → Next.js → API Node.js → PostgreSQL. Trình duyệt gọi `/api/*` cùng origin. Next.js gọi backend bằng `BACKEND_URL` phía máy chủ. Reverse proxy hiện tại vẫn đảm nhiệm HTTPS và chuyển tiếp đến cổng frontend.

## Kiểm tra

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:smoke
```

Smoke test yêu cầu stack local đang chạy và đã bật tài khoản thử nghiệm. Dùng database dev dành cho kiểm thử vì lệnh tạo sự kiện và lượt đăng ký mẫu. CI chạy smoke qua Next.js và PostgreSQL thật, sau đó dọn stack dùng một lần. Một release image chứa hai workspace và được dùng cho hai container riêng, để frontend và backend luôn đi cùng digest.

- [Kiến trúc](docs/ARCHITECTURE.md)
- [Kế hoạch triển khai ver01 theo danh sách chức năng](docs/VER01-PLAN.md)
- [Kết quả rà soát 56 mục nghiệm thu ver01](docs/VER01-AC-AUDIT.md)
- [Triển khai](docs/DEPLOYMENT.md) và [Rollback](docs/ROLLBACK.md)
- [Vận hành](docs/RUNBOOK.md) và [Bàn giao](docs/HANDOVER.md)
