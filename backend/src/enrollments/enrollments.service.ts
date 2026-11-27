import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { Course } from '../entities/course.entity';
import { Module } from '../entities/module.entity';
import { Progress } from '../entities/progress.entity';
import { isUniqueViolation } from '../common/db-errors';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
  ) {}

  async enroll(studentId: string, courseId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPublished) {
      throw new NotFoundException('Course is not available for enrollment');
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { studentId, courseId },
    });

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Enrollment and its progress rows are created atomically, so a failure
    // can never leave a half-enrolled student. A concurrent double-click hits the
    // unique constraint and is reported as 409, not 500.
    let enrollmentId: string;
    try {
      enrollmentId = await this.enrollmentRepository.manager.transaction(
        async (manager) => {
          const saved = await manager.save(
            manager.create(Enrollment, { studentId, courseId }),
          );
          const modules = await manager.find(Module, { where: { courseId } });
          await manager.save(
            modules.map((module) =>
              manager.create(Progress, {
                enrollmentId: saved.id,
                moduleId: module.id,
                isCompleted: false,
                completionPercentage: 0,
              }),
            ),
          );
          return saved.id;
        },
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException('Already enrolled in this course');
      }
      throw err;
    }

    return this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'course.modules'],
    });
  }

  async getStudentEnrollments(studentId: string) {
    return this.enrollmentRepository.find({
      where: { studentId },
      relations: ['course', 'course.instructor', 'course.modules', 'progress'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async getEnrollmentProgress(enrollmentId: string, studentId: string) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, studentId },
      relations: ['course', 'course.modules', 'progress', 'progress.module'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const totalModules = enrollment.course.modules.length;
    const completedModules = enrollment.progress.filter(
      (p) => p.isCompleted,
    ).length;
    const overallProgress =
      totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    return {
      enrollment,
      overallProgress: Math.round(overallProgress),
      completedModules,
      totalModules,
    };
  }
}
