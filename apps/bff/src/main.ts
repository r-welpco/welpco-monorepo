import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';

/** Origins allowed for credentialed browser requests (web app, admin app, etc.). */
function buildAllowedCorsOrigins(): string[] {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const explicit = process.env.CORS_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (explicit?.length) {
    return [...new Set(explicit)];
  }

  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (isDevelopment) {
    const dev = new Set<string>([
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
    ]);
    if (frontendUrl) dev.add(frontendUrl);
    return [...dev];
  }

  if (frontendUrl) return [frontendUrl];
  return ['http://localhost:8080'];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Security headers (API is called cross-origin from Next apps; avoid blocking fetch)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // BFF is an API; CSP is primarily enforced by the Next.js frontend.
      // Disable helmet's default CSP so it doesn't interfere with API responses.
      contentSecurityPolicy: false,
      hsts: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
    }),
  );

  const allowedOrigins = buildAllowedCorsOrigins();

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Body parsers must use Nest's useBodyParser (not raw express.json) so req.rawBody is
  // set for Stripe webhook signature verification. Custom express.json() in bootstrap
  // runs before Nest registers parsers on listen() and breaks webhooks.
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: false });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Welpco BFF API')
    .setDescription(
      'Backend for Frontend API. Aggregates and proxies requests to microservices.',
    )
    .setVersion('1.0')
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
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Profiles', 'Profile management endpoints')
    .addTag('Dashboard', 'Dashboard data aggregation endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Welpco BFF API',
      customJs: [
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.3/swagger-ui-bundle.js',
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js',
      ],
      customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.3/swagger-ui.css',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`BFF service is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
