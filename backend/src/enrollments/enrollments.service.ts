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

    const enrollment = this.enrollmentRepository.create({
      studentId,
      courseId,
    });

    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Initialize progress for all modules
    const modules = await this.moduleRepository.find({
      where: { courseId },
    });

    const progressEntries = modules.map((module) =>
      this.progressRepository.create({
        enrollmentId: savedEnrollment.id,
        moduleId: module.id,
        isCompleted: false,
        completionPercentage: 0,
      }),
    );

    await this.progressRepository.save(progressEntries);

    return this.enrollmentRepository.findOne({
      where: { id: savedEnrollment.id },
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
    const completedModules = enrollment.progress.filter((p) => p.isCompleted).length;
    const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    return {
      enrollment,
      overallProgress: Math.round(overallProgress),
      completedModules,
      totalModules,
    };
  }
}


