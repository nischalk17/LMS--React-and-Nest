import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Question } from '../entities/question.entity';
import { ListQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Question) private questions: Repository<Question>,
  ) {}

  async stats() {
    const [students, instructors, admins] = await Promise.all(
      [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN].map((role) =>
        this.users.count({ where: { role } }),
      ),
    );
    const [published, drafts, enrollments, questions] = await Promise.all([
      this.courses.count({ where: { isPublished: true } }),
      this.courses.count({ where: { isPublished: false } }),
      this.enrollments.count(),
      this.questions.count(),
    ]);
    return {
      users: { students, instructors, admins },
      courses: { published, drafts },
      enrollments,
      questions,
    };
  }

  async listUsers({ search, page, limit }: ListQueryDto) {
    const term = search ? `%${search}%` : undefined;
    const where = term
      ? [
          { email: ILike(term) },
          { firstName: ILike(term) },
          { lastName: ILike(term) },
        ]
      : {};
    const [items, total] = await this.users.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async setRole(targetId: string, role: UserRole, adminId: string) {
    if (targetId === adminId) {
      throw new BadRequestException('You cannot change your own role');
    }
    const user = await this.getUser(targetId);
    user.role = role;
    return this.users.save(user);
  }

  async removeUser(targetId: string, adminId: string) {
    if (targetId === adminId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.users.remove(await this.getUser(targetId));
    return { message: 'User deleted successfully' };
  }

  async listCourses({ search, page, limit }: ListQueryDto) {
    const [items, total] = await this.courses.findAndCount({
      where: search ? { title: ILike(`%${search}%`) } : {},
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async setPublished(courseId: string, isPublished: boolean) {
    const course = await this.getCourse(courseId);
    course.isPublished = isPublished;
    return this.courses.save(course);
  }

  async removeCourse(courseId: string) {
    await this.courses.remove(await this.getCourse(courseId));
    return { message: 'Course deleted successfully' };
  }

  private async getUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async getCourse(id: string) {
    const course = await this.courses.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }
}
