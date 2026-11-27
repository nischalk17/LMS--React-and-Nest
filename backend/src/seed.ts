import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { User, UserRole } from './entities/user.entity';
import { Course } from './entities/course.entity';
import { Module, ModuleType } from './entities/module.entity';
import { Quiz, QuizQuestion } from './entities/quiz.entity';

const DEMO_PASSWORD = 'Password123!';

async function upsertUser(
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  password = DEMO_PASSWORD,
) {
  const repo = dataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email } });
  if (existing) return existing;
  return repo.save(
    repo.create({
      email,
      firstName,
      lastName,
      role,
      password: await bcrypt.hash(password, 10),
    }),
  );
}

async function main() {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const instructor = await upsertUser(
    'instructor@lms.dev',
    'Ivy',
    'Instructor',
    UserRole.INSTRUCTOR,
  );
  // A public deployment must not ship an admin with a well-known password:
  // in production the admin is only created when SEED_ADMIN_PASSWORD is set.
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? undefined : DEMO_PASSWORD);
  if (adminPassword) {
    await upsertUser(
      'admin@lms.dev',
      'Ada',
      'Admin',
      UserRole.ADMIN,
      adminPassword,
    );
  } else {
    console.log(
      'Skipping admin: set SEED_ADMIN_PASSWORD to create admin@lms.dev',
    );
  }
  await upsertUser('student@lms.dev', 'Sam', 'Student', UserRole.STUDENT);

  const courseRepo = dataSource.getRepository(Course);
  const moduleRepo = dataSource.getRepository(Module);

  const demoCourses = [
    {
      title: 'TypeScript Fundamentals',
      description:
        'Types, interfaces, generics and the tooling you need to write safer JavaScript.',
      isPublished: true,
      modules: [
        {
          title: 'Why TypeScript?',
          type: ModuleType.TEXT,
          content:
            'TypeScript adds static types to JavaScript so many bugs are caught before you run the code.',
        },
        {
          title: 'Types and interfaces',
          type: ModuleType.VIDEO,
          videoUrl: 'https://www.youtube.com/watch?v=zQnBQ4tB3ZA',
        },
        {
          title: 'Generics',
          type: ModuleType.TEXT,
          content:
            'Generics let you write reusable code that stays type safe: function id<T>(x: T): T.',
        },
      ],
    },
    {
      title: 'Intro to REST APIs with NestJS',
      description:
        'Build a REST API with controllers, providers, DTO validation and JWT auth.',
      isPublished: true,
      modules: [
        {
          title: 'Modules, controllers, providers',
          type: ModuleType.TEXT,
          content:
            'A Nest app is a tree of modules. Controllers handle HTTP, providers hold the logic.',
        },
        {
          title: 'Validation with DTOs',
          type: ModuleType.TEXT,
          content:
            'class-validator decorators on DTO classes plus ValidationPipe reject bad input.',
        },
      ],
    },
    {
      title: 'Draft: Advanced SQL (unpublished)',
      description: 'A draft course, visible to its instructor only.',
      isPublished: false,
      modules: [],
    },
  ];

  for (const [i, data] of demoCourses.entries()) {
    if (await courseRepo.exists({ where: { title: data.title } })) continue;
    const { modules, ...courseData } = data;
    const course = await courseRepo.save(
      courseRepo.create({ ...courseData, instructorId: instructor.id }),
    );
    await moduleRepo.save(
      modules.map((m, order) =>
        moduleRepo.create({ ...m, order, courseId: course.id }),
      ),
    );
    console.log(`Seeded course ${i + 1}: ${data.title}`);
  }

  // demo quiz on the first course
  const tsCourse = await courseRepo.findOne({
    where: { title: 'TypeScript Fundamentals' },
  });
  if (
    tsCourse &&
    !(await dataSource
      .getRepository(Quiz)
      .exists({ where: { courseId: tsCourse.id } }))
  ) {
    const quiz = await dataSource.getRepository(Quiz).save(
      dataSource.getRepository(Quiz).create({
        courseId: tsCourse.id,
        title: 'TypeScript basics check',
        passingScore: 60,
      }),
    );
    const questions = [
      {
        text: 'What does TypeScript add to JavaScript?',
        options: ['Static types', 'A new runtime', 'A database'],
        correctIndex: 0,
      },
      {
        text: 'Which keyword declares a reusable object shape?',
        options: ['interface', 'import', 'await'],
        correctIndex: 0,
      },
      {
        text: 'What does function id<T>(x: T): T use?',
        options: ['A decorator', 'A generic', 'A namespace'],
        correctIndex: 1,
      },
    ];
    await dataSource
      .getRepository(QuizQuestion)
      .save(
        questions.map((q, order) =>
          dataSource
            .getRepository(QuizQuestion)
            .create({ ...q, order, quizId: quiz.id }),
        ),
      );
    console.log('Seeded demo quiz');
  }

  console.log(`Done. Demo logins (password "${DEMO_PASSWORD}"):`);
  console.log('  instructor@lms.dev  (instructor)');
  console.log('  student@lms.dev     (student)');
  if (adminPassword) {
    console.log(
      adminPassword === DEMO_PASSWORD
        ? '  admin@lms.dev       (admin)'
        : '  admin@lms.dev       (admin, password = SEED_ADMIN_PASSWORD)',
    );
  }
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
