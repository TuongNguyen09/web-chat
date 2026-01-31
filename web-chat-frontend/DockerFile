# --- Stage 1: Build React bằng Node.js ---
FROM node:20-alpine as build
WORKDIR /app

# Copy file package để cài thư viện trước
COPY package*.json ./
RUN npm ci 

# Copy toàn bộ code
COPY . .

# Build ra thư mục 'build' hoặc 'dist'
RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine

# Copy file build từ Stage 1 sang thư mục mặc định của Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy file cấu hình Nginx custom của mình vào (để đè file mặc định)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]