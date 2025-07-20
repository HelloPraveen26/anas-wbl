import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSynthesizerProviderModelAndVoice1753024483738
  implements MigrationInterface
{
  name = "CreateSynthesizerProviderModelAndVoice1753024483738";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "synthesizer_providers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_synthesizer_providers_name" UNIQUE ("name"),
                CONSTRAINT "PK_synthesizer_providers" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "synthesizer_models" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "synthesizer_provider_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_synthesizer_models" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "synthesizer_voices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "synthesizer_model_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_synthesizer_voices" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "synthesizer_models"
            ADD CONSTRAINT "FK_synthesizer_models_synthesizer_provider_id"
            FOREIGN KEY ("synthesizer_provider_id")
            REFERENCES "synthesizer_providers"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "synthesizer_voices"
            ADD CONSTRAINT "FK_synthesizer_voices_synthesizer_model_id"
            FOREIGN KEY ("synthesizer_model_id")
            REFERENCES "synthesizer_models"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "synthesizer_voices" DROP CONSTRAINT "FK_synthesizer_voices_synthesizer_model_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "synthesizer_models" DROP CONSTRAINT "FK_synthesizer_models_synthesizer_provider_id"`,
    );
    await queryRunner.query(`DROP TABLE "synthesizer_voices"`);
    await queryRunner.query(`DROP TABLE "synthesizer_models"`);
    await queryRunner.query(`DROP TABLE "synthesizer_providers"`);
  }
}
