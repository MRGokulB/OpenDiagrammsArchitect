FROM node:18-alpine

WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Install packages
RUN npm install

# Copy all source files
COPY . .

# Ensure the local workspace caching directory exists prior to runtime mapping
RUN mkdir -p /app/workspace

# Build the Next.js production routing bundles
RUN npm run build

# Expose standard web port
EXPOSE 3000

# Fire the production server
CMD ["npm", "run", "start"]
