FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace package files (must be from repository root)
COPY package.json ./
COPY package-lock.json* ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/
COPY packages/validation ./packages/validation

# Set working directory to web app
WORKDIR /app/apps/web

# Install dependencies with workspace support
RUN npm install --workspace=apps/web --include-workspace-root

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy workspace structure
COPY --from=deps /app /app
COPY apps/web ./apps/web
COPY packages ./packages

# Set working directory and build
WORKDIR /app/apps/web
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p ./public

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]