# Cài các thư viện theo phiên bản đã cố định. Docker có thể dùng lại lớp này khi chỉ sửa mã nguồn.
FROM node:24.19.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm ci --no-audit --no-fund

# Biên dịch TypeScript và giữ lại các gói cần thiết để chạy ứng dụng.
FROM dependencies AS build
COPY apps/ ./apps/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

# Đóng gói ứng dụng đã biên dịch, tài nguyên và migration để chạy bằng tài khoản không có quyền root.
FROM node:24.19.0-bookworm-slim AS runtime
WORKDIR /app
ARG APP_VERSION=0.1.0
ARG COMMIT_SHA=local
LABEL org.opencontainers.image.title="Alumni Hub" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${COMMIT_SHA}"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 APP_VERSION=${APP_VERSION} COMMIT_SHA=${COMMIT_SHA} HOST=0.0.0.0 PORT=8081
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules/
COPY --from=build /app/apps/backend/dist ./apps/backend/dist/
COPY --from=build /app/apps/backend/package.json ./apps/backend/
COPY --from=build /app/apps/frontend/package.json ./apps/frontend/
COPY --from=build /app/apps/frontend/next.config.mjs ./apps/frontend/
COPY --from=build /app/apps/frontend/.next ./apps/frontend/.next/
COPY --from=build /app/apps/frontend/public ./apps/frontend/public/
COPY db/migrations ./db/migrations/
USER node
EXPOSE 8080 8081
CMD ["node", "apps/backend/dist/src/main.js"]
