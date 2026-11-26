# Runbook vận hành

## Kiểm tra nhanh

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/ready
docker ps --filter "label=com.docker.compose.project=alumni-production"
docker logs --since 15m --tail 200 <container-id>
```

Log là JSON theo dòng và có timestamp UTC, level, event cùng trường vận hành. Runtime ghi tên route chuẩn và mã HTTP ở mức debug, lỗi readiness ở mức warn. Dùng hệ thống log tập trung của đơn vị để đặt cảnh báo lỗi lặp.

| Triệu chứng | Kiểm tra và xử lý |
| --- | --- |
| Không mở được HTTP | Xem trạng thái container, lỗi `invalid_configuration`, quyền đọc runtime env, cổng loopback và cấu hình reverse proxy |
| Health 200, readiness 503 | Kiểm tra kết nối mạng, chứng chỉ DB, quyền truy vấn và bảng `schema_migrations`. Xác nhận migration runner đã hoàn thành trước khi khởi động |
| Migration thất bại | Kiểm tra lock/DDL và phiên bản SQL từ phiên bản đã phát hành. Dùng quyền quản trị DB để chẩn đoán, sửa bằng migration mới hoặc khắc phục hạ tầng |
| Release sai commit | Đối chiếu `/health` với digest từ CI. Xem release state và thực hiện rollback khi cần |
| Proxy lỗi 502 | Gọi loopback trực tiếp, kiểm tra cổng publish và hướng chuyển tiếp của proxy |

Cấu hình giám sát ngoài host kiểm tra HTTPS, `/health` và `/ready`. Theo dõi HTTP 5xx/latency trên reverse proxy, dung lượng đĩa và độ mới của backup.

## Backup và restore PostgreSQL

Dùng `pg_dump` và `pg_restore` tương thích với PostgreSQL 17. Tạo service name trong `pg_service.conf`; đặt credential qua secret store hoặc file `.pgpass` với quyền `0600`. Dùng TLS xác thực cho kết nối staging/production. Thiết lập lịch bằng scheduler của hạ tầng.

```bash
export PGSERVICE=alumni-production-backup
export BACKUP_DIR=/var/lib/alumni-hub/backups
bash deploy/backup.sh
```

Script kiểm tra có thể đọc cấu trúc archive. Đẩy bản backup sang kho mã hóa độc lập máy nguồn và đặt retention theo chính sách. Kiểm thử restore định kỳ.

```bash
export PGSERVICE=alumni-isolated-restore
pg_restore --list /secure/alumni-snapshot.dump
pg_restore --exit-on-error --single-transaction --no-owner --no-acl \
  --dbname="service=$PGSERVICE" /secure/alumni-snapshot.dump
psql "service=$PGSERVICE" -c 'TABLE public.schema_migrations'
```

Service restore phải trỏ tới database rỗng, biệt lập. Sau restore, so số bản ghi cần kiểm tra và chạy readiness/smoke với cấu hình biệt lập. Chỉ chuyển kết nối production sau khi người phụ trách dữ liệu xác nhận.
