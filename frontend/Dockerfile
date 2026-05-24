FROM node:20-alpine

# Metadata
LABEL maintainer="nexus-team"
LABEL description="NEXUS Frontend - React/Vite (development)"

# Set working directory
WORKDIR /app

# Install dependencies — cached layer
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
