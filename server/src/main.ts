import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL'),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

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

  // Global interceptors and filters
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation - Enhanced configuration
  const config = new DocumentBuilder()
    .setTitle('Voice Assistant API')
    .setDescription(`
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
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints - Sign up, sign in, password reset, Google OAuth')
    .addTag('users', 'User management endpoints - Profile management, account operations')
    .addServer('http://localhost:5000', 'Development server')
    .addServer('https://your-production-domain.com', 'Production server')
    .setContact(
      'API Support',
      'https://your-website.com/support',
      'support@your-domain.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Setup Swagger UI with custom options
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Voice Assistant API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  // Also setup JSON endpoint for API spec
  SwaggerModule.setup('api/docs-json', app, document);

  const port = configService.get('PORT') || 5000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`📄 API JSON spec: http://localhost:${port}/api/docs-json`, 'Bootstrap');
  logger.log(`🔍 Health check: http://localhost:${port}/api/v1/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});