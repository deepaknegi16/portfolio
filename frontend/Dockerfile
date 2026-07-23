# syntax=docker/dockerfile:1
#
# Multi-stage: build the Astro site with Node, serve the result with nginx.
# The runtime image contains no Node, no source, and no node_modules.
# See decisions/0003-nginx-static-in-docker.md

# ─── Build ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Astro bakes PUBLIC_* variables into the output at build time, so the data
# source has to be decided here rather than at container start.
ARG PUBLIC_DATA_SOURCE=static
ARG PUBLIC_API_BASE_URL=""
# Optional: raises the GitHub rate limit from 60/hr to 5000/hr. The build
# succeeds without it — scripts/fetch-github.mjs fails soft.
ARG GITHUB_TOKEN=""

ENV PUBLIC_DATA_SOURCE=$PUBLIC_DATA_SOURCE \
    PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL \
    GITHUB_TOKEN=$GITHUB_TOKEN

# Copy manifests first so `npm ci` is cached until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Runs the prebuild GitHub fetch, then astro build.
RUN npm run build

# ─── Runtime ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Worker processes drop to the unprivileged `nginx` user; only the master runs
# as root, which is how the official image is designed to work.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Fail the build on a malformed config rather than at container start.
RUN nginx -t

EXPOSE 80

# BusyBox wget — the alpine image has no curl.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
