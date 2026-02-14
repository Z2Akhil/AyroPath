FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_TARGET_URL

ENV VITE_TARGET_URL=$VITE_TARGET_URL

COPY package*.json ./

RUN npm ci && npm audit fix && npm clean cache --force

COPY . .

RUN npm run build

FROM node:22-alpine

RUN sed -i 's|https://dl-cdn.alpinelinux.org|http://dl-cdn.alpinelinux.org|g' /etc/apk/repositories && \
    apk --no-cache add curl && \
    npm install -g serve

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodjes /app/dist ./dist

USER nodejs

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5173/ || exit 1

CMD ["serve", "-s", "dist", "-l", "5173"]
