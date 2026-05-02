FROM node:20-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY artifacts/shiroscan/package.json ./artifacts/shiroscan/package.json
RUN pnpm install --frozen-lockfile --filter @workspace/shiroscan...

FROM node:20-alpine AS dev
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo /repo
COPY artifacts/shiroscan ./artifacts/shiroscan
EXPOSE 5173
WORKDIR /repo/artifacts/shiroscan
CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
