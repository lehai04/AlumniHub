# Kế hoạch xây dựng Alumni Hub ver01

Phạm vi tham chiếu là `Báo cáo/Ds chức năng.xlsx`, gồm 38 mục CSV, 18 mục Admin và 8 điểm cần chốt. Dùng mã chức năng và AC để theo dõi nghiệm thu. Bố cục tham khảo từ `Báo cáo/vlu_alumni_card_system_demo.html`. Dữ liệu, quyền và thao tác trong demo chỉ minh họa giao diện.

## Thứ tự triển khai

| Đợt | Phạm vi | Kết quả cần kiểm tra |
| --- | --- | --- |
| 1 · Sự kiện đang có | FR-016, FR-017, FR-020, FR-021, ADM-01 | Mở danh sách và chi tiết công khai, đóng nhận đăng ký, đếm lượt và số người dự kiến. Kiểm tra quyền và luồng đăng ký đang có. Hủy, đăng ký lại, mã tham gia và mốc thời gian tiếp tục sau khi có quyết định. |
| 2 · Tài khoản, duyệt và cấp thẻ | FR-001–009, FR-010–011, SM-07, SM-08, GR-01, ADM-01–02 | Gửi hồ sơ, theo dõi trạng thái, admin xét duyệt, cấp thẻ một lần, CSV chỉ xem dữ liệu của mình. Bổ sung lịch sử xử lý và tích hợp email sau khi có quy tắc. |
| 3 · Tin tức và nội dung công khai | FR-013–015, SM-01–06, GX-01–04, GX-10, SEO-01–04 | CMS soạn, công bố và gỡ tin. Hoàn thiện nội dung giới thiệu, hỗ trợ, chính sách, thư viện và ưu đãi theo bản được duyệt. |
| 4 · Career Hub | FR-022–031, CV-01, NAV-001, GX-06 | Hồ sơ nghề nghiệp, tìm việc và đăng tuyển theo quyền, ứng tuyển và xem lịch sử. Chốt lưu trữ CV, trường thông tin nhà tuyển dụng được xem và quyền công khai trước khi mở rộng. |
| 5 · Vai trò, cộng đồng và hợp tác | GR-02–05, GX-05, GX-07–09 | Đề nghị vai trò và xét duyệt theo quy tắc đã chốt. Bảng tin có kiểm duyệt và đề xuất hợp tác có đầu mối xử lý rõ ràng. |

Mức **Thấp** được thực hiện sau phần phụ thuộc hoặc sau khi chốt phạm vi. Rà soát lại từng AC trước khi đánh dấu hoàn thành. Kiểm chứng trên stack Docker local với dữ liệu giả, ưu tiên chạy luồng thật qua giao diện, API và PostgreSQL.

## Quyết định cần xác nhận

- **Tài khoản và thẻ (FR-001–009)** · Ai có quyền duyệt hồ sơ chỉ dùng CCCD, cách đối chiếu tốt nghiệp, SLA trả kết quả, cách đăng ký lại khi bị từ chối, quy tắc mã Alumni và mã hay liên kết đặt lại mật khẩu. Chốt người phụ trách và chính sách xử lý dữ liệu trước khi nhận CCCD thật.
- **Sự kiện (FR-016, FR-020)** · Cách xử lý đúng mốc 12/24 giờ, giới hạn và dữ liệu người đi cùng, điều kiện đăng ký lại, cách gửi và sử dụng mã tham gia. Bản local tiếp tục dùng giới hạn kỹ thuật sẵn có, chưa coi đó là chính sách của Trường.
- **Dịch vụ (GX-01–04, GX-10)** · Quyền truy cập VHub, quy trình mã vạch thư viện, chính sách ưu đãi, và văn bản đã được duyệt để công bố.
- **Vai trò, Career Hub và hợp tác** · Hạng thẻ và quy tắc đổi hạng, phạm vi công khai hồ sơ và tin tuyển dụng, hỗ trợ thiết bị và khả năng tiếp cận, đơn vị tiếp nhận hợp tác và quyền theo dõi.

## Phần code mở đầu

- FR-016 · Admin đóng đăng ký. Sự kiện vẫn xuất hiện công khai và các lượt đã có vẫn được giữ.
- FR-017 · Danh sách và chi tiết hiển thị trạng thái nhận đăng ký và tổng số người đã đăng ký.
- FR-021 · Admin xem từng lượt, thời gian, số người đi cùng và tổng số người. Khi dùng tài khoản local, báo cáo hiển thị mã tài khoản thử nghiệm vì hồ sơ CSV thật thuộc đợt 2.
- ADM-01 · API báo cáo và đóng đăng ký yêu cầu phiên có quyền Admin.

## Đợt 2 · Tài khoản và cấp thẻ

- Đã chốt đối chiếu hồ sơ chỉ có CCCD ngoài hệ thống. Admin xác nhận đã xác minh tốt nghiệp trước khi duyệt.
- Đã chốt mã `ALN ddmmyy 000001`. Ngày cấp tính theo múi giờ Việt Nam. Triển khai sáu số cuối tăng toàn hệ thống, giữ nguyên mã khi duyệt lại.
- Đã có đăng ký, theo dõi Chờ duyệt, xét duyệt và xem thẻ Thành viên trên môi trường local. Còn cần quyết định về SLA, luồng từ chối/đăng ký lại và cách đặt lại mật khẩu qua email.

## Đợt 3 · Tin tức

- FR-013–015 · Admin soạn, sửa, công bố, gỡ và công bố lại. Khách và cựu sinh viên xem được tin công bố tại `/news`. Bản nháp và tin đã gỡ trả 404 khi truy cập công khai.
- Nội dung chính thức như chính sách bảo mật, điều khoản và hướng dẫn vẫn cần bản được Trường duyệt.

## Đợt 4 · Career Hub

- FR-022–031, CV-01, NAV-001 · Có hồ sơ nghề nghiệp và chế độ Tìm việc, tìm/lọc tin đã công bố, đăng và đóng nhận ứng tuyển theo quyền, quản lý CV PDF, nộp hồ sơ và lịch sử ứng tuyển.
- Đã chốt lưu CV PDF riêng tư trong PostgreSQL, tối đa 5 tệp × 5 MB mỗi tài khoản. Chủ tin chỉ tải được CV đã nộp vào tin của mình. Người đăng tuyển có tin đang mở thấy hồ sơ rút gọn của CSV đang bật Tìm việc.
- Tin tuyển dụng trong ver01 hiển thị cho CSV đã có thẻ. Chỉ có trạng thái Đã nộp cho lượt ứng tuyển. Cần chốt nếu mở tin công khai hoặc thêm trạng thái xử lý.

## Đợt 5 · Vai trò, cộng đồng và hợp tác

- GR-01–05 · CSV có thẻ gửi đề nghị Gắn kết hoặc đề cử một CSV khác làm Đại sứ. Admin xem lý do và minh chứng HTTPS, xét thủ công, lưu quyết định hoặc kết thúc vai trò. Áp dụng thứ tự hạng thẻ theo demo. Hạng thay đổi trên cùng mã Alumni.
- GX-05–06, GX-08 · CSV có thẻ gửi bài và xem bảng tin đã kiểm duyệt. Admin duyệt/hiện, ẩn hoặc hiện lại bài.
- GX-07, GX-09 · CSV gửi nhu cầu, email và đơn vị mong muốn, xem lại đề xuất của riêng mình. Admin ghi nhận chuyển đến khoa/trường, theo dõi và kết thúc. Việc liên hệ đơn vị xử lý thực hiện ngoài hệ thống.
