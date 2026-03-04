FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

# Copy dependency files
COPY pubspec.* ./

# Get flutter dependencies
RUN flutter pub get

# Copy full application code
COPY . .

# Build Flutter web application
RUN flutter build web

# Phase 2: Serve the files using nginx
FROM nginx:alpine

# Copy built web files into nginx public folder
COPY --from=build /app/build/web /usr/share/nginx/html

EXPOSE 80

# Nginx starts automatically
