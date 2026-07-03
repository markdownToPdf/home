# ============ 构建参数 ============
ARG NODE_VERSION=20.18.0

# ============ 构建阶段 ============
FROM node:${NODE_VERSION}-bullseye-slim AS builder

WORKDIR /app

# 先单独复制 package 文件以最大化缓存
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# 复制源码
COPY . .

# 构建 Next.js standalone 应用
RUN npm run build && \
    # standalone 模式下手动复制 public/.next/static（Next.js 只追踪 import 关系）
    cp -r public ./.next/standalone/ 2>/dev/null || true && \
    cp -r .next/static ./.next/standalone/.next/ 2>/dev/null || true

# ============ 生产阶段 ============
FROM node:${NODE_VERSION}-bullseye-slim AS runner

LABEL org.opencontainers.image.source="https://github.com/markdownToPdf/markdown-pdf-home" \
      org.opencontainers.image.description="Markdown to PDF web app" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_PATH=/usr/bin/chromium \
    NEXT_TELEMETRY_DISABLED=1

# 安装 Chromium 及必要的中文字体支持（PDF 导出需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      libnss3 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      libxkbcommon0 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libgbm1 \
      libpango-1.0-0 \
      libcairo2 \
      libasound2 \
      fonts-noto-cjk \
      fonts-noto-color-emoji \
      fonts-freefont-ttf \
      ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* /tmp/* /root/.npm

# 创建非 root 用户
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# 只从 builder 复制 standalone 产物（静态文件已包含在内）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# 健康检查：打到 /，期望拿到 200/3xx（Next.js 首页）
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode < 400 ? 0 : 1)).on('error', () => process.exit(1))" || exit 1

CMD ["node", "server.js"]
