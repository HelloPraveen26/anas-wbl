import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTtsConfigsTable1761278000000
  implements MigrationInterface
{
  name = "CreateTtsConfigsTable1761278000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."tts_configs_type_enum" AS ENUM('string', 'number', 'boolean', 'select')
        `);

    await queryRunner.query(`
            CREATE TABLE "tts_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "label" character varying(255) NOT NULL,
                "key" character varying(100) NOT NULL,
                "type" "public"."tts_configs_type_enum" NOT NULL,
                "list" jsonb,
                "default_value" text,
                "active" boolean NOT NULL DEFAULT true,
                "synthesizer_provider_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tts_configs" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "tts_configs"
            ADD CONSTRAINT "FK_tts_configs_synthesizer_provider_id"
            FOREIGN KEY ("synthesizer_provider_id")
            REFERENCES "synthesizer_providers"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tts_configs" DROP CONSTRAINT "FK_tts_configs_synthesizer_provider_id"`,
    );
    await queryRunner.query(`DROP TABLE "tts_configs"`);
    await queryRunner.query(`DROP TYPE "public"."tts_configs_type_enum"`);
  }
}
