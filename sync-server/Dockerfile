# Sync Server

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build TypeScript
RUN npm install -D typescript tsx && npm run build

# Create data directory
RUN mkdir -p /app/data && chown -R node:node /app

# Security: Run as non-root
USER node

# Environment
ENV NODE_ENV=production
ENV PORT=4444
ENV PERSISTENCE=true
ENV PERSISTENCE_DIR=/app/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4444/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 4444

CMD ["node", "dist/server.js"]
