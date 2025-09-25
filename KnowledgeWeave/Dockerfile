# Stage 1: Build frontend
FROM node:20-alpine AS frontend

WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build

# Stage 2: Backend
FROM node:20-alpine AS backend

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --only=production

COPY backend ./ 
COPY --from=frontend /app/dist ../dist

EXPOSE 3001
CMD ["npm", "start"]
