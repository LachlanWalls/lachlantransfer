### --- Base --- ###
FROM node:24-alpine AS base

ARG VITE_MAX_FILE_SIZE_BYTES
ARG VITE_MAX_USERS

ENV VITE_MAX_FILE_SIZE_BYTES $VITE_MAX_FILE_SIZE_BYTES
ENV VITE_MAX_USERS $VITE_MAX_USERS

### --- Dependencies --- ###
FROM base AS deps
WORKDIR /build

RUN npm i -g pnpm@10

### Install dependencies ###
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

### --- Builder --- ###
FROM deps AS builder
WORKDIR /build

### Build service ###
COPY . .
RUN pnpm run build

# Prune out typescript now that we're done building
RUN pnpm prune --prod

### --- Runner --- ###
FROM base AS runner
WORKDIR /app

RUN apk add curl

COPY --from=builder /build .
CMD ["sh", "-c", "node ./dist/server.js"]
