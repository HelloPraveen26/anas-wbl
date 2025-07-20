import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssistant1753032624582 implements MigrationInterface {
  name = "CreateAssistant1753032624582";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "assistants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "first_message" text NOT NULL,
                "system_prompt" text NOT NULL,
                "llm_model_id" uuid NOT NULL,
                "transcriber_model_id" uuid NOT NULL,
                "synthesizer_voice_id" uuid NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_assistants" PRIMARY KEY ("id")
            )
        `);

    // Foreign key constraints for validation
    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD CONSTRAINT "FK_assistants_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD CONSTRAINT "FK_assistants_llm_model_id"
            FOREIGN KEY ("llm_model_id")
            REFERENCES "llm_models"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD CONSTRAINT "FK_assistants_transcriber_model_id"
            FOREIGN KEY ("transcriber_model_id")
            REFERENCES "transcriber_models"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD CONSTRAINT "FK_assistants_synthesizer_voice_id"
            FOREIGN KEY ("synthesizer_voice_id")
            REFERENCES "synthesizer_voices"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP CONSTRAINT "FK_assistants_synthesizer_voice_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP CONSTRAINT "FK_assistants_transcriber_model_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP CONSTRAINT "FK_assistants_llm_model_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP CONSTRAINT "FK_assistants_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "assistants"`);
  }
}
