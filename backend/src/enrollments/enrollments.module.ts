import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { Enrollment } from '../entities/enrollment.entity';
import { Course } from '../entities/course.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Progress } from '../entities/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Course, ModuleEntity, Progress])],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
