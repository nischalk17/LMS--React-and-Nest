import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/** "https://a.app/, http://localhost:5173" -> ["https://a.app", "http://localhost:5173"] */
export function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/** Shared by main.ts and the e2e tests so both run the same pipeline. */
export function setupApp(app: INestApplication, withDocs = false) {
  // The API only returns JSON, and Swagger UI needs inline scripts, so the
  // default Content-Security-Policy would only break /docs.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: parseOrigins(process.env.FRONTEND_URL),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (withDocs) {
    const config = new DocumentBuilder()
      .setTitle('Traceback LMS API')
      .setDescription('Courses, enrollments and progress tracking')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }
}
