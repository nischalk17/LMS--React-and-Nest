import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

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
        { text: 'What is 2 + 2?', options: ['3', '4', '5'], correctIndex: 1 },
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
