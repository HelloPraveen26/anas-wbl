import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSttTtsConfigToAssistant1730820413000
  implements MigrationInterface
{
  name = "AddSttTtsConfigToAssistant1730820413000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if stt_config column exists before adding it
    const sttConfigExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='assistants' AND column_name='stt_config';
    `);

    if (sttConfigExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "assistants"
        ADD COLUMN "stt_config" jsonb
      `);
    }

    // Check if tts_config column exists before adding it
    const ttsConfigExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='assistants' AND column_name='tts_config';
    `);

    if (ttsConfigExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "assistants"
        ADD COLUMN "tts_config" jsonb
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if tts_config column exists before dropping it
    const ttsConfigExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='assistants' AND column_name='tts_config';
    `);

    if (ttsConfigExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "assistants"
        DROP COLUMN "tts_config"
      `);
    }

    // Check if stt_config column exists before dropping it
    const sttConfigExists = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='assistants' AND column_name='stt_config';
    `);

    if (sttConfigExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "assistants"
        DROP COLUMN "stt_config"
      `);
    }
  }
}
