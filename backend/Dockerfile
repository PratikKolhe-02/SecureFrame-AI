FROM node:20-slim

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PRISMA_CLIENT_ENGINE_TYPE="binary" \
    PRISMA_CLI_QUERY_ENGINE_TYPE="binary" \
    DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

EXPOSE 5000
CMD ["node", "server.js"]