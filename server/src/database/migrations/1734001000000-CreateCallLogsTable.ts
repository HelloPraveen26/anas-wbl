import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCallLogsTable1734001000000 implements MigrationInterface {
  name = "CreateCallLogsTable1734001000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "call_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" character varying,
        "assistant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "assistant_phone" character varying NOT NULL,
        "customer_phone" character varying NOT NULL,
        "type" character varying NOT NULL,
        "call_status" character varying,
        "success_evaluation" character varying,
        "start_time" TIMESTAMP,
        "duration" integer DEFAULT 0,
        "cost" numeric(15,8) DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_call_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_call_logs_session_id" ON "call_logs" ("session_id")
      WHERE "session_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "call_logs"
      ADD CONSTRAINT "FK_call_logs_assistant_id"
      FOREIGN KEY ("assistant_id")
      REFERENCES "assistants"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "call_logs"
      ADD CONSTRAINT "FK_call_logs_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "call_logs" DROP CONSTRAINT "FK_call_logs_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "call_logs" DROP CONSTRAINT "FK_call_logs_assistant_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_call_logs_session_id"`);
    await queryRunner.query(`DROP TABLE "call_logs"`);
  }
}
