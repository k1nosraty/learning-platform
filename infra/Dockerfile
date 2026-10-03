# syntax=docker/dockerfile:1
FROM node:24.19.0-bookworm-slim AS base
WORKDIR /app
RUN npm install --global pnpm@11.25.0

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/adapters/package.json ./packages/adapters/package.json
COPY packages/application/package.json ./packages/application/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/domain/package.json ./packages/domain/package.json
RUN --mount=type=cache,id=learning-pnpm,target=/pnpm/store pnpm install --store-dir /pnpm/store --frozen-lockfile

FROM dependencies AS build
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
COPY tsconfig.json ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24.19.0-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# Same precompiled server; explicit loopback-only HTTP/local-mail runtime policy.
FROM web AS local
ENV APP_RUNTIME_MODE=windows-local APP_URL=http://localhost:3000
USER root
RUN mkdir -p /app/content-storage && chown node:node /app/content-storage
USER node

FROM base AS production-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=learning-pnpm,target=/pnpm/store pnpm install --store-dir /pnpm/store --prod --frozen-lockfile

FROM node:24.19.0-bookworm-slim AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "dist/worker.mjs"]
