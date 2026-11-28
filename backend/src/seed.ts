import dataSource from './data-source';
import { seedDemoActivity } from './seed-demo-activity';
import { DEMO_PASSWORD, seedAccounts } from './seed-accounts';
import { seedContent } from './seed-content';

async function main() {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const { instructor, adminPassword } = await seedAccounts(dataSource);
  if (!adminPassword) {
    console.log(
      'Skipping admin: set SEED_ADMIN_PASSWORD to create admin@lms.dev',
    );
  }

  await seedContent(dataSource, instructor);

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
