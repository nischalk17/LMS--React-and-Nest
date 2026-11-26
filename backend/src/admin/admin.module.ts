import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Question } from '../entities/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, Enrollment, Question])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
