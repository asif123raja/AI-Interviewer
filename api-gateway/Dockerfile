FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package config and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Generate Prisma Client and Build NestJS App
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

WORKDIR /usr/src/app

# Copy only the necessary files for the runtime
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Start the NestJS application in production mode
CMD ["npm", "run", "start:prod"]
