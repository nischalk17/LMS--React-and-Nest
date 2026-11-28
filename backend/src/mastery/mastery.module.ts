import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasteryController } from './mastery.controller';
import { MasteryService } from './mastery.service';
import { QuizResponse } from '../entities/quiz.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuizResponse, Course, Enrollment])],
  controllers: [MasteryController],
  providers: [MasteryService],
})
export class MasteryModule {}
