# Address Book SPA — React + Vite, served by nginx
# Stage 1: build the static bundle
FROM node:24-alpine AS build

WORKDIR /app

# VITE_API_BASE_URL is baked in at build time; default keeps requests same-origin
# (/api/v1) so nginx can proxy them to the backend — no CORS needed.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
# Prefer the reproducible lockfile install; fall back if the lock is out of sync
RUN npm ci || npm install

COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
