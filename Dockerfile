# Build stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (Cloud Run uses $PORT environment variable)
EXPOSE 8080

# Start application
CMD ["node", "server.js"]
