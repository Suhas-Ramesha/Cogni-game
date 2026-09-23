FROM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml .npmrc* pnpm-lock.yaml* ./
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared-types packages/shared-types
COPY packages/design-tokens packages/design-tokens
RUN pnpm install --filter @cognigame/dashboard...

FROM deps AS build
COPY apps/dashboard apps/dashboard
WORKDIR /repo/apps/dashboard
RUN pnpm build

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo .
WORKDIR /repo/apps/dashboard
EXPOSE 3000
CMD ["pnpm", "start"]
