# Use Node.js as the base image
FROM node:18-alpine

LABEL maintainer="BuyVia"

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the development server port
EXPOSE 5173

# Start the React development server using npx
CMD ["npx", "vite", "--host", "0.0.0.0"]
