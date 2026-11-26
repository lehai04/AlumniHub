#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${BACKUP_DIR:?Set BACKUP_DIR to a protected backup directory}"
: "${PGSERVICE:?Set PGSERVICE using the PostgreSQL service and password files on the host}"
mkdir -p -- "$BACKUP_DIR"
temporary="$(mktemp "$BACKUP_DIR/.alumni.XXXXXX")"
trap 'rm -f -- "$temporary"' EXIT
# Chỉ lưu bản sao lưu sau khi xác nhận pg_restore đọc được danh mục bên trong tệp.
pg_dump --format=custom --no-owner --no-acl --file="$temporary"
pg_restore --list "$temporary" >/dev/null
destination="$BACKUP_DIR/alumni-$(date -u +%Y%m%dT%H%M%SZ)-${temporary##*.}.dump"
mv -- "$temporary" "$destination"
echo "$destination"
