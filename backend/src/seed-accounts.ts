import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

export const DEMO_PASSWORD = 'Password123!';

async function upsertUser(
  ds: DataSource,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  password = DEMO_PASSWORD,
) {
  const repo = ds.getRepository(User);
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

/**
 * Creates the three demo accounts if they do not exist yet. Safe to run on
 * every boot: existing users are never touched.
 *
 * A public deployment must not ship an admin with a well-known password, so in
 * production the admin is only created when SEED_ADMIN_PASSWORD is set.
 */
export async function seedAccounts(ds: DataSource) {
  const instructor = await upsertUser(
    ds,
    'instructor@lms.dev',
    'Ivy',
    'Instructor',
    UserRole.INSTRUCTOR,
  );
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? undefined : DEMO_PASSWORD);
  if (adminPassword) {
    await upsertUser(
      ds,
      'admin@lms.dev',
      'Ada',
      'Admin',
      UserRole.ADMIN,
      adminPassword,
    );
  }
  await upsertUser(ds, 'student@lms.dev', 'Sam', 'Student', UserRole.STUDENT);
  return { instructor, adminPassword };
}
