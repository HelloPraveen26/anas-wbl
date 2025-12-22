import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRealtimeProviderSystem1761281000000
  implements MigrationInterface
{
  name = "CreateRealtimeProviderSystem1761281000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for config field types
    await queryRunner.query(`
      CREATE TYPE "config_field_type" AS ENUM ('string', 'number', 'boolean', 'select')
    `);

    // Create realtime_providers table
    await queryRunner.query(`
      CREATE TABLE "realtime_providers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_realtime_providers_name" UNIQUE ("name"),
        CONSTRAINT "PK_realtime_providers" PRIMARY KEY ("id")
      )
    `);

    // Create realtime_models table
    await queryRunner.query(`
      CREATE TABLE "realtime_models" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "realtime_provider_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_realtime_models" PRIMARY KEY ("id")
      )
    `);

    // Create realtime_configs table
    await queryRunner.query(`
      CREATE TABLE "realtime_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "label" character varying(255) NOT NULL,
        "key" character varying(100) NOT NULL,
        "type" config_field_type NOT NULL,
        "list" jsonb,
        "default_value" text,
        "active" boolean NOT NULL DEFAULT true,
        "realtime_provider_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_realtime_configs" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "realtime_models"
      ADD CONSTRAINT "FK_realtime_models_realtime_provider_id"
      FOREIGN KEY ("realtime_provider_id")
      REFERENCES "realtime_providers"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "realtime_configs"
      ADD CONSTRAINT "FK_realtime_configs_realtime_provider_id"
      FOREIGN KEY ("realtime_provider_id")
      REFERENCES "realtime_providers"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add realtime columns to assistants table
    await queryRunner.query(`
      ALTER TABLE "assistants"
      ADD COLUMN "realtime_model_id" uuid,
      ADD COLUMN "realtime_config" json NOT NULL DEFAULT '{}'
    `);

    // Add foreign key constraint for assistants.realtime_model_id
    await queryRunner.query(`
      ALTER TABLE "assistants"
      ADD CONSTRAINT "FK_assistants_realtime_model_id"
      FOREIGN KEY ("realtime_model_id")
      REFERENCES "realtime_models"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_providers_active" ON "realtime_providers" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_providers_name" ON "realtime_providers" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_models_active" ON "realtime_models" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_models_provider" ON "realtime_models" ("realtime_provider_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_models_name" ON "realtime_models" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_configs_active" ON "realtime_configs" ("active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_configs_provider" ON "realtime_configs" ("realtime_provider_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_realtime_configs_key" ON "realtime_configs" ("key")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assistants_realtime_model" ON "assistants" ("realtime_model_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_assistants_realtime_model"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_realtime_configs_key"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_realtime_configs_provider"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_realtime_configs_active"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_realtime_models_name"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_realtime_models_provider"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_realtime_models_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_realtime_providers_name"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_realtime_providers_active"`,
    );

    // Remove foreign key constraint from assistants table
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP CONSTRAINT IF EXISTS "FK_assistants_realtime_model_id"`,
    );

    // Remove realtime columns from assistants table
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP COLUMN IF EXISTS "realtime_model_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistants" DROP COLUMN IF EXISTS "realtime_config"`,
    );

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "realtime_configs" DROP CONSTRAINT "FK_realtime_configs_realtime_provider_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "realtime_models" DROP CONSTRAINT "FK_realtime_models_realtime_provider_id"`,
    );

    // Drop tables in reverse order (due to foreign key constraints)
    await queryRunner.query(`DROP TABLE "realtime_configs"`);
    await queryRunner.query(`DROP TABLE "realtime_models"`);
    await queryRunner.query(`DROP TABLE "realtime_providers"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "config_field_type"`);
  }
}
