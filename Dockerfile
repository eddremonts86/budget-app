FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN pnpm install --frozen-lockfile

FROM base AS dev

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev:server", "--host", "0.0.0.0", "--port", "3000"]

FROM base AS builder

WORKDIR /app

COPY . .

RUN pnpm build

FROM node:22-bookworm-slim AS prod

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Reuse compiled node_modules from base — avoids re-running native binary builds
COPY --from=base /app/node_modules ./node_modules
RUN pnpm prune --prod

COPY --from=builder /app/dist ./dist
COPY server.prod.mjs ./server.prod.mjs

EXPOSE 3000

CMD ["node", "server.prod.mjs"]