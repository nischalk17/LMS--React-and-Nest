import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';
import { MasteryService } from '../src/mastery/mastery.service';

describe('LMS API (e2e)', () => {
  let app: INestApplication;

  const register = (email: string, role: 'student' | 'instructor') =>
    request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: 'Password123!',
      firstName: 'Test',
      lastName: role,
      role,
    });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  let instructorToken: string;
  let otherInstructorToken: string;
  let studentToken: string;
  let otherStudentToken: string;
  let courseId: string;
  let moduleId: string;
  let enrollmentId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    await app.get(DataSource).synchronize(true); // start from an empty schema
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('GET /health is public', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
    });

    it('registers users and never returns the password hash', async () => {
      const res = await register('ivy@test.dev', 'instructor').expect(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.password).toBeUndefined();
      instructorToken = res.body.accessToken as string;

      otherInstructorToken = (
        await register('olga@test.dev', 'instructor').expect(201)
      ).body.accessToken as string;
      studentToken = (await register('sam@test.dev', 'student').expect(201))
        .body.accessToken as string;
      otherStudentToken = (
        await register('sue@test.dev', 'student').expect(201)
      ).body.accessToken as string;
    });

    it('rejects a duplicate email (409) and invalid input (400)', async () => {
      await register('IVY@test.dev', 'instructor').expect(409);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'nope', password: '1' })
        .expect(400);
    });

    it('logs in with correct credentials only', async () => {
      const server = app.getHttpServer();
      await request(server)
        .post('/auth/login')
        .send({ email: 'sam@test.dev', password: 'wrong-password' })
        .expect(401);
      const ok = await request(server)
        .post('/auth/login')
        .send({ email: 'sam@test.dev', password: 'Password123!' })
        .expect(201);
      expect(ok.body.role).toBe('student');
      expect(ok.body.password).toBeUndefined();
    });

    it('protects routes: 401 without token, profile with token', async () => {
      const server = app.getHttpServer();
      await request(server).get('/courses').expect(401);
      await request(server)
        .get('/auth/profile')
        .set('Authorization', 'Bearer x')
        .expect(401);
      const res = await request(server)
        .get('/auth/profile')
        .set(auth(studentToken))
        .expect(200);
      expect(res.body.email).toBe('sam@test.dev');
      expect(res.body.password).toBeUndefined();
    });
  });

  describe('courses and roles', () => {
    it('forbids students from creating courses', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set(auth(studentToken))
        .send({ title: 'x', description: 'y' })
        .expect(403);
    });

    it('lets an instructor create a draft course with a module', async () => {
      const server = app.getHttpServer();
      const course = await request(server)
        .post('/courses')
        .set(auth(instructorToken))
        .send({ title: 'NestJS 101', description: 'Intro', isPublished: false })
        .expect(201);
      courseId = course.body.id as string;

      const mod = await request(server)
        .post(`/courses/${courseId}/modules`)
        .set(auth(instructorToken))
        .send({
          title: 'Lesson 1',
          type: 'text',
          content: 'secret lesson text',
        })
        .expect(201);
      moduleId = mod.body.id as string;
    });

    it('hides drafts from students (list and detail)', async () => {
      const server = app.getHttpServer();
      const list = await request(server)
        .get('/courses?published=true')
        .set(auth(studentToken))
        .expect(200);
      expect(list.body).toHaveLength(0);
      await request(server)
        .get(`/courses/${courseId}`)
        .set(auth(studentToken))
        .expect(404);
    });

    it('prevents another instructor from editing or deleting the course (IDOR)', async () => {
      const server = app.getHttpServer();
      await request(server)
        .patch(`/courses/${courseId}`)
        .set(auth(otherInstructorToken))
        .send({ title: 'hijacked' })
        .expect(403);
      await request(server)
        .delete(`/courses/${courseId}`)
        .set(auth(otherInstructorToken))
        .expect(403);
      await request(server)
        .patch(`/courses/modules/${moduleId}`)
        .set(auth(otherInstructorToken))
        .send({ title: 'hijacked' })
        .expect(403);
    });

    it('rejects a malformed id with 400', async () => {
      await request(app.getHttpServer())
        .get('/courses/not-a-uuid')
        .set(auth(studentToken))
        .expect(400);
    });

    it('publishes the course; the catalog leaks no password hashes', async () => {
      const server = app.getHttpServer();
      await request(server)
        .patch(`/courses/${courseId}`)
        .set(auth(instructorToken))
        .send({ isPublished: true })
        .expect(200);
      const list = await request(server)
        .get('/courses?published=true')
        .set(auth(studentToken))
        .expect(200);
      expect(list.body).toHaveLength(1);
      expect(JSON.stringify(list.body)).not.toContain('password');
      expect(list.body[0].instructor.firstName).toBe('Test');
    });
  });

  describe('enrollment and progress', () => {
    it('hides module content until the student enrolls', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${courseId}`)
        .set(auth(studentToken))
        .expect(200);
      expect(res.body.modules[0].title).toBe('Lesson 1');
      expect(res.body.modules[0].content).toBeNull();
    });

    it('enrolls once, then returns 409', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .post(`/enrollments/courses/${courseId}`)
        .set(auth(studentToken))
        .expect(201);
      enrollmentId = res.body.id as string;
      await request(server)
        .post(`/enrollments/courses/${courseId}`)
        .set(auth(studentToken))
        .expect(409);
    });

    it('reveals module content after enrolling', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${courseId}`)
        .set(auth(studentToken))
        .expect(200);
      expect(res.body.modules[0].content).toBe('secret lesson text');
    });

    it('validates progress values', async () => {
      const server = app.getHttpServer();
      for (const completionPercentage of [150, -1, 'abc']) {
        await request(server)
          .patch(`/progress/${enrollmentId}/modules/${moduleId}`)
          .set(auth(studentToken))
          .send({ completionPercentage })
          .expect(400);
      }
    });

    it("blocks other students from an enrollment they don't own", async () => {
      await request(app.getHttpServer())
        .patch(`/progress/${enrollmentId}/modules/${moduleId}`)
        .set(auth(otherStudentToken))
        .send({ completionPercentage: 100 })
        .expect(404);
      await request(app.getHttpServer())
        .get(`/enrollments/${enrollmentId}/progress`)
        .set(auth(otherStudentToken))
        .expect(404);
    });

    it('tracks completion and overall progress', async () => {
      const server = app.getHttpServer();
      const upd = await request(server)
        .patch(`/progress/${enrollmentId}/modules/${moduleId}`)
        .set(auth(studentToken))
        .send({ completionPercentage: 100 })
        .expect(200);
      expect(upd.body.isCompleted).toBe(true);

      const prog = await request(server)
        .get(`/enrollments/${enrollmentId}/progress`)
        .set(auth(studentToken))
        .expect(200);
      expect(prog.body).toMatchObject({
        overallProgress: 100,
        completedModules: 1,
        totalModules: 1,
      });

      const mine = await request(server)
        .get('/enrollments/my-courses')
        .set(auth(studentToken))
        .expect(200);
      expect(mine.body).toHaveLength(1);
      expect(JSON.stringify(mine.body)).not.toContain('"password"');
    });
  });

  describe('course Q&A', () => {
    let questionId: string;

    it('blocks non-members (not enrolled) from reading or asking', async () => {
      const server = app.getHttpServer();
      await request(server)
        .get(`/courses/${courseId}/questions`)
        .set(auth(otherStudentToken))
        .expect(403);
      await request(server)
        .post(`/courses/${courseId}/questions`)
        .set(auth(otherStudentToken))
        .send({ body: 'Can I ask?' })
        .expect(403);
      await request(server)
        .get(`/courses/${courseId}/questions`)
        .set(auth(otherInstructorToken))
        .expect(403);
    });

    it('lets an enrolled student ask, and validates the body', async () => {
      const server = app.getHttpServer();
      await request(server)
        .post(`/courses/${courseId}/questions`)
        .set(auth(studentToken))
        .send({ body: '' })
        .expect(400);
      const res = await request(server)
        .post(`/courses/${courseId}/questions`)
        .set(auth(studentToken))
        .send({ body: 'What is a DTO?' })
        .expect(201);
      questionId = res.body.id as string;
      expect(res.body.answer).toBeNull();
      expect(res.body.author.firstName).toBe('Test');
      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('does not let students (or other instructors) answer', async () => {
      const server = app.getHttpServer();
      await request(server)
        .patch(`/questions/${questionId}/answer`)
        .set(auth(studentToken))
        .send({ answer: 'self-answer' })
        .expect(403);
      await request(server)
        .patch(`/questions/${questionId}/answer`)
        .set(auth(otherInstructorToken))
        .send({ answer: 'not my course' })
        .expect(403);
    });

    it('lets the course instructor answer; students then see it', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .patch(`/questions/${questionId}/answer`)
        .set(auth(instructorToken))
        .send({ answer: 'A Data Transfer Object.' })
        .expect(200);
      expect(res.body.answer).toBe('A Data Transfer Object.');
      expect(res.body.answeredBy.id).toBeDefined();

      const list = await request(server)
        .get(`/courses/${courseId}/questions`)
        .set(auth(studentToken))
        .expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].answer).toBe('A Data Transfer Object.');
    });
  });

  describe('instructor analytics', () => {
    it('reports students, progress and unanswered questions per course', async () => {
      const server = app.getHttpServer();
      // ask a fresh, unanswered question so the count is non-zero
      await request(server)
        .post(`/courses/${courseId}/questions`)
        .set(auth(studentToken))
        .send({ body: 'Is there a quiz at the end?' })
        .expect(201);

      const res = await request(server)
        .get('/instructor/analytics')
        .set(auth(instructorToken))
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        courseId,
        modules: 1,
        students: 1,
        averageProgress: 100,
        unansweredQuestions: 1,
      });
    });

    it('only instructors can read analytics, and only their own courses', async () => {
      const server = app.getHttpServer();
      await request(server)
        .get('/instructor/analytics')
        .set(auth(studentToken))
        .expect(403);
      const other = await request(server)
        .get('/instructor/analytics')
        .set(auth(otherInstructorToken))
        .expect(200);
      expect(other.body).toHaveLength(0);
    });
  });

  describe('hardening and edge cases', () => {
    it('health check reports the database', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body).toEqual({ status: 'ok', database: 'up' });
    });

    it('rejects non-http(s) module URLs (javascript: XSS) but accepts empty ones', async () => {
      const server = app.getHttpServer();
      for (const field of ['videoUrl', 'pdfUrl']) {
        await request(server)
          .post(`/courses/${courseId}/modules`)
          .set(auth(instructorToken))
          .send({ title: 'bad', type: 'video', [field]: 'javascript:alert(1)' })
          .expect(400);
      }
      const ok = await request(server)
        .post(`/courses/${courseId}/modules`)
        .set(auth(instructorToken))
        .send({
          title: 'ok',
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=abc',
          pdfUrl: '',
        })
        .expect(201);
      expect(ok.body.pdfUrl).toBeNull();
      await request(server)
        .delete(`/courses/modules/${ok.body.id as string}`)
        .set(auth(instructorToken))
        .expect(200);
    });

    it('only students can enroll', async () => {
      await request(app.getHttpServer())
        .post(`/enrollments/courses/${courseId}`)
        .set(auth(otherInstructorToken))
        .expect(403);
    });

    it('two simultaneous enrollments produce one 201 and one 409, never a 500', async () => {
      const server = app.getHttpServer();
      const course = await request(server)
        .post('/courses')
        .set(auth(instructorToken))
        .send({ title: 'Race', description: 'race', isPublished: true })
        .expect(201);
      const url = `/enrollments/courses/${course.body.id as string}`;
      const results = await Promise.all([
        request(server).post(url).set(auth(otherStudentToken)),
        request(server).post(url).set(auth(otherStudentToken)),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });

    it('two simultaneous sign-ups with one email give 201 + 409, never a 500', async () => {
      const results = await Promise.all([
        register('dup@test.dev', 'student'),
        register('dup@test.dev', 'student'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });

    it('lets an enrolled student keep access after the course is unpublished', async () => {
      const server = app.getHttpServer();
      await request(server)
        .patch(`/courses/${courseId}`)
        .set(auth(instructorToken))
        .send({ isPublished: false })
        .expect(200);

      const enrolled = await request(server)
        .get(`/courses/${courseId}`)
        .set(auth(studentToken))
        .expect(200);
      expect(enrolled.body.modules[0].content).toBe('secret lesson text');
      await request(server)
        .get(`/courses/${courseId}`)
        .set(auth(otherStudentToken))
        .expect(404);

      await request(server)
        .patch(`/courses/${courseId}`)
        .set(auth(instructorToken))
        .send({ isPublished: true })
        .expect(200);
    });

    it("hides lesson content from other instructors (they don't own the course)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${courseId}`)
        .set(auth(otherInstructorToken))
        .expect(200);
      expect(res.body.modules[0].content).toBeNull();
    });
  });

  describe('quizzes', () => {
    const quiz = {
      title: 'Module check',
      passingScore: 50,
      questions: [
        {
          skill: 'Arithmetic',
          text: 'What is 2 + 2?',
          options: ['3', '4', '5'],
          correctIndex: 1,
        },
        {
          text: 'Capital of France?',
          options: ['Paris', 'Rome'],
          correctIndex: 0,
        },
      ],
    };
    const url = () => `/courses/${courseId}/quiz`;

    it('only the course owner can create a quiz, with a valid answer key', async () => {
      const server = app.getHttpServer();
      await request(server)
        .put(url())
        .set(auth(studentToken))
        .send(quiz)
        .expect(403);
      await request(server)
        .put(url())
        .set(auth(otherInstructorToken))
        .send(quiz)
        .expect(403);
      await request(server)
        .put(url())
        .set(auth(instructorToken))
        .send({
          ...quiz,
          questions: [{ text: 'q', options: ['a', 'b'], correctIndex: 5 }],
        })
        .expect(400);
      await request(server)
        .put(url())
        .set(auth(instructorToken))
        .send({ ...quiz, questions: [] })
        .expect(400);

      const res = await request(server)
        .put(url())
        .set(auth(instructorToken))
        .send(quiz)
        .expect(200);
      expect(res.body.questions).toHaveLength(2);
      expect(res.body.questions[0].correctIndex).toBe(1); // owner sees the key
    });

    it('hides the answer key from students and blocks the unenrolled', async () => {
      const server = app.getHttpServer();
      await request(server).get(url()).set(auth(otherStudentToken)).expect(403);
      const res = await request(server)
        .get(url())
        .set(auth(studentToken))
        .expect(200);
      expect(res.body.title).toBe('Module check');
      expect(JSON.stringify(res.body)).not.toContain('correctIndex');
    });

    it('validates submissions', async () => {
      const server = app.getHttpServer();
      const post = (token: string, answers: unknown) =>
        request(server)
          .post(`${url()}/attempts`)
          .set(auth(token))
          .send({ answers });
      await post(otherStudentToken, [1, 0]).expect(403);
      await post(studentToken, [1]).expect(400); // not all answered
      await post(studentToken, [1, 9]).expect(400); // option out of range
      await post(studentToken, [1, -1]).expect(400);
      await post(studentToken, 'nope').expect(400);
      await post(instructorToken, [1, 0]).expect(403); // owners do not take it
    });

    it('grades attempts and keeps history', async () => {
      const server = app.getHttpServer();
      const perfect = await request(server)
        .post(`${url()}/attempts`)
        .set(auth(studentToken))
        .send({ answers: [1, 0] })
        .expect(201);
      expect(perfect.body).toMatchObject({
        score: 100,
        passed: true,
        correct: 2,
        total: 2,
        results: [true, true],
      });

      const half = await request(server)
        .post(`${url()}/attempts`)
        .set(auth(studentToken))
        .send({ answers: [1, 1] })
        .expect(201);
      expect(half.body).toMatchObject({ score: 50, passed: true });

      const zero = await request(server)
        .post(`${url()}/attempts`)
        .set(auth(studentToken))
        .send({ answers: [0, 1] })
        .expect(201);
      expect(zero.body).toMatchObject({ score: 0, passed: false });
      expect(JSON.stringify(zero.body)).not.toContain('correctIndex');

      const mine = await request(server)
        .get(`${url()}/attempts/mine`)
        .set(auth(studentToken))
        .expect(200);
      expect(mine.body).toHaveLength(3);
    });

    it('stores skill tags, defaulting to the course title when none is given', async () => {
      const res = await request(app.getHttpServer())
        .get(url())
        .set(auth(instructorToken))
        .expect(200);
      expect(res.body.questions.map((q: { skill: string }) => q.skill)).toEqual(
        ['Arithmetic', 'NestJS 101'],
      );
      // students see the skill too (so the UI can show what is being tested)
      const asStudent = await request(app.getHttpServer())
        .get(url())
        .set(auth(studentToken))
        .expect(200);
      expect(asStudent.body.questions[0].skill).toBe('Arithmetic');
    });

    it('logs one response per question for every attempt', async () => {
      const db = app.get(DataSource);
      const rows: {
        correct: boolean;
        skill: string;
        selectedIndex: number;
        attemptId: string;
        questionId: string | null;
      }[] = await db.query(
        `SELECT r."correct", r."skill", r."selectedIndex", r."attemptId", r."questionId"
           FROM quiz_responses r
           JOIN users u ON u.id = r."studentId"
          WHERE u.email = $1
          ORDER BY r."createdAt", r."skill"`,
        ['sam@test.dev'],
      );
      // 3 graded attempts x 2 questions
      expect(rows).toHaveLength(6);
      expect(new Set(rows.map((r) => r.attemptId)).size).toBe(3);
      expect(rows.every((r) => r.questionId !== null)).toBe(true);
      const arithmetic = rows.filter((r) => r.skill === 'Arithmetic');
      // attempts were [1,0] (all right), [1,1] (first right), [0,1] (first wrong)
      expect(arithmetic.map((r) => r.correct).sort()).toEqual([
        false,
        true,
        true,
      ]);
      expect(arithmetic.find((r) => !r.correct)?.selectedIndex).toBe(0);
    });

    it('keeps question ids and answer history when a quiz is edited', async () => {
      const server = app.getHttpServer();
      const before = await request(server)
        .get(url())
        .set(auth(instructorToken))
        .expect(200);
      const [first, second] = before.body.questions as {
        id: string;
        text: string;
        options: string[];
        correctIndex: number;
      }[];

      const edited = await request(server)
        .put(url())
        .set(auth(instructorToken))
        .send({
          title: quiz.title,
          passingScore: 50,
          questions: [
            { ...first, text: 'What is two plus two?', skill: 'Arithmetic' },
            {
              text: 'A brand new question',
              options: ['a', 'b'],
              correctIndex: 0,
            },
          ],
        })
        .expect(200);
      expect(edited.body.questions[0].id).toBe(first.id); // same question, new wording
      expect(edited.body.questions[0].text).toBe('What is two plus two?');
      expect(edited.body.questions[1].id).not.toBe(second.id);

      // responses to the kept question are still linked; the dropped one is
      // orphaned (questionId NULL) but its skill snapshot and result survive
      const db = app.get(DataSource);
      const kept = await db.query(
        `SELECT COUNT(*)::int AS n FROM quiz_responses WHERE "questionId" = $1`,
        [first.id],
      );
      expect(kept[0].n).toBe(3);
      const orphaned = await db.query(
        `SELECT COUNT(*)::int AS n FROM quiz_responses
          WHERE "questionId" IS NULL AND "skill" = $1`,
        ['NestJS 101'],
      );
      expect(orphaned[0].n).toBe(3);
    });

    it('rejects an invalid question id format', async () => {
      await request(app.getHttpServer())
        .put(url())
        .set(auth(instructorToken))
        .send({
          ...quiz,
          questions: [{ ...quiz.questions[0], id: 'not-a-uuid' }],
        })
        .expect(400);
    });

    it('reports per-skill mastery, weakest first, as an estimate when no model is shipped', async () => {
      const server = app.getHttpServer();
      const res = await request(server)
        .get(`/courses/${courseId}/mastery/me`)
        .set(auth(studentToken))
        .expect(200);
      expect(res.body.method).toBe('estimate');
      expect(res.body.model).toBeNull();
      expect(res.body.totalAnswers).toBe(6);
      // Arithmetic: right, right, wrong -> (2+1)/(3+2); NestJS 101: right, wrong, wrong -> (1+1)/(3+2)
      expect(
        res.body.skills.map((k: { skill: string; mastery: number }) => [
          k.skill,
          k.mastery,
        ]),
      ).toEqual([
        ['NestJS 101', 0.4],
        ['Arithmetic', 0.6],
      ]);
      expect(res.body.skills[0]).toMatchObject({
        attempts: 3,
        correct: 1,
        method: 'estimate',
        confidence: 'medium',
      });
    });

    it('switches to the trained model when one is shipped', async () => {
      const service = app.get(MasteryService);
      const original = service.model;
      service.model = {
        version: 1,
        features: [],
        mean: [0, 0, 0, 0, 0, 0, 0],
        scale: [1, 1, 1, 1, 1, 1, 1],
        coef: [0, 0, 0, 0, 0, 0, 0],
        intercept: 0,
        prior: 0.5,
        priorWeight: 2,
        recentWindow: 3,
        trainedOn: { dataset: 'test-fixture', rows: 1, students: 1 },
        heldOut: { auc: 0.71, accuracy: 0.66 },
      };
      try {
        const res = await request(app.getHttpServer())
          .get(`/courses/${courseId}/mastery/me`)
          .set(auth(studentToken))
          .expect(200);
        expect(res.body.method).toBe('model');
        expect(res.body.model).toEqual({
          dataset: 'test-fixture',
          heldOutAuc: 0.71,
        });
        expect(
          res.body.skills.every((k: { mastery: number }) => k.mastery === 0.5),
        ).toBe(true);
      } finally {
        service.model = original;
      }
    });

    it('keeps mastery private to enrolled students', async () => {
      const server = app.getHttpServer();
      const path = `/courses/${courseId}/mastery/me`;
      await request(server).get(path).expect(401);
      await request(server).get(path).set(auth(otherStudentToken)).expect(403); // not enrolled
      await request(server).get(path).set(auth(instructorToken)).expect(403); // students only
      await request(server)
        .get(`/courses/00000000-0000-4000-8000-000000000000/mastery/me`)
        .set(auth(studentToken))
        .expect(404);
    });

    it('gives instructors the weakest skills of the class once there are enough answers', async () => {
      const server = app.getHttpServer();
      const before = await request(server)
        .get('/instructor/analytics')
        .set(auth(instructorToken))
        .expect(200);
      const mine = (body: { courseId: string; weakestSkills: unknown[] }[]) =>
        body.find((c) => c.courseId === courseId)!;
      expect(mine(before.body).weakestSkills).toEqual([]); // 3 answers per skill is too few

      for (let i = 0; i < 2; i++) {
        await request(server)
          .post(`${url()}/attempts`)
          .set(auth(studentToken))
          .send({ answers: [1, 1] }) // first right, second wrong
          .expect(201);
      }
      const res = await request(server)
        .get('/instructor/analytics')
        .set(auth(instructorToken))
        .expect(200);
      // Arithmetic: 4 of 5 right; NestJS 101: 1 of 5 right
      expect(mine(res.body).weakestSkills).toEqual([
        { skill: 'NestJS 101', accuracy: 0.2, answers: 5 },
        { skill: 'Arithmetic', accuracy: 0.8, answers: 5 },
      ]);
    });

    it('replaces questions on update and 404s after deletion', async () => {
      const server = app.getHttpServer();
      const updated = await request(server)
        .put(url())
        .set(auth(instructorToken))
        .send({
          title: 'Short quiz',
          passingScore: 100,
          questions: [
            { text: 'Only one', options: ['x', 'y'], correctIndex: 1 },
          ],
        })
        .expect(200);
      expect(updated.body.questions).toHaveLength(1);

      await request(server)
        .delete(url())
        .set(auth(otherInstructorToken))
        .expect(403);
      await request(server)
        .delete(url())
        .set(auth(instructorToken))
        .expect(200);
      await request(server).get(url()).set(auth(studentToken)).expect(404);
    });
  });

  describe('admin', () => {
    let adminToken: string;
    let adminId: string;

    it('does not allow registering as admin', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'evil@test.dev',
          password: 'Password123!',
          firstName: 'E',
          lastName: 'Vil',
          role: 'admin',
        })
        .expect(400);
    });

    it('blocks non-admins from every admin route (403)', async () => {
      const server = app.getHttpServer();
      for (const token of [studentToken, instructorToken]) {
        await request(server).get('/admin/stats').set(auth(token)).expect(403);
        await request(server).get('/admin/users').set(auth(token)).expect(403);
      }
      await request(server).get('/admin/stats').expect(401);
    });

    it('an admin (promoted in the DB) sees platform stats', async () => {
      const server = app.getHttpServer();
      const res = await register('ada@test.dev', 'student').expect(201);
      adminId = res.body.id as string;
      await app
        .get(DataSource)
        .query(`UPDATE users SET role = 'admin' WHERE id = $1`, [adminId]);
      adminToken = res.body.accessToken as string;

      const stats = await request(server)
        .get('/admin/stats')
        .set(auth(adminToken))
        .expect(200);
      expect(stats.body.users.admins).toBe(1);
      expect(stats.body.users.instructors).toBe(2);
      expect(stats.body.courses.published).toBe(2); // main course + the "Race" course
      expect(stats.body.enrollments).toBe(2);
    });

    it('lists and searches users, paginated, without password hashes', async () => {
      const server = app.getHttpServer();
      const page = await request(server)
        .get('/admin/users?limit=2&page=1')
        .set(auth(adminToken))
        .expect(200);
      expect(page.body.items).toHaveLength(2);
      expect(page.body.total).toBeGreaterThanOrEqual(5);
      expect(JSON.stringify(page.body)).not.toContain('"password"');

      const found = await request(server)
        .get('/admin/users?search=sam@test')
        .set(auth(adminToken))
        .expect(200);
      expect(found.body.items).toHaveLength(1);
      expect(found.body.items[0].email).toBe('sam@test.dev');

      await request(server)
        .get('/admin/users?limit=500')
        .set(auth(adminToken))
        .expect(400);
    });

    it('changes roles, but not your own, and rejects invalid roles', async () => {
      const server = app.getHttpServer();
      const users = await request(server)
        .get('/admin/users?search=sue@test')
        .set(auth(adminToken))
        .expect(200);
      const sueId = users.body.items[0].id as string;

      await request(server)
        .patch(`/admin/users/${sueId}/role`)
        .set(auth(adminToken))
        .send({ role: 'instructor' })
        .expect(200);
      // role is read from the database, so it applies immediately
      await request(server)
        .post('/courses')
        .set(auth(otherStudentToken))
        .send({ title: 'Sue course', description: 'now an instructor' })
        .expect(201);

      await request(server)
        .patch(`/admin/users/${sueId}/role`)
        .set(auth(adminToken))
        .send({ role: 'superuser' })
        .expect(400);
      await request(server)
        .patch(`/admin/users/${adminId}/role`)
        .set(auth(adminToken))
        .send({ role: 'student' })
        .expect(400);
    });

    it('lets an admin open any course, including drafts, with full content', async () => {
      const server = app.getHttpServer();
      const draft = await request(server)
        .post('/courses')
        .set(auth(instructorToken))
        .send({ title: 'Hidden draft', description: 'wip', isPublished: false })
        .expect(201);
      await request(server)
        .post(`/courses/${draft.body.id as string}/modules`)
        .set(auth(instructorToken))
        .send({ title: 'm', type: 'text', content: 'draft body' })
        .expect(201);
      const res = await request(server)
        .get(`/courses/${draft.body.id as string}`)
        .set(auth(adminToken))
        .expect(200);
      expect(res.body.modules[0].content).toBe('draft body');
      await request(server)
        .delete(`/admin/courses/${draft.body.id as string}`)
        .set(auth(adminToken))
        .expect(200);
    });

    it('moderates courses: unpublish hides, delete removes', async () => {
      const server = app.getHttpServer();
      await request(server)
        .patch(`/admin/courses/${courseId}/published`)
        .set(auth(adminToken))
        .send({ isPublished: false })
        .expect(200);
      await request(server)
        .get(`/courses/${courseId}`)
        .set(auth(otherStudentToken))
        .expect(404);

      const all = await request(server)
        .get('/admin/courses')
        .set(auth(adminToken))
        .expect(200);
      expect(all.body.items.length).toBeGreaterThanOrEqual(2);

      const sueCourse = (
        all.body.items as { id: string; title: string }[]
      ).find((c) => c.title === 'Sue course');
      await request(server)
        .delete(`/admin/courses/${sueCourse!.id}`)
        .set(auth(adminToken))
        .expect(200);
      await request(server)
        .patch(`/admin/courses/${courseId}/published`)
        .set(auth(adminToken))
        .send({ isPublished: true })
        .expect(200);
    });

    it('deletes a user (cascades) but never yourself', async () => {
      const server = app.getHttpServer();
      await request(server)
        .delete(`/admin/users/${adminId}`)
        .set(auth(adminToken))
        .expect(400);
      const found = await request(server)
        .get('/admin/users?search=olga@test')
        .set(auth(adminToken))
        .expect(200);
      await request(server)
        .delete(`/admin/users/${found.body.items[0].id}`)
        .set(auth(adminToken))
        .expect(200);
      await request(server)
        .get('/auth/profile')
        .set(auth(otherInstructorToken))
        .expect(401);
    });
  });

  it('instructor can delete their own course', async () => {
    await request(app.getHttpServer())
      .delete(`/courses/${courseId}`)
      .set(auth(instructorToken))
      .expect(200);
  });
});
