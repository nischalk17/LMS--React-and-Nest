import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Course } from '../entities/course.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Progress } from '../entities/progress.entity';
import { Question } from '../entities/question.entity';
import { QuizResponse } from '../entities/quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      ModuleEntity,
      Enrollment,
      Progress,
      Question,
      QuizResponse,
    ]),
  ],
  controllers: [CoursesController, AnalyticsController],
  providers: [CoursesService, AnalyticsService],
})
export class CoursesModule {}
