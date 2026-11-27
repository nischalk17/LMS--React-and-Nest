import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Progress } from '../entities/progress.entity';
import { Question } from '../entities/question.entity';
import { QuizResponse } from '../entities/quiz.entity';

export interface CourseAnalytics {
  courseId: string;
  title: string;
  isPublished: boolean;
  modules: number;
  students: number;
  /** Completed module slots / (students x modules), 0-100. */
  averageProgress: number;
  unansweredQuestions: number;
  /** Lowest class accuracy first; skills with fewer than 5 answers are left out. */
  weakestSkills: { skill: string; accuracy: number; answers: number }[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
    @InjectRepository(Question) private questions: Repository<Question>,
    @InjectRepository(QuizResponse) private responses: Repository<QuizResponse>,
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

    const [students, completed, unanswered, skillRows] = await Promise.all([
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
      this.responses
        .createQueryBuilder('r')
        .innerJoin('quizzes', 'z', 'z.id = r."quizId"')
        .innerJoin(
          'courses',
          'c',
          'c.id = z."courseId" AND c."instructorId" = :instructorId',
          {
            instructorId,
          },
        )
        .select('z."courseId"', 'courseId')
        .addSelect('r.skill', 'skill')
        .addSelect('COUNT(*)', 'answers')
        .addSelect('SUM(CASE WHEN r.correct THEN 1 ELSE 0 END)', 'right')
        .groupBy('z."courseId"')
        .addGroupBy('r.skill')
        .getRawMany<{
          courseId: string;
          skill: string;
          answers: string;
          right: string;
        }>(),
    ]);

    const studentsBy = this.toMap(students);
    const completedBy = this.toMap(completed);
    const unansweredBy = this.toMap(unanswered);
    const skillsBy = new Map<string, CourseAnalytics['weakestSkills']>();
    for (const row of skillRows) {
      const answers = Number(row.answers);
      if (answers < 5) continue;
      const list = skillsBy.get(row.courseId) ?? [];
      list.push({
        skill: row.skill,
        answers,
        accuracy: Math.round((Number(row.right) / answers) * 100) / 100,
      });
      skillsBy.set(row.courseId, list);
    }

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
        weakestSkills: (skillsBy.get(course.id) ?? [])
          .sort(
            (a, b) => a.accuracy - b.accuracy || a.skill.localeCompare(b.skill),
          )
          .slice(0, 3),
      };
    });
  }
}
