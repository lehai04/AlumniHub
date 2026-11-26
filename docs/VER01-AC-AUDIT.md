# Rà soát tiêu chí nghiệm thu Alumni Hub ver01

Rà soát ngày 18/11/2026 theo `Báo cáo/Ds chức năng.xlsx`. Tệp nguồn có 38 mục Cựu sinh viên, 18 mục Admin và 8 điểm cần chốt. Các quyết định đã xác nhận trong quá trình triển khai được đối chiếu với AC gốc. Ví dụ, CSV có thẻ gửi đề cử Đại sứ, Admin xét duyệt.

**Tổng hợp sau khi bổ sung Sự kiện**. 41 đạt, 11 một phần, 0 chưa có, 4 chờ chốt. Phạm vi đạt trong bảng là local.

**Cách đọc**. **Đạt** nghĩa là phần AC trong phạm vi local có mã thực thi và bằng chứng kiểm tra hoặc đối chiếu nêu tại dòng. **Một phần** nghĩa là còn AC thiếu hoặc quy tắc chưa chốt ảnh hưởng kết quả. **Chưa có** nghĩa là chưa có chức năng tương ứng. **Chờ chốt** nghĩa là còn thiếu quyết định hoặc nội dung đã duyệt để nghiệm thu. Các nhận định về tài khoản, hồ sơ, CV và Admin áp dụng cho local với dữ liệu giả lập.

## Cựu sinh viên và khách · 38 mục

