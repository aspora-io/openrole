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
COPY apps/api/package.json ./apps/api/

# Set working directory to api app
WORKDIR /app/apps/api

# Install dependencies with workspace support
RUN npm install --workspace=apps/api --include-workspace-root

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy workspace structure
COPY --from=deps /app /app
COPY apps/api ./apps/api
COPY packages ./packages

# Set working directory and build
WORKDIR /app/apps/api
RUN npm run build

# Production image, copy all the files and run node
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy the built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/index.js"]