import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { User, UserRole } from './entities/user.entity';
import { Course } from './entities/course.entity';
import { Module, ModuleType } from './entities/module.entity';

const DEMO_PASSWORD = 'Password123!';

async function upsertUser(
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
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
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
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
  await upsertUser('admin@lms.dev', 'Ada', 'Admin', UserRole.ADMIN);
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

  console.log(`Done. Demo logins (password "${DEMO_PASSWORD}"):`);
  console.log('  instructor@lms.dev  (instructor)');
  console.log('  student@lms.dev     (student)');
  console.log('  admin@lms.dev       (admin)');
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
