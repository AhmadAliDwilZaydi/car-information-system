const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Car Information System API",
    version: "1.0.0",
    description: "REST API for Car Data Information System — basis data informasi kendaraan skala besar dengan AI Chatbot (Ollama RAG), MinIO object storage, dan JWT Admin authentication."
  },
  servers: [
    {
      url: "/api/v1",
      description: "Base API"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: [
    path.join(__dirname, "../routes/*.js").replace(/\\/g, "/"),
    path.join(__dirname, "../models/*.js").replace(/\\/g, "/")
  ]
});

module.exports = swaggerSpec;
