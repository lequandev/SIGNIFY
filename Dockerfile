# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY SIGNIFY_BE/pom.xml .
COPY SIGNIFY_BE/src ./src
COPY SIGNIFY_BE/slug-aliases.csv ./slug-aliases.csv
RUN mkdir -p /app/assets
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/slug-aliases.csv ./slug-aliases.csv
RUN mkdir -p /app/assets
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
