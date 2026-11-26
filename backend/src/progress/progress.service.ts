import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from '../entities/progress.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Module } from '../entities/module.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
  ) {}

  private async getOwnEnrollment(enrollmentId: string, studentId: string) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, studentId },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    return enrollment;
  }

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    completionPercentage: number,
    studentId: string,
  ) {
    const enrollment = await this.getOwnEnrollment(enrollmentId, studentId);

    // the module must belong to the course the student is enrolled in
    const moduleInCourse = await this.moduleRepository.exists({
      where: { id: moduleId, courseId: enrollment.courseId },
    });
    if (!moduleInCourse) {
      throw new NotFoundException('Module not found in this course');
    }

    const progress =
      (await this.progressRepository.findOne({
        where: { enrollmentId, moduleId },
      })) ?? this.progressRepository.create({ enrollmentId, moduleId });

    progress.completionPercentage = completionPercentage;
    progress.isCompleted = completionPercentage >= 100;
    return this.progressRepository.save(progress);
  }

  async getModuleProgress(
    enrollmentId: string,
    moduleId: string,
    studentId: string,
  ) {
    await this.getOwnEnrollment(enrollmentId, studentId);

    const progress = await this.progressRepository.findOne({
      where: { enrollmentId, moduleId },
      relations: ['module'],
    });
    if (!progress) {
      throw new NotFoundException('Progress not found');
    }
    return progress;
  }
}
