# Backend API + worker share this image (different command per compose service).
FROM node:20-slim

# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm install

# Generate the Prisma client against the schema.
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source.
COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

# The entrypoint runs migrations + seeds (once) before starting the given CMD.
# The worker service overrides both entrypoint and command to skip that.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
