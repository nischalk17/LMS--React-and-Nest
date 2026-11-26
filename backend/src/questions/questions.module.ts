import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../entities/question.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Course, Enrollment])],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
