import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLlmProviderAndModel1753007214197
  implements MigrationInterface
{
  name = "CreateLlmProviderAndModel1753007214197";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "llm_providers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_llm_providers_name" UNIQUE ("name"),
                CONSTRAINT "PK_llm_providers" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "llm_models" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "llm_provider_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_llm_models" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "llm_models"
            ADD CONSTRAINT "FK_llm_models_llm_provider_id"
            FOREIGN KEY ("llm_provider_id")
            REFERENCES "llm_providers"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "llm_models" DROP CONSTRAINT "FK_llm_models_llm_provider_id"`,
    );
    await queryRunner.query(`DROP TABLE "llm_models"`);
    await queryRunner.query(`DROP TABLE "llm_providers"`);
  }
}
