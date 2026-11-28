import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import {
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizResponse,
} from '../entities/quiz.entity';
import { UserRole } from '../entities/user.entity';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { UpsertQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private quizzes: Repository<Quiz>,
    @InjectRepository(QuizAttempt) private attempts: Repository<QuizAttempt>,
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
  ) {}

  private async getCourse(courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  private async assertOwner(courseId: string, user: AuthUser) {
    const course = await this.getCourse(courseId);
    if (course.instructorId !== user.id) {
      throw new ForbiddenException('Only the course instructor can do this');
    }
    return course;
  }

  private async assertEnrolled(courseId: string, user: AuthUser) {
    await this.getCourse(courseId);
    const enrolled = await this.enrollments.exists({
      where: { studentId: user.id, courseId },
    });
    if (!enrolled || user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Enroll in this course to take its quiz');
    }
  }

  private async loadQuiz(courseId: string) {
    const quiz = await this.quizzes.findOne({
      where: { courseId },
      relations: ['questions'],
      order: { questions: { order: 'ASC' } },
    });
    if (!quiz) {
      throw new NotFoundException('This course has no quiz yet');
    }
    return quiz;
  }

  /** Owner sees the answer key; enrolled students do not. */
  async get(courseId: string, user: AuthUser) {
    const course = await this.getCourse(courseId);
    const isOwner = course.instructorId === user.id;
    if (!isOwner) {
      await this.assertEnrolled(courseId, user);
    }
    const quiz = await this.loadQuiz(courseId);
    return {
      id: quiz.id,
      courseId,
      title: quiz.title,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        skill: q.skill,
        ...(isOwner ? { correctIndex: q.correctIndex } : {}),
      })),
    };
  }

  async upsert(courseId: string, dto: UpsertQuizDto, user: AuthUser) {
    const course = await this.assertOwner(courseId, user);
    dto.questions.forEach((q, i) => {
      if (q.correctIndex >= q.options.length) {
        throw new BadRequestException(
          `Question ${i + 1}: correctIndex must point at one of its options`,
        );
      }
    });

    await this.quizzes.manager.transaction(async (manager) => {
      let quiz = await manager.findOne(Quiz, { where: { courseId } });
      if (quiz) {
        quiz.title = dto.title;
        quiz.passingScore = dto.passingScore;
        await manager.save(quiz);
      } else {
        quiz = await manager.save(
          manager.create(Quiz, {
            courseId,
            title: dto.title,
            passingScore: dto.passingScore,
          }),
        );
      }

      // Questions that arrive with an existing id are updated in place, so the
      // answer history of students stays linked to them. New ones are inserted
      // and any that were left out are removed.
      const existing = await manager.find(QuizQuestion, {
        where: { quizId: quiz.id },
      });
      const existingById = new Map(existing.map((q) => [q.id, q]));
      const keptIds = new Set<string>();

      const rows = dto.questions.map((q, order) => {
        const fields = {
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          skill: q.skill ?? course.title,
          order,
        };
        const current = q.id ? existingById.get(q.id) : undefined;
        if (current) {
          keptIds.add(current.id);
          return Object.assign(current, fields);
        }
        return manager.create(QuizQuestion, { ...fields, quizId: quiz.id });
      });

      const removed = existing.filter((q) => !keptIds.has(q.id));
      if (removed.length) {
        await manager.remove(removed);
      }
      await manager.save(rows);
    });
    return this.get(courseId, user);
  }

  async remove(courseId: string, user: AuthUser) {
    await this.assertOwner(courseId, user);
    const quiz = await this.loadQuiz(courseId);
    await this.quizzes.remove(quiz);
    return { message: 'Quiz deleted successfully' };
  }

  async submit(courseId: string, answers: number[], user: AuthUser) {
    await this.assertEnrolled(courseId, user);
    const course = await this.getCourse(courseId);
    const quiz = await this.loadQuiz(courseId);

    if (answers.length !== quiz.questions.length) {
      throw new BadRequestException(
        `Answer all ${quiz.questions.length} questions`,
      );
    }
    const results = quiz.questions.map((q, i) => {
      if (answers[i] >= q.options.length) {
        throw new BadRequestException(`Question ${i + 1}: invalid option`);
      }
      return answers[i] === q.correctIndex;
    });

    const correct = results.filter(Boolean).length;
    const score = Math.round((correct / quiz.questions.length) * 100);

    // The attempt and one response row per question are written together, so
    // the per-question history used for knowledge tracing is never partial.
    const attempt = await this.attempts.manager.transaction(async (manager) => {
      const saved = await manager.save(
        manager.create(QuizAttempt, {
          quizId: quiz.id,
          studentId: user.id,
          score,
          passed: score >= quiz.passingScore,
        }),
      );
      await manager.save(
        quiz.questions.map((q, i) =>
          manager.create(QuizResponse, {
            attemptId: saved.id,
            quizId: quiz.id,
            questionId: q.id,
            studentId: user.id,
            skill: q.skill ?? course.title,
            selectedIndex: answers[i],
            correct: results[i],
          }),
        ),
      );
      return saved;
    });
    return {
      id: attempt.id,
      score,
      passed: attempt.passed,
      correct,
      total: quiz.questions.length,
      passingScore: quiz.passingScore,
      results, // which answers were right, without revealing the key
    };
  }

  async myAttempts(courseId: string, user: AuthUser) {
    await this.assertEnrolled(courseId, user);
    const quiz = await this.quizzes.findOne({ where: { courseId } });
    if (!quiz) return [];
    return this.attempts.find({
      where: { quizId: quiz.id, studentId: user.id },
      order: { createdAt: 'DESC' },
      select: ['id', 'score', 'passed', 'createdAt'],
    });
  }
}
