#!/usr/bin/env bash
set -euo pipefail
umask 077

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${RUNTIME_ENV_FILE:?Set RUNTIME_ENV_FILE to the absolute path on the release host}"
: "${MIGRATION_ENV_FILE:?Set MIGRATION_ENV_FILE to the absolute path on the release host}"
: "${RELEASE_STATE_DIR:?Set RELEASE_STATE_DIR to the state directory on the release host}"
: "${COMPOSE_PROJECT_NAME:?Set a stable Compose project name for this environment}"
[[ "$RUNTIME_ENV_FILE" == /* && -r "$RUNTIME_ENV_FILE" && "$MIGRATION_ENV_FILE" == /* && "$RELEASE_STATE_DIR" == /* ]]
[[ "$COMPOSE_PROJECT_NAME" =~ ^[a-z0-9][a-z0-9_-]*$ ]]
compose_files=(-f "$root/compose.production.yaml")
if [[ -n "${COMPOSE_OVERRIDE_FILE:-}" ]]; then
  [[ "$COMPOSE_OVERRIDE_FILE" == /* && -r "$COMPOSE_OVERRIDE_FILE" ]]
  compose_files+=(-f "$COMPOSE_OVERRIDE_FILE")
fi
mkdir -p -- "$RELEASE_STATE_DIR"
# Deploy và rollback dùng chung khóa để tránh cùng cập nhật một môi trường.
state_file="$RELEASE_STATE_DIR/$COMPOSE_PROJECT_NAME"
exec 9>"$state_file.lock"
flock 9

current=
previous=
if [[ -f "$state_file" ]]; then
  { read -r current; read -r previous; } < "$state_file"
fi

valid_image() {
  [[ "$1" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$ ]]
}

compose() {
  local image=$1
  shift
  IMAGE="$image" docker compose --env-file /dev/null -p "$COMPOSE_PROJECT_NAME" "${compose_files[@]}" "$@"
}

start_release() {
  compose "$1" up -d --wait --wait-timeout 90 backend web
}

# Ghi đủ hai tham chiếu image vào tệp tạm rồi dùng tệp đó để thay thế tệp trạng thái.
save_release() {
  local pending
  pending="$(mktemp "$RELEASE_STATE_DIR/.release.XXXXXX")"
  printf '%s\n%s\n' "$1" "$2" > "$pending"
  mv -f -- "$pending" "$state_file"
}
