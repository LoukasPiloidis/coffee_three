# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL is required at build time only for type-safety of drizzle imports;
# the actual value is not used during build because we use `output: standalone`.
ENV DATABASE_URL="postgres://build:build@localhost:5432/build"
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so the
# Keystatic Cloud project id must be available here (passed via build args).
ARG NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT
ENV NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT=$NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT
RUN pnpm build

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Keystatic reads content from the filesystem at runtime
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages
COPY --from=builder --chown=nextjs:nodejs /app/keystatic.config.ts ./keystatic.config.ts
# Drizzle migrations + migrate runner
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
# `postgres` driver is bundled in node_modules of the standalone output via server,
# but the migrate script is run standalone so we need node_modules for it too.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
