import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFilesTable1761300000000 implements MigrationInterface {
  name = "CreateFilesTable1761300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "original_name" character varying(255) NOT NULL,
        "stored_name" character varying(255) NOT NULL,
        "file_path" character varying(500) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "file_size" integer NOT NULL,
        "storage_type" character varying(50) NOT NULL DEFAULT 'local',
        "s3_key" character varying(500),
        "s3_bucket" character varying(255),
        "assistant_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_files" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "files"
      ADD CONSTRAINT "FK_files_assistant_id"
      FOREIGN KEY ("assistant_id")
      REFERENCES "assistants"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_files_assistant_id" ON "files" ("assistant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_files_is_active" ON "files" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_files_storage_type" ON "files" ("storage_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_files_created_at" ON "files" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_files_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_files_storage_type"`);
    await queryRunner.query(`DROP INDEX "IDX_files_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_files_assistant_id"`);
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_files_assistant_id"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
  }
}
