import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  console.log("🚀 Starting Voice Assistant API...");

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  console.log("🔧 Setting up middleware...");

  // Security middleware
  console.log("🛡️ Setting up helmet...");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Skip cookie parser for now - we can add it later if needed
  console.log("⏭️ Skipping cookie parser (not essential for API)...");

  console.log("🌐 Setting up CORS...");
  // CORS configuration
  app.enableCors({
    origin: [
      configService.get("FRONTEND_URL"),
      "http://localhost:8001",
      "http://127.0.0.1:8001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  console.log("✅ Setting up validation pipe...");
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  console.log("📝 Setting up interceptors and filters...");
  // Global interceptors and filters
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  console.log("🔗 Setting up API prefix...");
  // API prefix
  app.setGlobalPrefix("api/v1");

  console.log("📚 Setting up Swagger documentation...");
  // Swagger documentation - Enhanced configuration
  const config = new DocumentBuilder()
    .setTitle("Zenvoice API")
    .setDescription(
      `
      ## Production-ready API for Voice Assistant Dashboard

      This API provides comprehensive authentication and user management functionality including:

      ### 🔐 Authentication Features
      - Email/Password registration and login
      - Google OAuth integration
      - Password reset functionality
      - JWT token-based authentication

      ### 👤 User Management
      - User profile management
      - Account verification
      - Profile updates and deletion

      ### 🛡️ Security Features
      - Rate limiting
      - Input validation
      - Secure password hashing
      - CORS protection

      ### 📧 Email Services
      - Account verification emails
      - Password reset emails
      - HTML email templates

      ---

      **Base URL:** \`/api/v1\`

      **Authentication:** Bearer Token (JWT)
    `,
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag(
      "auth",
      "Authentication endpoints - Sign up, sign in, password reset, Google OAuth",
    )
    .addTag(
      "users",
      "User management endpoints - Profile management, account operations",
    )
    .addTag(
      "assistants",
      "Assistant management endpoints - Create, read, update, delete assistants",
    )
    .addTag(
      "llm",
      "LLM providers and models - Language model configuration options",
    )
    .addTag(
      "synthesizer",
      "Synthesizer providers, models, and voices - Text-to-speech configuration",
    )
    .addTag(
      "transcriber",
      "Transcriber providers and models - Speech-to-text configuration",
    )
    .addTag(
      "prompt",
      "AI prompt generation - Generate structured prompts using OpenAI GPT-4",
    )
    .addTag(
      "phone",
      "Phone service endpoints - Initiate calls, hangup, and retrieve active call",
    )
    .addTag(
      "registered-numbers",
      "Registered phone numbers - Manage user's registered phone numbers for voice calls",
    )
    .addTag(
      "call-logs",
      "Call logs management - Retrieve call history with pagination and filtering",
    )
    .addTag(
      "dashboard",
      "Dashboard metrics - Get aggregated statistics from call logs",
    )
    .addTag(
      "payment",
      "Payment endpoints - PayU integration for payment processing",
    )
    .addServer("http://localhost:8000", "Development server")
    .addServer(configService.get("APP_BASE_URL"), "Production server")
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Setup Swagger UI with custom options (removed external CDN to prevent hanging)
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: "Zenvoice API Documentation",
  });

  // Also setup JSON endpoint for API spec
  SwaggerModule.setup("api/docs-json", app, document);

  const port = configService.get("PORT") || 8000;
  const host = "0.0.0.0"; // Listen on all interfaces

  console.log("🚀 Starting server...");
  console.log(`📍 Attempting to bind to ${host}:${port}...`);

  try {
    await app.listen(port, host);
    console.log(`✅ Server successfully listening on ${host}:${port}`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    throw error;
  }

  logger.log(
    `🚀 Application is running on: http://localhost:${port}`,
    "Bootstrap",
  );
  logger.log(
    `🌐 Server accessible on all interfaces: http://0.0.0.0:${port}`,
    "Bootstrap",
  );
  logger.log(
    `📚 Swagger documentation: http://localhost:${port}/api/docs`,
    "Bootstrap",
  );
  logger.log(
    `📄 API JSON spec: http://localhost:${port}/api/docs-json`,
    "Bootstrap",
  );
  logger.log(
    `🔍 Health check: http://localhost:${port}/api/v1/health`,
    "Bootstrap",
  );
}

bootstrap().catch((error) => {
  Logger.error("❌ Error starting server", error, "Bootstrap");
  process.exit(1);
});
