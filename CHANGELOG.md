# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) và [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Trang sự kiện công khai, quản trị sự kiện và đăng ký với tài khoản thử nghiệm local.
- Migration cho trạng thái xuất bản và khóa chống đăng ký trùng.

### Changed

- Tách frontend Next.js và backend Node.js thành hai npm workspace, đồng thời cập nhật Compose và CI.

## [0.1.0] - 2026-11-16

### Added

- Nền HTTP TypeScript, kiểm tra cấu hình, health/readiness và JSON log.
- PostgreSQL migration, seed dev, kiểm tra tự động và Docker Compose.
- Pipeline GHCR, staging, production và tài liệu vận hành tiếng Việt.
