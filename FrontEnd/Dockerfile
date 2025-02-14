# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build for production
RUN npm run build

# Install a lightweight web server (serve)
RUN npm install -g serve

# Expose port 5173
EXPOSE 5173

# Start frontend using "serve"
CMD ["serve", "-s", "dist", "-l", "5173"]
