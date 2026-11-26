import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Connects through DATABASE_URL (Neon, Render, ...) when set, otherwise through
 * the individual DB_* variables (local Postgres / docker compose).
 * Schema: migrations run on boot (migrationsRun) unless DB_SYNCHRONIZE=true.
 */
export const getDatabaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const url = config.get<string>('DATABASE_URL');
  const ssl = config.get<string>('DB_SSL') === 'true';
  const synchronize = config.get<string>('DB_SYNCHRONIZE') === 'true';

  return {
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get('DB_PORT', 5432)),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_NAME', 'lms_db'),
        }),
    ssl:
      ssl || !!url?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
    autoLoadEntities: true,
    synchronize,
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: !synchronize,
    logging: config.get('NODE_ENV') === 'development',
  };
};
