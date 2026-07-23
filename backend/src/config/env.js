const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://mongo:27017/car_data_db",
  jwtSecret: process.env.JWT_SECRET || "change-me-very-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  adminEmail: process.env.ADMIN_EMAIL || "admin@carinfo.local",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin123!",
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || "minio",
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    bucketName: process.env.MINIO_BUCKET_NAME || "car-images",
    publicUrl: process.env.MINIO_PUBLIC_URL || "http://localhost:9000"
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || "https://ollama.if.unismuh.ac.id",
    model: process.env.OLLAMA_MODEL || "llama3.2:latest"
  }
};
