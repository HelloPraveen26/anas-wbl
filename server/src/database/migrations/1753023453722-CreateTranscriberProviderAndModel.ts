import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTranscriberProviderAndModel1753023453722
  implements MigrationInterface
{
  name = "CreateTranscriberProviderAndModel1753023453722";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "transcriber_providers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_transcriber_providers_name" UNIQUE ("name"),
                CONSTRAINT "PK_transcriber_providers" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "transcriber_models" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "transcriber_provider_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transcriber_models" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "transcriber_models"
            ADD CONSTRAINT "FK_transcriber_models_transcriber_provider_id"
            FOREIGN KEY ("transcriber_provider_id")
            REFERENCES "transcriber_providers"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transcriber_models" DROP CONSTRAINT "FK_transcriber_models_transcriber_provider_id"`,
    );
    await queryRunner.query(`DROP TABLE "transcriber_models"`);
    await queryRunner.query(`DROP TABLE "transcriber_providers"`);
  }
}
