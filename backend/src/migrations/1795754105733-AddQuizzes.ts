import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizzes1795754105733 implements MigrationInterface {
  name = 'AddQuizzes1795754105733';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "title" character varying NOT NULL, "passingScore" integer NOT NULL DEFAULT '70', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9021b7e89ea353c02a361a10b72" UNIQUE ("courseId"), CONSTRAINT "REL_9021b7e89ea353c02a361a10b7" UNIQUE ("courseId"), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quizId" uuid NOT NULL, "text" text NOT NULL, "options" jsonb NOT NULL, "correctIndex" integer NOT NULL, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quizId" uuid NOT NULL, "studentId" uuid NOT NULL, "score" integer NOT NULL, "passed" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_9021b7e89ea353c02a361a10b72" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD CONSTRAINT "FK_8889ccc5a40989ea308a588870e" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_23f2bbe9288b221b1b377372782" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_30ae16bcedd2b2663686edfc7a8" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_30ae16bcedd2b2663686edfc7a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_23f2bbe9288b221b1b377372782"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "FK_8889ccc5a40989ea308a588870e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_9021b7e89ea353c02a361a10b72"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_attempts"`);
    await queryRunner.query(`DROP TABLE "quiz_questions"`);
    await queryRunner.query(`DROP TABLE "quizzes"`);
  }
}