| Mã | Kết quả | Bằng chứng và phần còn lại |
| --- | --- | --- |
| FR-001 | Đạt | Đăng ký với trường bắt buộc, nút Đăng ký và lối vào Đăng nhập. Backend kiểm tra định dạng, từ chối số điện thoại sai và lưu hồ sơ Chờ duyệt. |
| FR-002 | Một phần | Xem Chờ duyệt và Đã duyệt. Còn thiếu thời gian dự kiến, từ chối qua email và đăng ký lại. |
| FR-003 | Đạt | Email/mật khẩu hợp lệ mở đúng phiên. Sai mật khẩu bị từ chối. Tài khoản chờ duyệt xem được hồ sơ của mình và bị chặn khi gọi thao tác của CSV đã duyệt. |
| FR-004 | Một phần | Local có mã 6 số qua hộp thư giả lập, dùng một lần, hết hạn sau 10 phút, giới hạn thử và hủy phiên cũ khi đổi mật khẩu. Chờ cấu hình và nghiệm thu gửi mail qua SMTP của Trường. |
| FR-005 | Một phần | Gửi lại đồng thời vẫn chỉ có một tài khoản và một hồ sơ. Local giới hạn gửi lại mã và chỉ một yêu cầu đồng thời dùng mã thành công. Việc sử dụng email thật phụ thuộc FR-004. |
| FR-010 | Đạt | Tài khoản mở thẻ của mình với họ tên, mã và hạng. |
| FR-011 | Đạt | Chờ duyệt chưa có thẻ. API chỉ trả dữ liệu của phiên đang dùng. |
| FR-014 | Đạt | Khách, tài khoản chờ duyệt và CSV đã cấp thẻ đều đọc được tin công bố. Tin nháp hoặc đã gỡ trả 404. |
| FR-017 | Đạt | Ba nhóm người dùng xem sự kiện công bố, trạng thái và số người đăng ký. Khách có lối đăng ký/đăng nhập. Hồ sơ chờ duyệt được giải thích lý do và backend từ chối đăng ký. |
| FR-020 | Một phần | CSV đăng ký lần đầu theo giới hạn người đi cùng, được đăng ký tại đúng mốc 12 giờ và hủy tại đúng mốc 24 giờ. Hủy trả toàn bộ chỗ, đăng ký lại chỉ cho bản thân. Alumni Hub bàn giao qua danh sách Excel. Bộ phận tạo vé tạo QR và gửi đến email đăng ký bằng hệ thống ngoài theo luồng đã chốt. Khâu gửi và xác thực QR cần nghiệm thu với bộ phận tạo vé. |
| FR-022 | Đạt | Có hồ sơ riêng với các trường theo AC, lưu và xem lại. Kho CV dùng giới hạn đã chốt ở CV-01. |
| FR-023 | Đạt | Tìm việc mặc định tắt. Bật mới xuất hiện cho người có tin đang tuyển. Tắt thì biến mất. |
| FR-024 | Đạt | CSV có thẻ tạo, lưu và công bố tin hợp lệ. |
| FR-025 | Đạt | Backend chặn tài khoản chưa được cấp thẻ gọi trực tiếp nghiệp vụ tuyển dụng. |
| FR-026 | Đạt | Danh sách chỉ chứa tin công bố. Từ khóa, địa điểm và hình thức lọc được. Chi tiết mở đúng tin. |
| FR-027 | Đạt | Chọn CV thuộc kho cá nhân. Bản hồ sơ đã nộp giữ nguyên sau khi thay hoặc xóa CV gốc. |
| FR-028 | Đạt | Chỉ chủ tin xem được các lượt nộp vào đúng tin. Người ngoài không tải được CV đã nộp. |
| FR-029 | Đạt | Danh sách và chi tiết hồ sơ rút gọn chỉ mở cho người có tin đang tuyển và CSV còn bật Tìm việc. Ngày sinh, email, điện thoại và CV không có trong kết quả. |
| FR-030 | Đạt | Chủ tin sửa và đóng nhận ứng tuyển. Tài khoản khác bị chặn. Tin đóng từ chối hồ sơ mới. |
| FR-031 | Đạt | Xem lịch sử của chính mình và tin tương ứng. Trạng thái sau Đã nộp còn chờ quyết định mở rộng. |
| SM-01 | Đạt | Trang chủ đi tới tin tức, sự kiện, việc làm, cộng đồng, tài khoản và tiện ích. Mục riêng kiểm tra quyền. |
| SM-02 | Đạt | Trang Giới thiệu thẻ Alumni nêu mục đích, ai được cấp và các hạng thẻ đang hỗ trợ. |
| SM-03 | Chờ chốt | Chưa xuất bản hướng dẫn chính thức. Cần bản hướng dẫn đã duyệt. |
| SM-04 | Chờ chốt | Chưa xuất bản trang liên hệ. Cần đầu mối, kênh liên hệ được phép công bố và quyết định về biểu mẫu. |
| SM-05 | Chờ chốt | Chưa có văn bản chính sách bảo mật đã duyệt để công bố. |
| SM-06 | Chờ chốt | Chưa có văn bản điều khoản sử dụng đã duyệt để công bố. |
| SM-07 | Đạt | Hub cá nhân mở hồ sơ hoặc thẻ theo trạng thái, sự kiện, đề nghị vai trò, hồ sơ nghề nghiệp, việc làm và lịch sử theo quyền. |
| GR-01 | Một phần | Hiển thị vai trò còn hiệu lực, giữ một mã và một thẻ. Thứ tự Đại sứ → Gắn kết → Thành viên đang theo demo, chờ xác nhận chính thức. |
| GR-02 | Đạt | CSV có thẻ gửi lý do và liên kết minh chứng, xem trạng thái và kết quả. |
| CV-01 | Đạt | PDF riêng tư trong PostgreSQL, 5 tệp × 5 MB. Có tải lên, đặt tên, đổi tên, thay tệp và xóa. |
| NAV-001 | Đạt | Việc làm có lối vào Tìm việc và Tuyển dụng, thao tác được kiểm tra quyền tại backend. |
| GX-01 | Đạt | Trang chủ mở VHub theo URL trong Excel ở tab mới. Quyền truy cập của CSV, SSO và theo dõi hồ sơ VHub là các quyết định tích hợp còn mở. |
| GX-02 | Đạt | Link trang chủ khớp địa chỉ tuyển sinh sau đại học trong Excel. |
| GX-03 | Một phần | Có trang Ưu đãi hiển thị nội dung đã duyệt và còn hiệu lực. Còn thiếu danh sách và chính sách ưu đãi chính thức. |
| GX-04 | Đạt | Có link thư viện số và mục thông tin Thư viện hiển thị nội dung đã duyệt và còn hiệu lực. Quy trình mã vạch thư viện còn chờ chốt. |
| GX-05 | Một phần | Gửi bài có nội dung, chủ đề và tên tác giả cho CSV có thẻ sau kiểm duyệt. Chưa hiển thị giới thiệu nghề nghiệp như trường riêng trên bảng tin. |
| GX-06 | Đạt | Chủ đề Cơ hội nghề nghiệp lọc được trên bảng tin. Trang chủ có lối vào Việc làm. |
| GX-07 | Đạt | Gửi yêu cầu với email và đơn vị tùy chọn, thấy Chờ tiếp nhận. Backend chỉ trả đề xuất cho chính người gửi và Admin. |

## Admin · 18 mục

