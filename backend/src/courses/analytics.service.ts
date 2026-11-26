import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Progress } from '../entities/progress.entity';
import { Question } from '../entities/question.entity';

export interface CourseAnalytics {
  courseId: string;
  title: string;
  isPublished: boolean;
  modules: number;
  students: number;
  /** Completed module slots / (students x modules), 0-100. */
  averageProgress: number;
  unansweredQuestions: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
    @InjectRepository(Question) private questions: Repository<Question>,
  ) {}

  private toMap(rows: { courseId: string; n: string }[]) {
    return new Map(rows.map((r) => [r.courseId, Number(r.n)]));
  }

  async forInstructor(instructorId: string): Promise<CourseAnalytics[]> {
    const courses = await this.courses.find({
      where: { instructorId },
      relations: ['modules'],
      order: { createdAt: 'DESC' },
    });
    if (courses.length === 0) return [];

    const [students, completed, unanswered] = await Promise.all([
      this.enrollments
        .createQueryBuilder('e')
        .select('e.courseId', 'courseId')
        .addSelect('COUNT(*)', 'n')
        .innerJoin('e.course', 'c', 'c.instructorId = :instructorId', {
          instructorId,
        })
        .groupBy('e.courseId')
        .getRawMany<{ courseId: string; n: string }>(),
      this.progress
        .createQueryBuilder('p')
        .select('e.courseId', 'courseId')
        .addSelect('COUNT(*)', 'n')
        .innerJoin('p.enrollment', 'e')
        .innerJoin('e.course', 'c', 'c.instructorId = :instructorId', {
          instructorId,
        })
        .where('p.isCompleted = true')
        .groupBy('e.courseId')
        .getRawMany<{ courseId: string; n: string }>(),
      this.questions
        .createQueryBuilder('q')
        .select('q.courseId', 'courseId')
        .addSelect('COUNT(*)', 'n')
        .innerJoin('q.course', 'c', 'c.instructorId = :instructorId', {
          instructorId,
        })
        .where('q.answer IS NULL')
        .groupBy('q.courseId')
        .getRawMany<{ courseId: string; n: string }>(),
    ]);

    const studentsBy = this.toMap(students);
    const completedBy = this.toMap(completed);
    const unansweredBy = this.toMap(unanswered);

    return courses.map((course) => {
      const studentCount = studentsBy.get(course.id) ?? 0;
      const slots = studentCount * course.modules.length;
      return {
        courseId: course.id,
        title: course.title,
        isPublished: course.isPublished,
        modules: course.modules.length,
        students: studentCount,
        averageProgress:
          slots > 0
            ? Math.round(((completedBy.get(course.id) ?? 0) / slots) * 100)
            : 0,
        unansweredQuestions: unansweredBy.get(course.id) ?? 0,
      };
    });
  }
}
