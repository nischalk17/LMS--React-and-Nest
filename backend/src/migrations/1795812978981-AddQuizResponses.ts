import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizResponses1795812978981 implements MigrationInterface {
  name = 'AddQuizResponses1795812978981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quiz_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "quizId" character varying NOT NULL, "questionId" uuid, "studentId" uuid NOT NULL, "skill" character varying(80) NOT NULL, "selectedIndex" integer NOT NULL, "correct" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_31da37018214ec6a98ca8e7ac70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_335d3ce5c5314a14bd21659025" ON "quiz_responses" ("studentId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD "skill" character varying(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" ADD CONSTRAINT "FK_d7e2e90758cab2ad35fa6e4bdd6" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" ADD CONSTRAINT "FK_79eafc7c51573f857f4b20c357c" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" ADD CONSTRAINT "FK_1102f407d58a8d4b2f79f516623" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" DROP CONSTRAINT "FK_1102f407d58a8d4b2f79f516623"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" DROP CONSTRAINT "FK_79eafc7c51573f857f4b20c357c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_responses" DROP CONSTRAINT "FK_d7e2e90758cab2ad35fa6e4bdd6"`,
    );
    await queryRunner.query(`ALTER TABLE "quiz_questions" DROP COLUMN "skill"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_335d3ce5c5314a14bd21659025"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_responses"`);
  }
}
