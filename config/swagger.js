const swaggerJsdoc = require("swagger-jsdoc");

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinConnect API Documentation",
      version: "1.0.0",
      description: "API documentation for the FinConnect fintech application",
      contact: {
        name: "API Support",
        email: "support@finconnect.com",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
