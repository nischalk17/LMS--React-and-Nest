import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { seedDemoActivity } from './seed-demo-activity';
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

  // demo quizzes; every question carries a skill tag for knowledge tracing
  const demoQuizzes = [
    {
      courseTitle: 'TypeScript Fundamentals',
      title: 'TypeScript basics check',
      passingScore: 60,
      questions: [
        {
          skill: 'Static typing',
          text: 'What does TypeScript add to JavaScript?',
          options: ['Static types', 'A new runtime', 'A database'],
          correctIndex: 0,
        },
        {
          skill: 'Static typing',
          text: 'When are TypeScript type errors reported?',
          options: ['At compile time', 'Only in production', 'Never'],
          correctIndex: 0,
        },
        {
          skill: 'Interfaces',
          text: 'Which keyword declares a reusable object shape?',
          options: ['interface', 'import', 'await'],
          correctIndex: 0,
        },
        {
          skill: 'Interfaces',
          text: 'Can a class implement an interface?',
          options: ['Yes', 'No'],
          correctIndex: 0,
        },
        {
          skill: 'Generics',
          text: 'What does function id<T>(x: T): T use?',
          options: ['A decorator', 'A generic', 'A namespace'],
          correctIndex: 1,
        },
        {
          skill: 'Generics',
          text: 'What does Array<string> mean?',
          options: ['An array of strings', 'A string of arrays'],
          correctIndex: 0,
        },
      ],
    },
    {
      courseTitle: 'Intro to REST APIs with NestJS',
      title: 'NestJS essentials',
      passingScore: 60,
      questions: [
        {
          skill: 'Modules and providers',
          text: 'Which building block holds business logic in Nest?',
          options: ['A provider (service)', 'A pipe', 'A guard'],
          correctIndex: 0,
        },
        {
          skill: 'Modules and providers',
          text: 'Which class handles incoming HTTP routes?',
          options: ['Controller', 'Repository'],
          correctIndex: 0,
        },
        {
          skill: 'Validation',
          text: 'Which library validates DTO classes in Nest?',
          options: ['class-validator', 'lodash', 'axios'],
          correctIndex: 0,
        },
        {
          skill: 'Validation',
          text: 'What does whitelist: true do in ValidationPipe?',
          options: [
            'Strips properties without decorators',
            'Allows every property',
            'Disables validation',
          ],
          correctIndex: 0,
        },
        {
          skill: 'Authentication',
          text: 'What does a JWT guard check?',
          options: ['A signed token on the request', 'The database schema'],
          correctIndex: 0,
        },
      ],
    },
  ];

  for (const demo of demoQuizzes) {
    const course = await courseRepo.findOne({
      where: { title: demo.courseTitle },
    });
    const quizRepo = dataSource.getRepository(Quiz);
    if (
      !course ||
      (await quizRepo.exists({ where: { courseId: course.id } }))
    ) {
      continue;
    }
    const quiz = await quizRepo.save(
      quizRepo.create({
        courseId: course.id,
        title: demo.title,
        passingScore: demo.passingScore,
      }),
    );
    const questionRepo = dataSource.getRepository(QuizQuestion);
    await questionRepo.save(
      demo.questions.map((q, order) =>
        questionRepo.create({ ...q, order, quizId: quiz.id }),
      ),
    );
    console.log(`Seeded quiz: ${demo.title}`);
  }

  // simulated learners and quiz history so mastery and analytics are not empty
  await seedDemoActivity(dataSource);

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
