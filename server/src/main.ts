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
      crossOriginEmbedderPolicy: false,
    }),
  );

  console.log("🌐 Setting up CORS...");

  // ✅ FIXED CORS CONFIG
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "https://voice.recoveragent.ai", // ✅ YOUR FRONTEND
      ];

      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  console.log("✅ Setting up validation pipe...");

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

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  console.log("🔗 Setting up API prefix...");
  app.setGlobalPrefix("api/v1");

  console.log("📚 Setting up Swagger documentation...");

  const config = new DocumentBuilder()
    .setTitle("Zenvoice API")
    .setDescription("Voice Assistant API")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "JWT-auth",
    )
    .addServer("http://localhost:8000", "Development")
    .addServer(
      configService.get("APP_BASE_URL") || "https://voice.recoveragent.ai",
      "Production",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get("PORT") || 8000;
  const host = "0.0.0.0";

  console.log(`🚀 Starting server on ${host}:${port}...`);

  await app.listen(port, host);

  console.log(`✅ Server running at http://${host}:${port}`);
}

bootstrap().catch((error) => {
  Logger.error("❌ Error starting server", error, "Bootstrap");
  process.exit(1);
});
