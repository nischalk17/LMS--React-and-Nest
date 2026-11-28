import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { setupApp } from './setup-app';
import { seedAccounts } from './seed-accounts';
import { seedContent } from './seed-content';
import { seedDemoActivity } from './seed-demo-activity';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind Render/Vercel/nginx the client IP arrives in X-Forwarded-For.
  // Without this every user shares the proxy's IP, so rate limits hit everyone at once.
  app.set('trust proxy', 1);
  app.enableShutdownHooks();
  setupApp(app, true);

  // Opt-in: create the demo accounts on boot (hosts without a shell, e.g. Render
  // free). Idempotent, and a failure must not stop the API from starting.
  if (process.env.SEED_ON_BOOT === 'true') {
    try {
      const ds = app.get(DataSource);
      const { instructor } = await seedAccounts(ds);
      Logger.log('Demo accounts ensured (SEED_ON_BOOT)', 'Bootstrap');
      // Courses, quizzes and simulated learners take minutes over a remote
      // database, so they run in the background while the API starts serving.
      void (async () => {
        try {
          await seedContent(ds, instructor);
          await seedDemoActivity(ds);
          Logger.log('Demo content seeded (SEED_ON_BOOT)', 'Bootstrap');
        } catch (err) {
          Logger.error(`Demo content seed failed: ${String(err)}`, 'Bootstrap');
        }
      })();
    } catch (err) {
      Logger.error(`SEED_ON_BOOT failed: ${String(err)}`, 'Bootstrap');
    }
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API running on port ${port} (Swagger UI at /docs)`, 'Bootstrap');
}
void bootstrap();
