import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from '../entities/progress.entity';
import { Enrollment } from '../entities/enrollment.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    completionPercentage: number,
    studentId: string,
  ) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, studentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    let progress = await this.progressRepository.findOne({
      where: { enrollmentId, moduleId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        enrollmentId,
        moduleId,
        completionPercentage,
        isCompleted: completionPercentage >= 100,
      });
    } else {
      progress.completionPercentage = completionPercentage;
      progress.isCompleted = completionPercentage >= 100;
    }

    return this.progressRepository.save(progress);
  }

  async getModuleProgress(enrollmentId: string, moduleId: string, studentId: string) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, studentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

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


