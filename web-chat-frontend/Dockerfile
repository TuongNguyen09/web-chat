# --- Stage 1: Build React bằng Node.js ---
FROM node:20-alpine as build
WORKDIR /app

# Copy file package để cài thư viện trước
COPY package*.json ./
RUN npm ci 

# Copy toàn bộ code
COPY . .

# Khai báo biến nhận từ GitHub Actions (Build Args)
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_ENV

# Gán giá trị vào biến môi trường để React sử dụng lúc build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

# Build ra thư mục 'build' hoặc 'dist'
RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine

# Copy file build từ Stage 1 sang thư mục mặc định của Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy file cấu hình Nginx custom của mình vào
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]