| Mã | Kết quả | Bằng chứng và phần còn lại |
| --- | --- | --- |
| FR-006 | Đạt | Có danh sách và chi tiết hồ sơ, gồm MSSV hoặc CCCD. Đã chốt Admin đối soát CCCD ngoài hệ thống rồi xác nhận. |
| FR-007 | Đạt | Bắt buộc xác nhận đã đối chiếu. Ghi người và thời điểm duyệt. Người thiếu quyền bị chặn. |
| FR-008 | Đạt | Duyệt cập nhật trạng thái và cấp thẻ đúng tài khoản, mã `ALN ddmmyy 000001`, ngày theo giờ Việt Nam, số tăng toàn hệ thống. |
| FR-009 | Đạt | Đã thử hai yêu cầu duyệt đồng thời trả cùng thẻ và mã. Đối chiếu transaction và giao diện cho trường hợp lỗi và thử lại. Chưa giả lập lỗi ghi DB có chủ đích. |
| FR-013 | Đạt | Tạo nháp, sửa, công bố, thời điểm công bố và ảnh tùy chọn. |
| FR-015 | Đạt | Gỡ khỏi công khai, đường dẫn trả 404, Admin vẫn xem được và công bố lại được. |
| FR-016 | Đạt | Admin tạo, sửa, xuất bản, đặt sức chứa, đóng đăng ký và chỉnh giới hạn người đi cùng theo sự kiện. Giá trị 0 tắt đăng ký người đi cùng và là mặc định. |
| FR-021 | Đạt | CMS tách số lượt và tổng số người dự kiến. Admin xem và xuất Excel danh sách còn hiệu lực với thông tin sự kiện, tên, mã Alumni, email đăng ký, thời gian, số người đi cùng và tổng. Tài khoản giả lập local không có email. |
| SM-08 | Một phần | Admin đi tới các nghiệp vụ theo quyền. Chưa có trang tổng quan và KPI đã chốt. |
| GR-03 | Đạt | CSV có thẻ gửi đề cử theo quyết định đã xác nhận. Admin lưu kết quả duyệt hoặc từ chối. |
| GR-04 | Một phần | Admin xem minh chứng HTTPS, lưu người và quyết định, tính lại hạng. Quy tắc ưu tiên nhiều vai trò vẫn dùng demo. |
| GR-05 | Một phần | Có lịch sử kết thúc và tính lại hạng, giữ mã. Chờ xác nhận chính thức quy tắc ưu tiên hạng. |
| ADM-01 | Đạt | Smoke test gọi trực tiếp các API hồ sơ, thẻ sự kiện, tin tức, ứng tuyển, CV và cộng đồng với phiên thiếu quyền. API từ chối theo phạm vi. |
| ADM-02 | Đạt | Các màn danh sách và chi tiết Admin cho tra cứu người xử lý, thời gian, kết quả duyệt hồ sơ và thay đổi vai trò. |
| SEO-01–04 | Một phần | Có URL và một số metadata. Chưa hoàn thiện canonical, breadcrumb, sitemap XML và JobPosting. Chờ duyệt phạm vi công khai. |
| GX-08 | Đạt | Admin xem, duyệt, ẩn, hiện lại. Bảng tin phản ánh trạng thái sau từng thao tác. |
| GX-09 | Đạt | Admin Alumni xem đề xuất, ghi nhận đơn vị tiếp nhận và cập nhật trạng thái. Trao đổi ngoài hệ thống theo quy trình đã chốt. |
| GX-10 | Đạt | Local có quản trị Ưu đãi và Thư viện. Admin Alumni soạn và gửi duyệt. Tài khoản duyệt của Trường có thể trả lại, duyệt để công bố hoặc gỡ. Khách và CSV chỉ thấy nội dung đang hiệu lực. Chờ đầu mối cấp quyền thật và nội dung chính thức để vận hành. |

## Các điểm cần chốt

| Ưu tiên | Quyết định | Mã liên quan |
| --- | --- | --- |
| 1 | Đã chốt Admin xuất Excel từ CMS và bàn giao cho bộ phận tạo vé. Bộ phận tạo vé tạo QR và gửi email bằng hệ thống ngoài. Cần nghiệm thu khâu gửi, hiệu lực và xác thực QR với bộ phận tạo vé. | FR-020, FR-021 |
| 2 | Thời gian dự kiến xét duyệt, kênh/thông báo từ chối, đăng ký lại bằng email đã dùng và cấu hình SMTP của Trường. Đã chốt mã 6 số dùng một lần trong 10 phút. | FR-002, FR-004, FR-005 |
| 3 | Bản hướng dẫn, chính sách bảo mật, điều khoản và kênh hỗ trợ được Trường duyệt. Chốt biểu mẫu liên hệ và danh sách KPI của CMS. | SM-03–06, SM-08 |
| 4 | Quyền truy cập VHub của CSV và phạm vi tích hợp SSO. Nội dung ưu đãi và thư viện chính thức, đơn vị được cấp quyền duyệt, cách cấp và xác thực mã vạch thư viện. Đã chốt Admin Alumni soạn và Trường duyệt trước khi công bố. | GX-01, GX-03, GX-04, GX-10 |
| 5 | Xác nhận chính thức thứ tự hạng khi có nhiều vai trò. Hiện dùng thứ tự của demo và xét thủ công theo lý do/minh chứng như đã chốt. | GR-01, GR-04, GR-05 |
| 6 | Phạm vi trang và tin Việc làm được công khai, điều kiện JobPosting, trạng thái xử lý ứng tuyển, và bộ trình duyệt/thiết bị/tiêu chí tiếp cận cần nghiệm thu. | SEO-01–04, FR-031, điểm cần chốt 6 |

