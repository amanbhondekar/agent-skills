FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
  libc6-compat \
  libstdc++ \
  gcompat \
  libgcc

COPY package*.json ./

RUN npm ci --only=production && npx playwright install chromium

COPY src/ ./src/

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

CMD ["node", "src/index.js"]
