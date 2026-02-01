# --- Stage 1: Build bằng Maven ---
FROM maven:3.9-amazoncorretto-21 AS build
WORKDIR /app

# Copy file config maven trước để tận dụng cache
COPY pom.xml .
# Tải các thư viện về (bước này sẽ được cache nếu pom.xml không đổi)
RUN mvn dependency:go-offline --no-transfer-progress -q

# Copy toàn bộ source code vào
COPY src ./src

# Build ra file .jar (bỏ qua test unit để build cho nhanh lúc deploy)
RUN mvn clean package -DskipTests --no-transfer-progress -q

# --- Stage 2: Chạy App bằng Amazon Corretto ---
FROM amazoncorretto:21-alpine
WORKDIR /app

# Copy file .jar từ giai đoạn build sang giai đoạn chạy
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Lệnh chạy app
ENTRYPOINT ["java", "-jar", "app.jar"]