import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind Render/Vercel/nginx the client IP arrives in X-Forwarded-For.
  // Without this every user shares the proxy's IP, so rate limits hit everyone at once.
  app.set('trust proxy', 1);
  app.enableShutdownHooks();
  setupApp(app, true);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API running on port ${port} (Swagger UI at /docs)`, 'Bootstrap');
}
void bootstrap();
