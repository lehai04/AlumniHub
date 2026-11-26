# Rollback

Khi chuyển lần đầu từ bản một dịch vụ sang bản hai workspace, giữ checkout, Compose và digest của bản cũ. Nếu cần quay về trước lần chuyển này, dùng script và Compose của checkout cũ với digest cũ, rồi dừng container backend đã thêm. Script hiện tại áp dụng cho các image có đủ hai workspace.

1. Tạm dừng phát hành tiếp theo và kiểm tra sự cố. Ghi lại commit lỗi, thời gian và digest khỏe gần nhất. Tệp trong `RELEASE_STATE_DIR` theo tên Compose project lưu dòng hiện tại và dòng trước đó.
2. Xác nhận image đích tương thích schema hiện tại. Dùng biến môi trường và checkout release script theo [hướng dẫn triển khai](DEPLOYMENT.md).
3. Chạy `bash deploy/rollback.sh 'ghcr.io/owner/alumni-hub@sha256:<digest-da-kiem-tra>'`. Lặp lại với cùng digest cho cùng kết quả.
4. Kiểm tra `/health`, `/ready`, luồng nghiệp vụ liên quan và log. Ghi lại kết quả trong báo cáo sự cố.

Rollback image giữ nguyên DB và không chạy down migration. Thay đổi schema cần theo chiến lược expand/contract, với contract thực hiện sau khi phiên bản cũ đã được loại khỏi phương án rollback. Khi schema lỗi hoặc dữ liệu bị hỏng, giữ bản sao hiện trạng, khôi phục backup vào DB biệt lập, kiểm tra dữ liệu và xin quyết định chuyển kết nối. Việc khôi phục có thể làm mất giao dịch phát sinh sau điểm backup.
