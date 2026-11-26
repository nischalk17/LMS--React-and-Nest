import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { UserRole } from '../entities/user.entity';
import { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  /** Course members only: its instructor, or students enrolled in it. */
  private async assertMember(courseId: string, user: AuthUser) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    const isOwner = course.instructorId === user.id;
    const isEnrolled =
      !isOwner &&
      (await this.enrollmentRepository.exists({
        where: { studentId: user.id, courseId },
      }));
    if (!isOwner && !isEnrolled) {
      throw new ForbiddenException(
        'Only the instructor and enrolled students can use Q&A',
      );
    }
    return { course, isOwner };
  }

  private present(q: Question) {
    return {
      id: q.id,
      courseId: q.courseId,
      body: q.body,
      createdAt: q.createdAt,
      author: q.author && {
        id: q.author.id,
        firstName: q.author.firstName,
        lastName: q.author.lastName,
      },
      answer: q.answer,
      answeredAt: q.answeredAt,
      answeredBy: q.answeredBy && {
        id: q.answeredBy.id,
        firstName: q.answeredBy.firstName,
        lastName: q.answeredBy.lastName,
      },
    };
  }

  async list(courseId: string, user: AuthUser) {
    await this.assertMember(courseId, user);
    const questions = await this.questionRepository.find({
      where: { courseId },
      relations: ['author', 'answeredBy'],
      order: { createdAt: 'DESC' },
    });
    return questions.map((q) => this.present(q));
  }

  async create(courseId: string, body: string, user: AuthUser) {
    await this.assertMember(courseId, user);
    const saved = await this.questionRepository.save(
      this.questionRepository.create({ courseId, authorId: user.id, body }),
    );
    return this.findPresented(saved.id);
  }

  async answer(questionId: string, answer: string, user: AuthUser) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['course'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (
      user.role !== UserRole.INSTRUCTOR ||
      question.course.instructorId !== user.id
    ) {
      throw new ForbiddenException(
        'Only the course instructor can answer questions',
      );
    }
    await this.questionRepository.update(questionId, {
      answer,
      answeredById: user.id,
      answeredAt: new Date(),
    });
    return this.findPresented(questionId);
  }

  private async findPresented(id: string) {
    const q = await this.questionRepository.findOneOrFail({
      where: { id },
      relations: ['author', 'answeredBy'],
    });
    return this.present(q);
  }
}
