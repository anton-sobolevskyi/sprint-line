# =========================
# Stage 1: Build Angular
# =========================
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

# =========================
# Stage 2: Nginx
# =========================
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# ⚠️ Adjust this path if needed (check angular.json → outputPath)
COPY --from=build /app/dist/sprint-line/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
