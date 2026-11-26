#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/release-common.sh"

image=${1:-}
if ! valid_image "$image"; then
  echo "Usage: bash deploy/deploy.sh ghcr.io/owner/image@sha256:<digest>" >&2
  exit 2
fi
# Cập nhật cấu trúc cơ sở dữ liệu trước khi chuyển dịch vụ web sang image mới.
compose "$image" pull web
[[ -r "$MIGRATION_ENV_FILE" ]]
compose "$image" run --rm --no-deps migrate
# Chỉ ghi nhận phiên bản mới sau khi container báo sẵn sàng.
if ! start_release "$image"; then
  echo "Release failed readiness; restoring the last healthy image if available." >&2
  if [[ -n "$current" ]]; then
    start_release "$current"
  else
    compose "$image" stop web backend
  fi
  exit 1
fi
if [[ "$image" != "$current" ]]; then
  save_release "$image" "$current"
fi
