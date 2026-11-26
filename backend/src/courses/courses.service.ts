import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Module } from '../entities/module.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { UserRole } from '../entities/user.entity';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  create(dto: CreateCourseDto, instructorId: string) {
    return this.courseRepository.save(
      this.courseRepository.create({ ...dto, instructorId }),
    );
  }

  /** Published catalog, or (instructors only) their own courses incl. drafts. */
  findAll(user: AuthUser, publishedOnly: boolean) {
    const where =
      !publishedOnly && user.role === UserRole.INSTRUCTOR
        ? { instructorId: user.id }
        : { isPublished: true };
    return this.courseRepository.find({
      where,
      relations: ['instructor', 'modules'],
      order: { createdAt: 'DESC', modules: { order: 'ASC' } },
    });
  }

  /**
   * Drafts are visible to their owner only. Module content is hidden unless the
   * caller owns the course or is enrolled in it.
   */
  async findOne(id: string, user: AuthUser) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules'],
      order: { modules: { order: 'ASC' } },
    });
    const isOwner = course?.instructorId === user.id;
    if (!course || (!course.isPublished && !isOwner)) {
      throw new NotFoundException('Course not found');
    }
    if (!isOwner) {
      const enrolled = await this.enrollmentRepository.exists({
        where: { studentId: user.id, courseId: id },
      });
      if (!enrolled) {
        course.modules = course.modules.map(
          (m) =>
            ({
              ...m,
              content: null,
              videoUrl: null,
              pdfUrl: null,
            }) as unknown as Module,
        );
      }
    }
    return course;
  }

  private async getOwnedCourse(id: string, userId: string, action: string) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.instructorId !== userId) {
      throw new ForbiddenException(`You can only ${action} your own courses`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, userId: string) {
    const course = await this.getOwnedCourse(id, userId, 'update');
    Object.assign(course, dto);
    return this.courseRepository.save(course);
  }

  async remove(id: string, userId: string) {
    const course = await this.getOwnedCourse(id, userId, 'delete');
    await this.courseRepository.remove(course);
    return { message: 'Course deleted successfully' };
  }

  async addModule(courseId: string, dto: CreateModuleDto, userId: string) {
    await this.getOwnedCourse(courseId, userId, 'add modules to');
    return this.moduleRepository.save(
      this.moduleRepository.create({ ...dto, courseId }),
    );
  }

  private async getOwnedModule(moduleId: string, userId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    if (module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only change modules in your own courses',
      );
    }
    return module;
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto, userId: string) {
    const module = await this.getOwnedModule(moduleId, userId);
    Object.assign(module, dto);
    return this.moduleRepository.save(module);
  }

  async removeModule(moduleId: string, userId: string) {
    const module = await this.getOwnedModule(moduleId, userId);
    await this.moduleRepository.remove(module);
    return { message: 'Module deleted successfully' };
  }
}
