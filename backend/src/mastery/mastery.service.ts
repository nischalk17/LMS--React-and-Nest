import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { QuizResponse } from '../entities/quiz.entity';
import { MASTERY_MODEL } from './mastery-model';
import { computeMastery, ResponseRow } from './mastery.features';
import type { MasteryModel } from './mastery.model';

@Injectable()
export class MasteryService {
  /** Overridable in tests; production uses the model shipped in mastery-model.ts. */
  model: MasteryModel | null = MASTERY_MODEL;

  constructor(
    @InjectRepository(QuizResponse)
    private responses: Repository<QuizResponse>,
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
  ) {}

  /**
   * Per-skill mastery for one student in one course, weakest skill first.
   * History is restricted to this course so skill names cannot collide across
   * courses.
   */
  async forStudent(courseId: string, studentId: string) {
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    const enrolled = await this.enrollments.exists({
      where: { studentId, courseId },
    });
    if (!enrolled) {
      throw new ForbiddenException('Enroll in this course to see your mastery');
    }

    // Oldest first. Rows of one attempt share a timestamp, so break ties by the
    // question's position in the quiz (NULL for questions removed since).
    const rows = await this.responses
      .createQueryBuilder('r')
      .innerJoin('quizzes', 'z', 'z.id = r."quizId"')
      .leftJoin('quiz_questions', 'q', 'q.id = r."questionId"')
      .select('r.skill', 'skill')
      .addSelect('r.correct', 'correct')
      .where('r."studentId" = :studentId', { studentId })
      .andWhere('z."courseId" = :courseId', { courseId })
      .orderBy('r."createdAt"', 'ASC')
      .addOrderBy('q."order"', 'ASC', 'NULLS LAST')
      .addOrderBy('r.id', 'ASC')
      .getRawMany<ResponseRow>();

    const skills = computeMastery(rows, this.model);
    return {
      courseId,
      method: this.model ? 'model' : 'estimate',
      model: this.model
        ? {
            dataset: this.model.trainedOn.dataset,
            heldOutAuc: this.model.heldOut.auc,
          }
        : null,
      totalAnswers: rows.length,
      skills,
    };
  }
}
