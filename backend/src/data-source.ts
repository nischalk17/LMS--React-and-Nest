import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Course } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Progress } from './entities/progress.entity';
import { Question } from './entities/question.entity';
import { Quiz, QuizAttempt, QuizQuestion } from './entities/quiz.entity';

/** Used by the TypeORM CLI (migrations) and the seed script. */
const url = process.env.DATABASE_URL;
const useSsl =
  process.env.DB_SSL === 'true' || !!url?.includes('sslmode=require');

export default new DataSource({
  type: 'postgres',
  ...(url
    ? { url }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'lms_db',
      }),
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    Course,
    Module,
    Enrollment,
    Progress,
    Question,
    Quiz,
    QuizQuestion,
    QuizAttempt,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
