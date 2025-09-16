FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create recordings directory
RUN mkdir -p recordings

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
