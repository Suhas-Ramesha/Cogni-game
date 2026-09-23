FROM node:22-alpine
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types packages/shared-types
RUN corepack enable && pnpm install --filter @cognigame/api...
COPY apps/api apps/api
WORKDIR /repo/apps/api
RUN pnpm prisma:generate && pnpm build
ENV API_PORT=3001
EXPOSE 3001
CMD ["node", "dist/main.js"]