Hai điểm trong Excel đã chốt và đang áp dụng gồm Admin Alumni tiếp nhận/chuyển hợp tác và định dạng mã Alumni. CV PDF riêng tư với giới hạn 5 × 5 MB và quyền chỉ tải bản đã nộp vào tin mình sở hữu cũng đã chốt.

## Các lỗi đã sửa trong đợt rà soát

- Tách trạng thái Chờ duyệt khỏi lời mời đăng nhập ở sự kiện. Backend khóa đăng ký khi còn dưới 12 giờ, trang danh sách và chi tiết hiển thị hết hạn.
- Bổ sung họ tên và mã Alumni vào báo cáo đăng ký sự kiện cho tài khoản đã cấp thẻ.
- Bổ sung đường dẫn vào hồ sơ nghề nghiệp, việc làm và lịch sử ứng tuyển từ tài khoản. Từ biểu mẫu đăng ký có lối quay tới đăng nhập.
- Bổ sung trang giới thiệu thẻ. VHub mở tab mới đúng AC. Trang chủ dẫn đến nội dung Ưu đãi và Thư viện đang hiệu lực.
- Bổ sung trang chi tiết ứng viên rút gọn dùng chung điều kiện quyền với danh sách. Đường dẫn đã lưu trả 404 nếu ứng viên tắt Tìm việc hoặc người xem thiếu quyền.

## Kiểm tra local

- Đã chạy Biome, typecheck, 3 test backend và build hai workspace.
- Đã chạy toàn bộ `npm run test:smoke` sau khi sửa trên Next.js, Node.js và PostgreSQL trong Docker với dữ liệu giả lập. Cả 5 nhóm qua kiểm tra gồm sự kiện, tài khoản và cấp thẻ, tin tức, Career Hub, vai trò và cộng đồng. Các ca hồi quy kiểm tra hết hạn đăng ký, sức chứa, họ tên và mã Alumni trong báo cáo, tài khoản chờ duyệt, điều hướng, quyền mở hồ sơ ứng viên và đổi tên CV.
- Cả 8 migration chạy thành công và chạy lại được trên DB thử nghiệm.
- Đợt bổ sung chạy lại lint, typecheck, 3 test backend, build và smoke test hồi quy qua Next.js, Node.js và PostgreSQL biệt lập. Luồng khôi phục kiểm tra phản hồi chung cho email lạ, quyền đọc hộp thư, giới hạn gửi lại, mã dùng một lần khi gửi đồng thời và hủy phiên cũ. Kiểm tra bổ sung xác nhận thời hạn 600 giây, từ chối mã đã hết hạn và khóa sau 5 lần sai.
- Luồng Ưu đãi và Thư viện kiểm tra tách quyền, gửi duyệt, trả lại, chặn bản đã thay đổi, công bố, gỡ và ẩn nội dung hết hiệu lực trên trang công khai.
- Đợt cập nhật Sự kiện đã chạy lại lint, typecheck, 4 bài test backend, build và toàn bộ smoke test trên PostgreSQL local biệt lập. Test backend xác nhận cho thao tác trước và đúng mốc 12/24 giờ, rồi khóa ngay sau mốc. Smoke test qua API và trang sự kiện xác nhận hủy trả đủ chỗ, không hủy thay người khác, chặn khách ở lượt đăng ký lại, chặn khi hết chỗ, cho đăng ký lại một mình khi có chỗ và giữ lượt mới nếu nhận yêu cầu hủy cũ. Cả 10 migration áp dụng thành công và chạy lại được.
- Đợt bàn giao tạo vé đã chạy lint, typecheck, 5 bài test backend, build và toàn bộ smoke test local. Kiểm tra email trong báo cáo, nút xuất và quyền tải file theo phiên Admin. File Excel mẫu được đọc lại bằng openpyxl để đối chiếu tiếng Việt, email và cột số lượng.
- Chromium đã qua kiểm tra điều hướng trên khung điện thoại 390 px và desktop 1440 px. Kiểm tra giao diện tập trung vào điều hướng, hiển thị và quyền mở trang. Chưa đối chiếu toàn bộ tiêu chí tiếp cận hoặc các họ trình duyệt khác.
