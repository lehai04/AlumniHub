#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/release-common.sh"

image=${1:-}
if ! valid_image "$image"; then
  echo "Pass the target digest explicitly; see the previous digest in $state_file." >&2
  exit 2
fi
# Quay lại image đã chọn và giữ nguyên cấu trúc cơ sở dữ liệu hiện tại.
compose "$image" pull web
if ! start_release "$image"; then
  if [[ -n "$current" && "$current" != "$image" ]]; then
    start_release "$current"
  fi
  exit 1
fi
if [[ "$image" != "$current" ]]; then
  save_release "$image" "$current"
fi
