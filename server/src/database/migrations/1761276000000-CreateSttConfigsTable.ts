import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSttConfigsTable1761276000000
  implements MigrationInterface
{
  name = "CreateSttConfigsTable1761276000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."stt_configs_type_enum" AS ENUM('string', 'number', 'boolean', 'select')
        `);

    await queryRunner.query(`
            CREATE TABLE "stt_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "label" character varying(255) NOT NULL,
                "key" character varying(100) NOT NULL,
                "type" "public"."stt_configs_type_enum" NOT NULL,
                "list" jsonb,
                "default_value" text,
                "active" boolean NOT NULL DEFAULT true,
                "transcriber_provider_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_stt_configs" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "stt_configs"
            ADD CONSTRAINT "FK_stt_configs_transcriber_provider_id"
            FOREIGN KEY ("transcriber_provider_id")
            REFERENCES "transcriber_providers"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stt_configs" DROP CONSTRAINT "FK_stt_configs_transcriber_provider_id"`,
    );
    await queryRunner.query(`DROP TABLE "stt_configs"`);
    await queryRunner.query(`DROP TYPE "public"."stt_configs_type_enum"`);
  }
}
