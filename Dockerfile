# Stage 1: Build the React Vite app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy the rest of the source code
COPY . .

# Build-time arguments (optional)
ARG VITE_ENV
ARG VITE_LOCAL_URL
ARG VITE_WEB_URL
ENV VITE_ENV=$VITE_ENV
ENV VITE_LOCAL_URL=$VITE_LOCAL_URL
ENV VITE_WEB_URL=$VITE_WEB_URL

# Build the production version of the app
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Install serve globally to serve the app
RUN npm install -g serve

# Expose the port
EXPOSE 5001

# Start the app
CMD ["serve", "-s", "dist", "-l", "5001"]
