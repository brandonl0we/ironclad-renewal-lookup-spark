FROM node:22-alpine AS deps
WORKDIR /app

ARG ACOS_SDK_GITLAB_TOKEN
RUN apk add --no-cache git \
  && if [ -n "${ACOS_SDK_GITLAB_TOKEN}" ]; then \
    git config --global url."https://oauth2:${ACOS_SDK_GITLAB_TOKEN}@gitlab.devops.app-us1.com/ac-spark/sdks/".insteadOf "https://gitlab.devops.app-us1.com/ac-spark/sdks/"; \
  fi

COPY package*.json ./
RUN npm install && rm -f /root/.gitconfig

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
