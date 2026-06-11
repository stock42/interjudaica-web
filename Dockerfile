FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js application
RUN bun run build

# Expose the port
EXPOSE 3025

# Start the production server
CMD ["bun", "run", "start"]
