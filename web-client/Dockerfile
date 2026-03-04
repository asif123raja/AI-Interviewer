FROM node:20-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies. Using --legacy-peer-deps or normal install.
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

# Start the built Next.js application
CMD ["npm", "start"]
