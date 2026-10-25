FROM eclipse-temurin:17-jre

# Apache POI uses font metrics when adjusting Excel column widths.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY it-equipment-1.0.0.jar /app/it-equipment.jar
ENTRYPOINT ["java", "-Dfile.encoding=UTF-8", "-jar", "/app/it-equipment.jar"]
