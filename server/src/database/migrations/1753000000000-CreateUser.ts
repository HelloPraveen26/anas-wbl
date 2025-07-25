import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUser1753000000000 implements MigrationInterface {
  name = "CreateUser1753000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum type for auth provider
    await queryRunner.query(`
      CREATE TYPE "auth_provider_enum" AS ENUM('local', 'google')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(20),
        "password" character varying,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verification_token" character varying,
        "reset_password_token" character varying,
        "reset_password_expires" TIMESTAMP,
        "auth_provider" "auth_provider_enum" NOT NULL DEFAULT 'local',
        "google_id" character varying,
        "profile_picture" character varying,
        "last_login" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create index for email
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "auth_provider_enum"`);
  }
}
