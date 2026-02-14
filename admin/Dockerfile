FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_TARGET_URL

ENV VITE_TARGET_URL=$VITE_TARGET_URL

COPY package*.json ./

RUN npm ci && npm audit fix && npm cache clean --force

COPY . .

RUN npm run build

FROM node:22-alpine

RUN apk --no-cache add curl && npm install -g serve

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

EXPOSE 5174

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5174/ || exit 1

CMD ["serve", "-s", "dist", "-l", "5174"]
