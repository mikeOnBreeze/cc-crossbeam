FROM node:22-slim

WORKDIR /app

# System packages for PDF extraction (baked in — zero runtime cost)
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends poppler-utils imagemagick && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy compiled code and skills
COPY dist/ ./dist/
COPY skills/ ./skills/
COPY fixtures/ ./fixtures/

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]
