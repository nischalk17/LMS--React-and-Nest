import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * quiz_responses.quizId was created as varchar with no foreign key. Convert it
 * in place (keeping existing rows) and add the missing FK with ON DELETE CASCADE.
 */
export class FixQuizResponseQuizId1795814537559 implements MigrationInterface {
  name = 'FixQuizResponseQuizId1795814537559';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" ALTER COLUMN "quizId" TYPE uuid USING "quizId"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" ADD CONSTRAINT "FK_9df22ddb0600cd876981628294d" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" DROP CONSTRAINT "FK_9df22ddb0600cd876981628294d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" ALTER COLUMN "quizId" TYPE character varying USING "quizId"::text`,
    );
  }
}
