# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY slug-aliases.csv ./slug-aliases.csv
COPY assets ./assets
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/slug-aliases.csv ./slug-aliases.csv
COPY --from=build /app/assets ./assets
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
