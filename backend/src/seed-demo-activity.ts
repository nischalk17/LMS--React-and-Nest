import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Module } from './entities/module.entity';
import { Progress } from './entities/progress.entity';
import {
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizResponse,
} from './entities/quiz.entity';
import { User, UserRole } from './entities/user.entity';

/**
 * SYNTHETIC demo activity. These learners are simulated (latent ability,
 * skill difficulty, improvement with practice) so the mastery and instructor
 * screens are not empty on a fresh deployment. They are named "Simulated
 * Learner NN" and use @demo.lms.dev addresses so nobody mistakes them for
 * real users. Deterministic: the same seed always produces the same data.
 */

/** Small seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const normal = (r: () => number) =>
  Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Extra difficulty per skill, so the instructor sees a believable weak spot. */
const SKILL_DIFFICULTY: Record<string, number> = {
  Generics: 0.9,
  Validation: 0.6,
  Authentication: 0.4,
};

const DAY = 24 * 60 * 60 * 1000;

async function enroll(
  ds: DataSource,
  studentId: string,
  course: Course,
): Promise<void> {
  const enrollments = ds.getRepository(Enrollment);
  if (await enrollments.exists({ where: { studentId, courseId: course.id } })) {
    return;
  }
  const enrollment = await enrollments.save(
    enrollments.create({ studentId, courseId: course.id }),
  );
  const modules = await ds
    .getRepository(Module)
    .find({ where: { courseId: course.id } });
  await ds.getRepository(Progress).save(
    modules.map((m) =>
      ds.getRepository(Progress).create({
        enrollmentId: enrollment.id,
        moduleId: m.id,
        isCompleted: false,
        completionPercentage: 0,
      }),
    ),
  );
}

/** Simulates `attempts` quiz attempts for one student and stores them. */
async function simulateAttempts(
  ds: DataSource,
  quiz: Quiz,
  questions: QuizQuestion[],
  studentId: string,
  ability: number,
  attempts: number,
  next: () => number,
  daysAgoStart: number,
) {
  const attemptRepo = ds.getRepository(QuizAttempt);
  const responseRepo = ds.getRepository(QuizResponse);
  const now = Date.now();

  for (let k = 0; k < attempts; k++) {
    const createdAt = new Date(
      now - (daysAgoStart - k * 2) * DAY + Math.floor(next() * 3_600_000),
    );
    const rows = questions.map((q) => {
      const skill = q.skill ?? 'General';
      // learning: each earlier attempt makes the next one a bit easier
      const logit = ability + 0.4 - (SKILL_DIFFICULTY[skill] ?? 0) + 0.35 * k;
      const correct = next() < sigmoid(logit);
      const wrong = q.options.findIndex((_, i) => i !== q.correctIndex);
      return {
        q,
        skill,
        correct,
        selectedIndex: correct ? q.correctIndex : wrong,
      };
    });
    const right = rows.filter((r) => r.correct).length;
    const score = Math.round((right / rows.length) * 100);

    const attempt = await attemptRepo.save(
      attemptRepo.create({
        quizId: quiz.id,
        studentId,
        score,
        passed: score >= quiz.passingScore,
        createdAt,
      }),
    );
    await responseRepo.save(
      rows.map((r) =>
        responseRepo.create({
          attemptId: attempt.id,
          quizId: quiz.id,
          questionId: r.q.id,
          studentId,
          skill: r.skill,
          selectedIndex: r.selectedIndex,
          correct: r.correct,
          createdAt,
        }),
      ),
    );
  }
}

export async function seedDemoActivity(ds: DataSource): Promise<void> {
  const users = ds.getRepository(User);
  const quizzes = ds.getRepository(Quiz);

  const quizByCourse = new Map<
    string,
    { course: Course; quiz: Quiz; qs: QuizQuestion[] }
  >();
  for (const title of [
    'TypeScript Fundamentals',
    'Intro to REST APIs with NestJS',
  ]) {
    const course = await ds.getRepository(Course).findOne({ where: { title } });
    const quiz = course
      ? await quizzes.findOne({ where: { courseId: course.id } })
      : null;
    if (!course || !quiz) continue;
    const qs = await ds
      .getRepository(QuizQuestion)
      .find({ where: { quizId: quiz.id }, order: { order: 'ASC' } });
    quizByCourse.set(title, { course, quiz, qs });
  }
  if (quizByCourse.size === 0) return;

  // 1) the demo student gets a short, improving history so mastery shows on login
  const sam = await users.findOne({ where: { email: 'student@lms.dev' } });
  const tsDemo = quizByCourse.get('TypeScript Fundamentals');
  if (sam && tsDemo) {
    const has = await ds
      .getRepository(QuizAttempt)
      .exists({ where: { quizId: tsDemo.quiz.id, studentId: sam.id } });
    await enroll(ds, sam.id, tsDemo.course);
    if (!has) {
      await simulateAttempts(
        ds,
        tsDemo.quiz,
        tsDemo.qs,
        sam.id,
        -0.3,
        3,
        rng(7),
        8,
      );
      console.log('Seeded demo quiz history for student@lms.dev (synthetic)');
    }
  }

  // 2) simulated classmates, so the instructor's analytics have substance
  const passwordHash = await bcrypt.hash('not-a-real-login', 10);
  let created = 0;
  for (let i = 1; i <= 14; i++) {
    const nn = String(i).padStart(2, '0');
    const email = `sim${nn}@demo.lms.dev`;
    if (await users.exists({ where: { email } })) continue;

    const next = rng(1000 + i);
    const learner = await users.save(
      users.create({
        email,
        firstName: 'Simulated',
        lastName: `Learner ${nn}`,
        role: UserRole.STUDENT,
        password: passwordHash,
      }),
    );
    const ability = normal(next) * 0.9;
    for (const { course, quiz, qs } of quizByCourse.values()) {
      await enroll(ds, learner.id, course);
      await simulateAttempts(
        ds,
        quiz,
        qs,
        learner.id,
        ability,
        3 + Math.floor(next() * 3),
        next,
        20,
      );
    }
    created++;
  }
  if (created) {
    console.log(
      `Seeded ${created} simulated learners with quiz history (synthetic)`,
    );
  }
}
