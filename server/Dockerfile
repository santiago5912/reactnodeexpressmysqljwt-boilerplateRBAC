FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    APP_PORT=5010 \
    PUPPETEER_SKIP_DOWNLOAD=true

# Puppeteer is currently unused; avoid downloading a browser during install.
# Build tools support native dependencies such as bcrypt when needed.
COPY package.json package-lock.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && npm ci --omit=dev \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node . .

USER node
EXPOSE 5010

CMD ["node", "server.js"]
