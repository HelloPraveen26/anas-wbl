import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSynthesizerVoiceAddSynthesizerModel1761280000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add the new synthesizer_model_id column (nullable temporarily)
    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD COLUMN "synthesizer_model_id" uuid
        `);

    // Step 2: Migrate existing data - map existing voice to its model
    // This query updates each assistant's synthesizer_model_id based on their current voice's model
    await queryRunner.query(`
            UPDATE "assistants" a
            SET "synthesizer_model_id" = (
                SELECT sv."synthesizer_model_id"
                FROM "synthesizer_voices" sv
                WHERE sv."id" = a."synthesizer_voice_id"
            )
            WHERE a."synthesizer_voice_id" IS NOT NULL
        `);

    // Step 3: For any assistants that still don't have a model (shouldn't happen, but safety check),
    // set them to Sarvam's bulbul:v2 model
    await queryRunner.query(`
            UPDATE "assistants"
            SET "synthesizer_model_id" = (
                SELECT sm."id"
                FROM "synthesizer_models" sm
                JOIN "synthesizer_providers" sp ON sm."synthesizer_provider_id" = sp."id"
                WHERE sp."name" = 'Sarvam' AND sm."name" = 'bulbul:v2'
                LIMIT 1
            )
            WHERE "synthesizer_model_id" IS NULL
        `);

    // Step 4: Make synthesizer_model_id NOT NULL
    await queryRunner.query(`
            ALTER TABLE "assistants"
            ALTER COLUMN "synthesizer_model_id" SET NOT NULL
        `);

    // Step 5: Drop the old foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "assistants"
            DROP CONSTRAINT IF EXISTS "FK_assistants_synthesizer_voice_id"
        `);

    // Step 6: Drop the old synthesizer_voice_id column
    await queryRunner.query(`
            ALTER TABLE "assistants"
            DROP COLUMN "synthesizer_voice_id"
        `);

    // Step 7: Add foreign key constraint for synthesizer_model_id
    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD CONSTRAINT "FK_assistants_synthesizer_model_id"
            FOREIGN KEY ("synthesizer_model_id")
            REFERENCES "synthesizer_models"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    // Step 8: Drop foreign key constraint from synthesizer_voices to synthesizer_models
    await queryRunner.query(`
            ALTER TABLE "synthesizer_voices"
            DROP CONSTRAINT IF EXISTS "FK_synthesizer_voices_synthesizer_model_id"
        `);

    // Step 9: Drop the synthesizer_voices table
    await queryRunner.query(`DROP TABLE IF EXISTS "synthesizer_voices"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Recreate synthesizer_voices table
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

    // Step 2: Add foreign key constraint for synthesizer_voices
    await queryRunner.query(`
            ALTER TABLE "synthesizer_voices"
            ADD CONSTRAINT "FK_synthesizer_voices_synthesizer_model_id"
            FOREIGN KEY ("synthesizer_model_id")
            REFERENCES "synthesizer_models"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    // Step 3: Add synthesizer_voice_id column back to assistants (nullable temporarily)
    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD COLUMN "synthesizer_voice_id" uuid
        `);

    // Step 4: Drop foreign key constraint for synthesizer_model_id
    await queryRunner.query(`
            ALTER TABLE "assistants"
            DROP CONSTRAINT IF EXISTS "FK_assistants_synthesizer_model_id"
        `);

    // Step 5: We cannot restore the exact voices data without knowing which voices existed
    // Note: Manual intervention required to restore proper voice selections
    // So we'll just make it nullable and let users reconfigure

    // Step 6: Drop synthesizer_model_id column
    await queryRunner.query(`
            ALTER TABLE "assistants"
            DROP COLUMN "synthesizer_model_id"
        `);

    // Step 7: Make synthesizer_voice_id NOT NULL with a default value
    // Using the first available voice as default
    await queryRunner.query(`
            UPDATE "assistants"
            SET "synthesizer_voice_id" = (
                SELECT "id" FROM "synthesizer_voices" LIMIT 1
            )
            WHERE "synthesizer_voice_id" IS NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "assistants"
            ALTER COLUMN "synthesizer_voice_id" SET NOT NULL
        `);

    // Step 8: Add foreign key constraint for synthesizer_voice_id
    await queryRunner.query(`
            ALTER TABLE "assistants"
            ADD CONSTRAINT "FK_assistants_synthesizer_voice_id"
            FOREIGN KEY ("synthesizer_voice_id")
            REFERENCES "synthesizer_voices"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
