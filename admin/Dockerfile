# Admin Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5174

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5174/ || exit 1

# Start the application with proper host binding
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5174"]
