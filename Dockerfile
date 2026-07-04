# ============ 构建阶段 ============
FROM node:18-bullseye AS builder

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# ============ 生产阶段 ============
FROM node:18-bullseye-slim AS runner

WORKDIR /app

# 安装 Chromium（用于 Puppeteer 生成 PDF）
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 \
    libfreetype6 \
    libharfbuzz0b \
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get autoremove -y

# 设置环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# 创建非 root 用户
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# 从 builder 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
