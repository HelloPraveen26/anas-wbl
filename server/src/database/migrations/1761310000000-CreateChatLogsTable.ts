import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatLogsTable1761310000000 implements MigrationInterface {
  name = "CreateChatLogsTable1761310000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "call_log_id" uuid,
        "room_name" character varying,
        "history" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_logs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chat_logs_call_log_id" UNIQUE ("call_log_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_logs"
      ADD CONSTRAINT "FK_chat_logs_call_log_id"
      FOREIGN KEY ("call_log_id")
      REFERENCES "call_logs"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_logs" DROP CONSTRAINT "FK_chat_logs_call_log_id"`,
    );
    await queryRunner.query(`DROP TABLE "chat_logs"`);
  }
}
