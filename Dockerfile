# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build the frontend (Vite) into static assets
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: backend runtime, serving the built frontend
# ---------------------------------------------------------------------------
FROM node:20-alpine AS backend

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Built frontend lands in backend/public, which app.js serves automatically.
COPY --from=frontend /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
