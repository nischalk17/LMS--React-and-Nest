import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Module } from '../entities/module.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
  ) {}

  async create(createCourseDto: CreateCourseDto, instructorId: string) {
    const course = this.courseRepository.create({
      ...createCourseDto,
      instructorId,
    });
    return this.courseRepository.save(course);
  }

  async findAll(publishedOnly: boolean = false) {
    const where = publishedOnly ? { isPublished: true } : {};
    return this.courseRepository.find({
      where,
      relations: ['instructor', 'modules'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules'],
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, userId: string) {
    const course = await this.findOne(id);
    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }
    Object.assign(course, updateCourseDto);
    return this.courseRepository.save(course);
  }

  async remove(id: string, userId: string) {
    const course = await this.findOne(id);
    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }
    await this.courseRepository.remove(course);
    return { message: 'Course deleted successfully' };
  }

  async addModule(courseId: string, createModuleDto: CreateModuleDto, userId: string) {
    const course = await this.findOne(courseId);
    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only add modules to your own courses');
    }
    const module = this.moduleRepository.create({
      ...createModuleDto,
      courseId,
    });
    return this.moduleRepository.save(module);
  }

  async updateModule(moduleId: string, updateDto: Partial<CreateModuleDto>, userId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    if (module.course.instructorId !== userId) {
      throw new ForbiddenException('You can only update modules in your own courses');
    }
    Object.assign(module, updateDto);
    return this.moduleRepository.save(module);
  }

  async removeModule(moduleId: string, userId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['course'],
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    if (module.course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete modules from your own courses');
    }
    await this.moduleRepository.remove(module);
    return { message: 'Module deleted successfully' };
  }
}


